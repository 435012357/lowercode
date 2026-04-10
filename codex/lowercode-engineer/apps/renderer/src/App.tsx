import { useEffect, useMemo, useState } from "react";
import { Alert, App as AntdApp, Button, Input, Statistic, Tag } from "antd";
import {
  SCHEMA_STORAGE_KEY,
  createSampleSchema,
  normalizeSchema,
  serializeSchema,
} from "@lowercode/schema-utils";
import type { RendererSchema } from "@lowercode/types";
import CRUDRenderer from "./components/CRUDRenderer";

function loadInitialText() {
  if (typeof window === "undefined") {
    return serializeSchema(createSampleSchema());
  }

  return (
    window.localStorage.getItem(SCHEMA_STORAGE_KEY) ??
    serializeSchema(createSampleSchema())
  );
}

export default function App() {
  const { message } = AntdApp.useApp();
  const [schemaText, setSchemaText] = useState(() => loadInitialText());
  const [schema, setSchema] = useState<RendererSchema | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const initial = normalizeSchema(schemaText);
      setSchema(initial);
      setError(null);
    } catch (exception) {
      setSchema(null);
      setError(exception instanceof Error ? exception.message : "Schema 解析失败");
    }
  }, []);

  const statItems = useMemo(() => {
    if (!schema) {
      return null;
    }

    return {
      fieldCount: schema.fields.length,
      listCount: schema.fields.filter((item) => item.showInList).length,
      detailCount: schema.fields.filter((item) => item.showInDetail).length,
    };
  }, [schema]);

  function applySchema(text = schemaText, successText = "Schema 已应用") {
    try {
      const next = normalizeSchema(text);
      const nextText = serializeSchema(next);
      setSchema(next);
      setSchemaText(nextText);
      setError(null);
      window.localStorage.setItem(SCHEMA_STORAGE_KEY, nextText);
      message.success(successText);
    } catch (exception) {
      setSchema(null);
      setError(exception instanceof Error ? exception.message : "Schema 解析失败");
      message.error("JSON 不合法，无法渲染");
    }
  }

  function loadLatestSchema() {
    const latest = window.localStorage.getItem(SCHEMA_STORAGE_KEY);

    if (!latest) {
      message.warning("本地还没有最近导出的 Schema");
      return;
    }

    applySchema(latest, "已载入最近一次导出的 Schema");
  }

  function loadSampleSchema() {
    const sample = serializeSchema(createSampleSchema());
    applySchema(sample, "已载入示例 Schema");
  }

  function formatSchema() {
    try {
      const normalized = normalizeSchema(schemaText);
      setSchemaText(serializeSchema(normalized));
      setError(null);
      message.success("JSON 已格式化");
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Schema 解析失败");
      message.error("格式化失败，请先修正 JSON");
    }
  }

  return (
    <div className="renderer-page">
      <header className="renderer-hero">
        <div>
          <p className="eyebrow">Paste, Parse, Render</p>
          <h1>把设计器导出的 JSON 粘进来，直接跑本地 CRUD</h1>
          <p className="hero-copy">
            这页不依赖接口。Schema 来自设计器，数据记录存在浏览器本地，方便你直接验证
            JSON 协议和渲染效果。
          </p>
        </div>

        <div className="hero-actions">
          <Button size="large" type="primary" onClick={() => applySchema()}>
            应用 JSON
          </Button>
          <Button size="large" onClick={loadLatestSchema}>
            使用最近导出
          </Button>
          <Button size="large" onClick={loadSampleSchema}>
            载入示例
          </Button>
          <Button size="large" type="text" onClick={formatSchema}>
            格式化 JSON
          </Button>
        </div>
      </header>

      <main className="renderer-grid">
        <section className="panel json-panel">
          <div className="panel-header">
            <p className="eyebrow">Schema Input</p>
            <h2>JSON 工作台</h2>
            <p className="muted">
              左边粘贴结构，右边立即渲染。渲染器会把最近一次成功应用的 Schema 存回本地。
            </p>
          </div>

          {error ? (
            <Alert
              type="error"
              showIcon
              message="JSON 解析失败"
              description={error}
              style={{ marginBottom: 16 }}
            />
          ) : null}

          <Input.TextArea
            className="code-editor"
            value={schemaText}
            onChange={(event) => setSchemaText(event.target.value)}
            autoSize={{ minRows: 28, maxRows: 36 }}
          />
        </section>

        <section className="preview-column">
          <section className="panel preview-summary">
            <div className="panel-header">
              <p className="eyebrow">Schema Snapshot</p>
              <h2>{schema?.name ?? "等待可用 Schema"}</h2>
              <p className="muted">
                {schema?.description ?? "一旦 JSON 解析成功，这里会展示元信息和实时 CRUD 预览。"}
              </p>
            </div>

            {schema && statItems ? (
              <>
                <div className="stats-row">
                  <Statistic title="字段数量" value={statItems.fieldCount} />
                  <Statistic title="列表列数" value={statItems.listCount} />
                  <Statistic title="详情字段数" value={statItems.detailCount} />
                </div>
                <div className="tag-row">
                  <Tag color="processing">formUuid: {schema.formUuid}</Tag>
                  <Tag color="success">model: {schema.modelName}</Tag>
                  <Tag color="gold">version: {schema.version}</Tag>
                </div>
              </>
            ) : null}
          </section>

          <section className="panel preview-panel">
            {schema ? (
              <CRUDRenderer schema={schema} />
            ) : (
              <div className="empty-preview-copy">
                <h3>等待一份合法的 JSON</h3>
                <p>把设计器导出的内容贴到左边，点“应用 JSON”就可以了。</p>
              </div>
            )}
          </section>
        </section>
      </main>
    </div>
  );
}
