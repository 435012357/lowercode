import type {
  ProColumns,
  ProDescriptionsItemProps,
  ProFormColumnsType,
} from "@ant-design/pro-components";
import { Tag } from "antd";
import { fieldOptionsToMap } from "@lowercode/schema-utils";
import type { FieldSchema, StoredRecord } from "@lowercode/types";

type FormRecord = Record<string, unknown>;

function getValueEnum(field: FieldSchema) {
  if (
    field.type === "select" ||
    field.type === "radio" ||
    field.type === "checkbox"
  ) {
    return fieldOptionsToMap(field);
  }

  return undefined;
}

export function formatFieldValue(field: FieldSchema, value: unknown) {
  if (field.type === "switch") {
    return value ? "开启" : "关闭";
  }

  if (field.type === "checkbox") {
    const options = field.props?.options ?? [];
    const selected = Array.isArray(value) ? value.map(String) : [];

    return selected
      .map((item) => options.find((option) => option.value === item)?.label ?? item)
      .join("、");
  }

  if (field.type === "select" || field.type === "radio") {
    const options = field.props?.options ?? [];
    const current = options.find((option) => option.value === String(value));
    return current?.label ?? (typeof value === "string" ? value : "");
  }

  if (field.type === "date" && typeof value === "string") {
    return value;
  }

  if (value === null || value === undefined) {
    return "";
  }

  return String(value);
}

export function schemaToColumns(fields: FieldSchema[]): ProFormColumnsType<FormRecord>[] {
  return fields.map((field) => {
    const base: ProFormColumnsType<FormRecord> = {
      title: field.label,
      dataIndex: field.field,
      formItemProps: {
        rules: field.required
          ? [{ required: true, message: `请输入${field.label}` }]
          : [],
      },
      valueEnum: getValueEnum(field),
    };

    switch (field.type) {
      case "textarea":
        return {
          ...base,
          valueType: "textarea",
          fieldProps: {
            rows: field.props?.rows ?? 4,
            placeholder: field.props?.placeholder,
          },
        };
      case "digit":
        return {
          ...base,
          valueType: "digit",
          fieldProps: {
            min: field.props?.min ?? 0,
            max: field.props?.max ?? 999999,
            precision: field.props?.precision ?? 0,
            placeholder: field.props?.placeholder,
          },
        };
      case "select":
        return {
          ...base,
          valueType: "select",
        };
      case "date":
        return {
          ...base,
          valueType: "date",
          fieldProps: {
            format: field.props?.format ?? "YYYY-MM-DD",
          },
        };
      case "switch":
        return {
          ...base,
          valueType: "switch",
        };
      case "radio":
        return {
          ...base,
          valueType: "radio",
        };
      case "checkbox":
        return {
          ...base,
          valueType: "checkbox",
        };
      case "text":
      default:
        return {
          ...base,
          valueType: "text",
          fieldProps: {
            placeholder: field.props?.placeholder,
          },
        };
    }
  });
}

export function schemaToDetailColumns(
  fields: FieldSchema[],
): ProDescriptionsItemProps<FormRecord>[] {
  return fields
    .filter((field) => field.showInDetail)
    .map((field) => ({
      title: field.label,
      dataIndex: field.field,
      valueType: field.type === "digit" ? "digit" : "text",
      renderText: (value) => formatFieldValue(field, value),
    }));
}

export function schemaToTableColumns(fields: FieldSchema[]): ProColumns<StoredRecord>[] {
  return fields
    .filter((field) => field.showInList)
    .map((field) => ({
      title: field.label,
      dataIndex: field.field,
      key: field.field,
      render: (_, record) => {
        const value = record[field.field];

        if (field.type === "switch") {
          return value ? <Tag color="green">开启</Tag> : <Tag>关闭</Tag>;
        }

        return formatFieldValue(field, value) || "-";
      },
    }));
}
