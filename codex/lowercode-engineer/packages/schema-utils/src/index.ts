import type {
  FieldOption,
  FieldSchema,
  FieldType,
  FieldTypeDefinition,
  RendererSchema,
} from "@lowercode/types";

export const SCHEMA_STORAGE_KEY = "lowercode.latest-schema";

export const FIELD_TYPE_DEFINITIONS: FieldTypeDefinition[] = [
  {
    type: "text",
    title: "单行文本",
    description: "适合短标题、名称、编号",
    accent: "#c5512f",
  },
  {
    type: "textarea",
    title: "多行文本",
    description: "适合说明、备注、长文本",
    accent: "#6b5dfc",
  },
  {
    type: "digit",
    title: "数字",
    description: "支持范围与精度约束",
    accent: "#2f9476",
  },
  {
    type: "select",
    title: "下拉选择",
    description: "从预设选项中选择一项",
    accent: "#1274d4",
  },
  {
    type: "date",
    title: "日期",
    description: "适合日期与计划时间",
    accent: "#c17d14",
  },
  {
    type: "switch",
    title: "开关",
    description: "用于真假、启停状态",
    accent: "#18683d",
  },
  {
    type: "radio",
    title: "单选",
    description: "用按钮组表达互斥项",
    accent: "#912e56",
  },
  {
    type: "checkbox",
    title: "多选",
    description: "适合标签、能力、偏好",
    accent: "#4e4e4e",
  },
];

const FIELD_TYPE_SET = new Set<FieldType>(
  FIELD_TYPE_DEFINITIONS.map((item) => item.type),
);

const MODEL_NAME_REGEXP = /^[a-z][a-z0-9_]*$/;

function makeId(prefix: string) {
  const cryptoApi = globalThis.crypto as Crypto | undefined;
  if (cryptoApi && typeof cryptoApi.randomUUID === "function") {
    return `${prefix}_${cryptoApi.randomUUID().replace(/-/g, "").slice(0, 12)}`;
  }

  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function sanitizeFieldName(input: string) {
  const normalized = input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_");

  const asciiOnly = normalized
    .replace(/[\u4e00-\u9fa5]/g, "")
    .replace(/^_+|_+$/g, "");

  const fallback = asciiOnly || "field";
  const safe = /^[a-z]/.test(fallback) ? fallback : `field_${fallback}`;
  return safe.replace(/[^a-z0-9_]/g, "_");
}

function defaultOptions(): FieldOption[] {
  return [
    { label: "选项 1", value: "option_1" },
    { label: "选项 2", value: "option_2" },
  ];
}

export function createDefaultField(type: FieldType): FieldSchema {
  const id = makeId("field");
  const fallbackField = `field_${id.slice(-6)}`;
  const base: FieldSchema = {
    id,
    label: FIELD_TYPE_DEFINITIONS.find((item) => item.type === type)?.title ?? "字段",
    field: fallbackField,
    type,
    required: false,
    showInList: true,
    showInDetail: true,
    props: {},
  };

  switch (type) {
    case "textarea":
      return { ...base, props: { rows: 4, placeholder: "请输入内容" } };
    case "digit":
      return {
        ...base,
        props: {
          min: 0,
          max: 999999,
          precision: 0,
          placeholder: "请输入数字",
        },
      };
    case "select":
    case "radio":
    case "checkbox":
      return {
        ...base,
        props: {
          options: defaultOptions(),
        },
      };
    case "date":
      return {
        ...base,
        props: {
          format: "YYYY-MM-DD",
        },
      };
    case "switch":
      return base;
    case "text":
    default:
      return {
        ...base,
        props: {
          placeholder: "请输入内容",
        },
      };
  }
}

export function createEmptySchema(): RendererSchema {
  const now = new Date().toISOString();

  return {
    version: "1.0.0",
    formUuid: makeId("form"),
    name: "未命名表单",
    modelName: "untitled_form",
    description: "在设计器里补充字段后导出 JSON，再复制到渲染器中直接使用。",
    createdAt: now,
    updatedAt: now,
    fields: [],
  };
}

export function createSampleSchema(): RendererSchema {
  const schema = createEmptySchema();

  return {
    ...schema,
    name: "活动报名表",
    modelName: "event_registration",
    description: "演示用模板，包含常见的文本、枚举与布尔字段。",
    fields: [
      {
        ...createDefaultField("text"),
        label: "姓名",
        field: "name",
        required: true,
      },
      {
        ...createDefaultField("select"),
        label: "参与场次",
        field: "session",
        required: true,
        props: {
          options: [
            { label: "上午场", value: "am" },
            { label: "下午场", value: "pm" },
            { label: "全天", value: "full_day" },
          ],
        },
      },
      {
        ...createDefaultField("checkbox"),
        label: "关注议题",
        field: "topics",
        showInList: false,
        props: {
          options: [
            { label: "前端工程化", value: "frontend" },
            { label: "低代码平台", value: "lowcode" },
            { label: "AI 工作流", value: "ai" },
          ],
        },
      },
      {
        ...createDefaultField("switch"),
        label: "是否需要会后资料",
        field: "need_materials",
        showInList: true,
      },
    ],
  };
}

function assertString(value: unknown, label: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${label}不能为空`);
  }

  return value.trim();
}

function normalizeOptions(value: unknown): FieldOption[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  return value
    .map((option) => {
      if (!option || typeof option !== "object") {
        return null;
      }

      const label = typeof option.label === "string" ? option.label.trim() : "";
      const rawValue =
        typeof option.value === "string" || typeof option.value === "number"
          ? String(option.value)
          : "";

      if (!label || !rawValue) {
        return null;
      }

      return { label, value: rawValue };
    })
    .filter((item): item is FieldOption => item !== null);
}

function normalizeField(field: unknown, index: number): FieldSchema {
  if (!field || typeof field !== "object") {
    throw new Error(`第 ${index + 1} 个字段不是合法对象`);
  }

  const rawField = field as Partial<FieldSchema>;
  const type = rawField.type;

  if (!type || !FIELD_TYPE_SET.has(type)) {
    throw new Error(`第 ${index + 1} 个字段类型不支持`);
  }

  const label = assertString(rawField.label, `第 ${index + 1} 个字段标题`);
  const name = sanitizeFieldName(assertString(rawField.field, `第 ${index + 1} 个字段名`));

  const props = (rawField.props ?? {}) as Record<string, unknown>;

  const normalized: FieldSchema = {
    id: typeof rawField.id === "string" && rawField.id ? rawField.id : makeId("field"),
    label,
    field: name,
    type,
    required: Boolean(rawField.required),
    showInList: rawField.showInList ?? true,
    showInDetail: rawField.showInDetail ?? true,
    props: {},
  };

  if (type === "textarea") {
    normalized.props = {
      rows: typeof props.rows === "number" ? props.rows : 4,
      placeholder: typeof props.placeholder === "string" ? props.placeholder : undefined,
    };
  }

  if (type === "digit") {
    normalized.props = {
      min: typeof props.min === "number" ? props.min : 0,
      max: typeof props.max === "number" ? props.max : 999999,
      precision: typeof props.precision === "number" ? props.precision : 0,
      placeholder: typeof props.placeholder === "string" ? props.placeholder : undefined,
    };
  }

  if (type === "select" || type === "radio" || type === "checkbox") {
    normalized.props = {
      options: normalizeOptions(props.options) ?? defaultOptions(),
    };
  }

  if (type === "date") {
    normalized.props = {
      format: typeof props.format === "string" ? props.format : "YYYY-MM-DD",
    };
  }

  if (type === "text") {
    normalized.props = {
      placeholder: typeof props.placeholder === "string" ? props.placeholder : undefined,
    };
  }

  return normalized;
}

export function normalizeSchema(input: string | unknown): RendererSchema {
  const raw = typeof input === "string" ? JSON.parse(input) : input;

  if (!raw || typeof raw !== "object") {
    throw new Error("Schema 必须是对象");
  }

  const source = raw as Partial<RendererSchema>;
  const fields = Array.isArray(source.fields)
    ? source.fields.map((item, index) => normalizeField(item, index))
    : [];

  const uniqueFieldNames = new Set<string>();

  fields.forEach((field) => {
    if (uniqueFieldNames.has(field.field)) {
      throw new Error(`字段名重复：${field.field}`);
    }

    uniqueFieldNames.add(field.field);
  });

  const modelName = assertString(source.modelName, "模型名称");

  if (!MODEL_NAME_REGEXP.test(modelName)) {
    throw new Error("模型名称只能包含小写字母、数字、下划线，且必须以字母开头");
  }

  return {
    version: "1.0.0",
    formUuid:
      typeof source.formUuid === "string" && source.formUuid
        ? source.formUuid
        : makeId("form"),
    name: assertString(source.name, "表单名称"),
    modelName,
    description:
      typeof source.description === "string" ? source.description.trim() : undefined,
    createdAt:
      typeof source.createdAt === "string" && source.createdAt
        ? source.createdAt
        : new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    fields,
  };
}

export function serializeSchema(schema: RendererSchema) {
  return JSON.stringify(schema, null, 2);
}

export function fieldOptionsToMap(field: FieldSchema) {
  const options = field.props?.options ?? [];

  return options.reduce<Record<string, { text: string }>>((acc, option) => {
    acc[option.value] = { text: option.label };
    return acc;
  }, {});
}

export function ensureSchemaReady(schema: RendererSchema) {
  if (!schema.fields.length) {
    throw new Error("请至少添加一个字段后再导出");
  }

  if (!MODEL_NAME_REGEXP.test(schema.modelName)) {
    throw new Error("模型名称只能包含小写字母、数字、下划线，且必须以字母开头");
  }

  const uniqueFieldNames = new Set<string>();

  schema.fields.forEach((field) => {
    if (!field.label.trim()) {
      throw new Error("字段标题不能为空");
    }

    if (!MODEL_NAME_REGEXP.test(field.field)) {
      throw new Error(`字段名不合法：${field.field}`);
    }

    if (uniqueFieldNames.has(field.field)) {
      throw new Error(`字段名重复：${field.field}`);
    }

    uniqueFieldNames.add(field.field);
  });

  return true;
}
