import { Button, Input, InputNumber, Switch } from "antd";
import { FIELD_TYPE_DEFINITIONS, sanitizeFieldName } from "@lowercode/schema-utils";
import type { FieldOption, FieldSchema } from "@lowercode/types";

interface FieldEditorProps {
  field: FieldSchema | null;
  onChange: (field: FieldSchema) => void;
}

export default function FieldEditor({ field, onChange }: FieldEditorProps) {
  if (!field) {
    return (
      <section className="panel editor-panel">
        <div className="panel-header">
          <p className="eyebrow">Inspector</p>
          <h2>字段属性</h2>
          <p className="muted">选中一个字段后，这里会出现它的完整配置。</p>
        </div>
      </section>
    );
  }

  const typeMeta = FIELD_TYPE_DEFINITIONS.find((item) => item.type === field.type);
  const options = field.props?.options ?? [];

  function update(patch: Partial<FieldSchema>) {
    onChange({
      ...field,
      ...patch,
      props: {
        ...field.props,
        ...(patch.props ?? {}),
      },
    });
  }

  function updateOption(index: number, patch: Partial<FieldOption>) {
    const nextOptions = options.map((option, currentIndex) =>
      currentIndex === index ? { ...option, ...patch } : option,
    );

    update({
      props: {
        ...field.props,
        options: nextOptions,
      },
    });
  }

  function addOption() {
    update({
      props: {
        ...field.props,
        options: [
          ...options,
          {
            label: `选项 ${options.length + 1}`,
            value: `option_${options.length + 1}`,
          },
        ],
      },
    });
  }

  function removeOption(index: number) {
    update({
      props: {
        ...field.props,
        options: options.filter((_, currentIndex) => currentIndex !== index),
      },
    });
  }

  return (
    <section className="panel editor-panel">
      <div className="panel-header">
        <p className="eyebrow">Inspector</p>
        <h2>字段属性</h2>
        <p className="muted">
          当前字段类型：<span className="mono">{typeMeta?.title ?? field.type}</span>
        </p>
      </div>

      <div className="inspector-grid">
        <label className="input-shell">
          <span>字段标题</span>
          <Input
            value={field.label}
            onChange={(event) => update({ label: event.target.value })}
            placeholder="例如：客户名称"
          />
        </label>

        <label className="input-shell">
          <span>字段名</span>
          <Input
            value={field.field}
            onChange={(event) =>
              update({
                field: sanitizeFieldName(event.target.value),
              })
            }
            placeholder="例如：customer_name"
          />
        </label>

        {field.type !== "switch" ? (
          <label className="input-shell span-2">
            <span>占位提示</span>
            <Input
              value={field.props?.placeholder}
              onChange={(event) =>
                update({
                  props: {
                    ...field.props,
                    placeholder: event.target.value,
                  },
                })
              }
              placeholder="可选"
            />
          </label>
        ) : null}

        <div className="toggle-row">
          <span>必填</span>
          <Switch
            checked={field.required}
            onChange={(checked) => update({ required: checked })}
          />
        </div>

        <div className="toggle-row">
          <span>显示在列表</span>
          <Switch
            checked={field.showInList}
            onChange={(checked) => update({ showInList: checked })}
          />
        </div>

        <div className="toggle-row">
          <span>显示在详情</span>
          <Switch
            checked={field.showInDetail}
            onChange={(checked) => update({ showInDetail: checked })}
          />
        </div>

        {field.type === "textarea" ? (
          <label className="input-shell">
            <span>文本行数</span>
            <InputNumber
              min={2}
              max={12}
              value={field.props?.rows ?? 4}
              onChange={(value) =>
                update({
                  props: {
                    ...field.props,
                    rows: typeof value === "number" ? value : 4,
                  },
                })
              }
            />
          </label>
        ) : null}

        {field.type === "digit" ? (
          <>
            <label className="input-shell">
              <span>最小值</span>
              <InputNumber
                value={field.props?.min ?? 0}
                onChange={(value) =>
                  update({
                    props: {
                      ...field.props,
                      min: typeof value === "number" ? value : 0,
                    },
                  })
                }
              />
            </label>
            <label className="input-shell">
              <span>最大值</span>
              <InputNumber
                value={field.props?.max ?? 999999}
                onChange={(value) =>
                  update({
                    props: {
                      ...field.props,
                      max: typeof value === "number" ? value : 999999,
                    },
                  })
                }
              />
            </label>
            <label className="input-shell">
              <span>小数位数</span>
              <InputNumber
                min={0}
                max={6}
                value={field.props?.precision ?? 0}
                onChange={(value) =>
                  update({
                    props: {
                      ...field.props,
                      precision: typeof value === "number" ? value : 0,
                    },
                  })
                }
              />
            </label>
          </>
        ) : null}

        {field.type === "date" ? (
          <label className="input-shell">
            <span>日期格式</span>
            <Input
              value={field.props?.format ?? "YYYY-MM-DD"}
              onChange={(event) =>
                update({
                  props: {
                    ...field.props,
                    format: event.target.value || "YYYY-MM-DD",
                  },
                })
              }
            />
          </label>
        ) : null}

        {field.type === "select" ||
        field.type === "radio" ||
        field.type === "checkbox" ? (
          <div className="option-editor span-2">
            <div className="option-editor-header">
              <span>选项配置</span>
              <Button size="small" onClick={addOption}>
                添加选项
              </Button>
            </div>

            <div className="option-list">
              {options.map((option, index) => (
                <div key={`${option.value}-${index}`} className="option-row">
                  <Input
                    value={option.label}
                    placeholder="展示文案"
                    onChange={(event) =>
                      updateOption(index, { label: event.target.value })
                    }
                  />
                  <Input
                    value={option.value}
                    placeholder="值"
                    onChange={(event) =>
                      updateOption(index, {
                        value: sanitizeFieldName(event.target.value),
                      })
                    }
                  />
                  <Button danger type="text" onClick={() => removeOption(index)}>
                    删除
                  </Button>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
