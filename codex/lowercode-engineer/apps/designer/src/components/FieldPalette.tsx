import { Button } from "antd";
import { FIELD_TYPE_DEFINITIONS } from "@lowercode/schema-utils";
import type { FieldType } from "@lowercode/types";

interface FieldPaletteProps {
  onAdd: (type: FieldType) => void;
}

export default function FieldPalette({ onAdd }: FieldPaletteProps) {
  return (
    <section className="panel">
      <div className="panel-header">
        <p className="eyebrow">Material Shelf</p>
        <h2>字段库</h2>
        <p className="muted">
          点一下就会把字段塞进画布。字段协议完全跟渲染器对齐，导出的 JSON 可以直接粘贴使用。
        </p>
      </div>

      <div className="palette-grid">
        {FIELD_TYPE_DEFINITIONS.map((definition) => (
          <button
            key={definition.type}
            className="palette-card"
            onClick={() => onAdd(definition.type)}
            style={{ ["--accent" as string]: definition.accent }}
            type="button"
          >
            <span className="palette-chip">{definition.type}</span>
            <strong>{definition.title}</strong>
            <span>{definition.description}</span>
          </button>
        ))}
      </div>

      <Button block size="large" type="dashed" onClick={() => onAdd("text")}>
        从一个文本字段开始
      </Button>
    </section>
  );
}
