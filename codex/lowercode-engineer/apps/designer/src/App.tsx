import { useEffect, useMemo, useState } from "react";
import {
  App as AntdApp,
  Button,
  Input,
  Modal,
  Popconfirm,
  Statistic,
  Tag,
} from "antd";
import {
  SCHEMA_STORAGE_KEY,
  createDefaultField,
  createEmptySchema,
  createSampleSchema,
  ensureSchemaReady,
  normalizeSchema,
  sanitizeFieldName,
  serializeSchema,
} from "@lowercode/schema-utils";
import type { FieldSchema, RendererSchema } from "@lowercode/types";
import FieldEditor from "./components/FieldEditor";
import FieldList from "./components/FieldList";
import FieldPalette from "./components/FieldPalette";

const DRAFT_STORAGE_KEY = "lowercode.designer-draft";

function loadInitialSchema() {
  if (typeof window === "undefined") {
    return createSampleSchema();
  }

  const draft = window.localStorage.getItem(DRAFT_STORAGE_KEY);

  if (!draft) {
    return createSampleSchema();
  }

  try {
    return normalizeSchema(draft);
  } catch {
    return createSampleSchema();
  }
}

export default function App() {
  const { message } = AntdApp.useApp();
  const [schema, setSchema] = useState<RendererSchema>(() => loadInitialSchema());
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(
    schema.fields[0]?.id ?? null,
  );
  const [importOpen, setImportOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [exportText, setExportText] = useState("");

  const selectedField = useMemo(
    () => schema.fields.find((item) => item.id === selectedFieldId) ?? null,
    [schema.fields, selectedFieldId],
  );

  useEffect(() => {
    if (!schema.fields.length) {
      setSelectedFieldId(null);
      return;
    }

    const exists = schema.fields.some((item) => item.id === selectedFieldId);

    if (!exists) {
      setSelectedFieldId(schema.fields[0].id);
    }
  }, [schema.fields, selectedFieldId]);

  function commit(next: RendererSchema) {
    const withTime = {
      ...next,
      updatedAt: new Date().toISOString(),
    };

    setSchema(withTime);
    window.localStorage.setItem(DRAFT_STORAGE_KEY, serializeSchema(withTime));
  }

  function updateField(field: FieldSchema) {
    commit({
      ...schema,
      fields: schema.fields.map((item) => (item.id === field.id ? field : item)),
    });
  }

  function handleAddField(type: FieldSchema["type"]) {
    const nextField = createDefaultField(type);

    commit({
      ...schema,
      fields: [...schema.fields, nextField],
    });

    setSelectedFieldId(nextField.id);
  }

  function handleMoveField(fieldId: string, direction: -1 | 1) {
    const currentIndex = schema.fields.findIndex((item) => item.id === fieldId);

    if (currentIndex < 0) {
      return;
    }

    const targetIndex = currentIndex + direction;

    if (targetIndex < 0 || targetIndex >= schema.fields.length) {
      return;
    }

    const nextFields = [...schema.fields];
    const [moved] = nextFields.splice(currentIndex, 1);
    nextFields.splice(targetIndex, 0, moved);

    commit({
      ...schema,
      fields: nextFields,
    });
  }

  function handleRemoveField(fieldId: string) {
    commit({
      ...schema,
      fields: schema.fields.filter((item) => item.id !== fieldId),
    });
  }

  async function handleExport() {
    try {
      ensureSchemaReady(schema);
      const next = {
        ...schema,
        updatedAt: new Date().toISOString(),
      };
      const text = serializeSchema(next);

      setExportText(text);
      setExportOpen(true);
      setSchema(next);
      window.localStorage.setItem(DRAFT_STORAGE_KEY, text);
      window.localStorage.setItem(SCHEMA_STORAGE_KEY, text);

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      }

      message.success("JSON 已导出，并复制到剪贴板");
    } catch (error) {
      message.error(error instanceof Error ? error.message : "导出失败");
    }
  }

  function handleImport() {
    try {
      const next = normalizeSchema(importText);
      commit(next);
      setSelectedFieldId(next.fields[0]?.id ?? null);
      setImportOpen(false);
      setImportText("");
      message.success("JSON 已导入");
    } catch (error) {
      message.error(error instanceof Error ? error.message : "导入失败");
    }
  }

  function handleLoadSample() {
    const next = createSampleSchema();
    commit(next);
    setSelectedFieldId(next.fields[0]?.id ?? null);
    message.success("已载入示例模板");
  }

  function handleReset() {
    const next = createEmptySchema();
    commit(next);
    setSelectedFieldId(null);
    message.success("已重置为空白表单");
  }

  return (
    <div className="designer-page">
      <header className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Front-end Only Low-Code</p>
          <h1>把表单结构设计出来，然后直接导出 JSON</h1>
          <p className="hero-description">
            这版不依赖后端。你在这里编排字段、填写元信息，点击导出后就能拿到一份标准
            JSON，复制进渲染器即可直接跑 CRUD。
          </p>
        </div>

        <div className="hero-actions">
          <Button size="large" type="primary" onClick={handleExport}>
            导出 JSON
          </Button>
          <Button size="large" onClick={() => setImportOpen(true)}>
            导入 JSON
          </Button>
          <Button size="large" onClick={handleLoadSample}>
            载入示例
          </Button>
          <Popconfirm
            title="清空当前表单？"
            description="草稿会被重置，但你刚导出的 JSON 不会丢。"
            onConfirm={handleReset}
            okText="清空"
            cancelText="取消"
          >
            <Button size="large" type="text">
              重置为空白
            </Button>
          </Popconfirm>
        </div>
      </header>

      <section className="meta-strip">
        <div className="panel meta-form">
          <div className="panel-header">
            <p className="eyebrow">Schema Meta</p>
            <h2>表单信息</h2>
          </div>

          <div className="meta-grid">
            <label className="input-shell">
              <span>表单名称</span>
              <Input
                value={schema.name}
                onChange={(event) =>
                  commit({
                    ...schema,
                    name: event.target.value,
                  })
                }
                placeholder="例如：客户信息表"
              />
            </label>

            <label className="input-shell">
              <span>模型名称</span>
              <Input
                value={schema.modelName}
                onChange={(event) =>
                  commit({
                    ...schema,
                    modelName: sanitizeFieldName(event.target.value),
                  })
                }
                placeholder="例如：customer_profile"
              />
            </label>

            <label className="input-shell span-2">
              <span>说明</span>
              <Input.TextArea
                value={schema.description}
                onChange={(event) =>
                  commit({
                    ...schema,
                    description: event.target.value,
                  })
                }
                autoSize={{ minRows: 2, maxRows: 4 }}
                placeholder="给这个表单补一句背景说明，渲染器会展示出来"
              />
            </label>
          </div>
        </div>

        <div className="panel stat-panel">
          <div className="stats-row">
            <Statistic title="字段数量" value={schema.fields.length} />
            <Statistic
              title="列表列数"
              value={schema.fields.filter((item) => item.showInList).length}
            />
            <Statistic
              title="详情字段数"
              value={schema.fields.filter((item) => item.showInDetail).length}
            />
          </div>

          <div className="stat-tags">
            <Tag color="processing">formUuid: {schema.formUuid}</Tag>
            <Tag color="gold">model: {schema.modelName}</Tag>
            <Tag color="success">version: {schema.version}</Tag>
          </div>
        </div>
      </section>

      <main className="workspace-grid">
        <FieldPalette onAdd={handleAddField} />
        <FieldList
          fields={schema.fields}
          selectedFieldId={selectedFieldId}
          onSelect={setSelectedFieldId}
          onMove={handleMoveField}
          onRemove={handleRemoveField}
        />
        <FieldEditor field={selectedField} onChange={updateField} />
      </main>

      <section className="panel export-teaser">
        <div className="panel-header">
          <p className="eyebrow">Workflow</p>
          <h2>使用方式</h2>
        </div>

        <div className="workflow-list">
          <div>
            <strong>1. 设计结构</strong>
            <span>左侧加字段，中间排顺序，右侧补细节。</span>
          </div>
          <div>
            <strong>2. 导出 JSON</strong>
            <span>点击顶部按钮，自动复制到剪贴板并存到本地。</span>
          </div>
          <div>
            <strong>3. 粘贴到渲染器</strong>
            <span>渲染器能直接解析这份 JSON，不需要任何接口。</span>
          </div>
        </div>
      </section>

      <Modal
        open={importOpen}
        onCancel={() => setImportOpen(false)}
        onOk={handleImport}
        okText="导入"
        cancelText="取消"
        width={880}
      >
        <div className="modal-head">
          <p className="eyebrow">Import Schema</p>
          <h2>把 JSON 粘进来</h2>
          <p className="muted">
            只要符合当前协议，导入后就会立即转成设计器草稿。
          </p>
        </div>
        <Input.TextArea
          value={importText}
          onChange={(event) => setImportText(event.target.value)}
          autoSize={{ minRows: 18, maxRows: 24 }}
          className="code-area"
        />
      </Modal>

      <Modal
        open={exportOpen}
        onCancel={() => setExportOpen(false)}
        footer={null}
        width={920}
      >
        <div className="modal-head">
          <p className="eyebrow">Export Schema</p>
          <h2>这就是给渲染器的 JSON</h2>
          <p className="muted">
            已经复制到剪贴板，同时也缓存到了浏览器本地，渲染器页可以直接读取最近一次导出。
          </p>
        </div>

        <Input.TextArea
          readOnly
          value={exportText}
          autoSize={{ minRows: 18, maxRows: 24 }}
          className="code-area"
        />

        <div className="modal-actions">
          <Button
            onClick={async () => {
              await navigator.clipboard.writeText(exportText);
              message.success("已再次复制 JSON");
            }}
          >
            再复制一次
          </Button>
        </div>
      </Modal>
    </div>
  );
}
