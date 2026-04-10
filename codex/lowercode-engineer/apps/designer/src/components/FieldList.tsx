import { Button, Empty, Popconfirm, Tag } from "antd";
import { FIELD_TYPE_DEFINITIONS } from "@lowercode/schema-utils";
import type { FieldSchema } from "@lowercode/types";

interface FieldListProps {
  fields: FieldSchema[];
  selectedFieldId: string | null;
  onSelect: (fieldId: string) => void;
  onMove: (fieldId: string, direction: -1 | 1) => void;
  onRemove: (fieldId: string) => void;
}

export default function FieldList({
  fields,
  selectedFieldId,
  onSelect,
  onMove,
  onRemove,
}: FieldListProps) {
  return (
    <section className="panel">
      <div className="panel-header">
        <p className="eyebrow">Canvas Queue</p>
        <h2>字段编排</h2>
        <p className="muted">这里决定表单渲染顺序，也就是渲染器里表单和详情的展示顺序。</p>
      </div>

      {fields.length === 0 ? (
        <div className="empty-shell">
          <Empty description="还没有字段，先从左侧添加一项" />
        </div>
      ) : (
        <div className="field-list">
          {fields.map((field, index) => {
            const meta = FIELD_TYPE_DEFINITIONS.find((item) => item.type === field.type);
            const selected = selectedFieldId === field.id;

            return (
              <button
                key={field.id}
                className={`field-row ${selected ? "is-selected" : ""}`}
                onClick={() => onSelect(field.id)}
                type="button"
              >
                <div className="field-row-main">
                  <div className="field-row-title">
                    <strong>{field.label}</strong>
                    <Tag bordered={false} color="default">
                      {meta?.title ?? field.type}
                    </Tag>
                  </div>
                  <span className="muted mono">{field.field}</span>
                </div>

                <div className="field-row-actions">
                  <Button
                    size="small"
                    type="text"
                    onClick={(event) => {
                      event.stopPropagation();
                      onMove(field.id, -1);
                    }}
                    disabled={index === 0}
                  >
                    ↑
                  </Button>
                  <Button
                    size="small"
                    type="text"
                    onClick={(event) => {
                      event.stopPropagation();
                      onMove(field.id, 1);
                    }}
                    disabled={index === fields.length - 1}
                  >
                    ↓
                  </Button>
                  <Popconfirm
                    title="删除这个字段？"
                    description="导出 JSON 时它也会一起被移除。"
                    onConfirm={(event) => {
                      event?.stopPropagation();
                      onRemove(field.id);
                    }}
                    okText="删除"
                    cancelText="取消"
                  >
                    <Button
                      size="small"
                      danger
                      type="text"
                      onClick={(event) => event.stopPropagation()}
                    >
                      删除
                    </Button>
                  </Popconfirm>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
