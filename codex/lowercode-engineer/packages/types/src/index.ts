export type FieldType =
  | "text"
  | "textarea"
  | "digit"
  | "select"
  | "date"
  | "switch"
  | "radio"
  | "checkbox";

export interface FieldOption {
  label: string;
  value: string;
}

export interface FieldProps {
  rows?: number;
  min?: number;
  max?: number;
  precision?: number;
  format?: string;
  options?: FieldOption[];
  placeholder?: string;
}

export interface FieldSchema {
  id: string;
  label: string;
  field: string;
  type: FieldType;
  required: boolean;
  showInList: boolean;
  showInDetail: boolean;
  props?: FieldProps;
}

export interface RendererSchema {
  version: "1.0.0";
  formUuid: string;
  name: string;
  modelName: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  fields: FieldSchema[];
}

export interface StoredRecord {
  id: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: unknown;
}

export interface FieldTypeDefinition {
  type: FieldType;
  title: string;
  description: string;
  accent: string;
}
