import { useMemo, useRef, useState } from "react";
import type { FormInstance } from "antd";
import { App as AntdApp, Button, Empty, Modal, Popconfirm } from "antd";
import {
  BetaSchemaForm,
  ProDescriptions,
  ProTable,
} from "@ant-design/pro-components";
import type { RendererSchema } from "@lowercode/types";
import useLocalCrud from "../hooks/useLocalCrud";
import {
  schemaToColumns,
  schemaToDetailColumns,
  schemaToTableColumns,
} from "../utils/schemaToColumns";

interface CRUDRendererProps {
  schema: RendererSchema;
}

type FormRecord = Record<string, unknown>;

export default function CRUDRenderer({ schema }: CRUDRendererProps) {
  const { message } = AntdApp.useApp();
  const createFormRef = useRef<FormInstance<FormRecord> | undefined>(undefined);
  const editFormRef = useRef<FormInstance<FormRecord> | undefined>(undefined);
  const [createVisible, setCreateVisible] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [viewVisible, setViewVisible] = useState(false);
  const [editRecordId, setEditRecordId] = useState("");
  const [viewRecordId, setViewRecordId] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);

  const {
    page,
    pageSize,
    pagedRecords,
    total,
    setPage,
    setPageSize,
    createRecord,
    updateRecord,
    removeRecord,
    getRecord,
  } = useLocalCrud(schema.formUuid);

  const formColumns = useMemo(() => schemaToColumns(schema.fields), [schema.fields]);
  const detailColumns = useMemo(
    () => schemaToDetailColumns(schema.fields),
    [schema.fields],
  );
  const viewRecord = getRecord(viewRecordId);
  const editRecord = getRecord(editRecordId);

  const tableColumns = useMemo(
    () => [
      ...schemaToTableColumns(schema.fields),
      {
        title: "操作",
        key: "actions",
        width: 220,
        fixed: "right" as const,
        render: (_: unknown, record: { id: string }) => (
          <div className="action-links">
            <Button
              type="link"
              onClick={() => {
                setViewRecordId(record.id);
                setViewVisible(true);
              }}
            >
              查看
            </Button>
            <Button
              type="link"
              onClick={() => {
                setEditRecordId(record.id);
                setEditVisible(true);
              }}
            >
              编辑
            </Button>
            <Popconfirm
              title="确认删除这条记录？"
              onConfirm={async () => {
                await removeRecord(record.id);
                message.success("记录已删除");
              }}
              okText="删除"
              cancelText="取消"
            >
              <Button danger type="link">
                删除
              </Button>
            </Popconfirm>
          </div>
        ),
      },
    ],
    [message, removeRecord, schema.fields],
  );

  if (!schema.fields.length) {
    return (
      <div className="empty-preview">
        <Empty description="当前 Schema 还没有字段，先回设计器补充内容" />
      </div>
    );
  }

  async function handleCreateSubmit() {
    try {
      setSubmitLoading(true);
      const values = await createFormRef.current?.validateFields();

      if (!values) {
        return;
      }

      await createRecord(values);
      setCreateVisible(false);
      createFormRef.current?.resetFields();
      message.success("本地记录已新增");
    } catch (error) {
      message.error(error instanceof Error ? error.message : "新增失败");
    } finally {
      setSubmitLoading(false);
    }
  }

  async function handleEditSubmit() {
    try {
      setSubmitLoading(true);
      const values = await editFormRef.current?.validateFields();

      if (!values || !editRecordId) {
        return;
      }

      await updateRecord(editRecordId, values);
      setEditVisible(false);
      message.success("本地记录已更新");
    } catch (error) {
      message.error(error instanceof Error ? error.message : "编辑失败");
    } finally {
      setSubmitLoading(false);
    }
  }

  return (
    <div className="crud-shell">
      <div className="preview-head">
        <div>
          <p className="eyebrow">Live CRUD Preview</p>
          <h2>{schema.name}</h2>
          <p className="muted">{schema.description || "这份 Schema 没有额外说明。"}</p>
        </div>
        <div className="preview-meta">
          <span className="preview-pill">model: {schema.modelName}</span>
          <span className="preview-pill">records: {total}</span>
        </div>
      </div>

      <ProTable
        rowKey="id"
        search={false}
        options={false}
        columns={tableColumns}
        dataSource={pagedRecords}
        scroll={{ x: "max-content" }}
        pagination={{
          current: page,
          pageSize,
          total,
          onChange: (nextPage, nextPageSize) => {
            setPage(nextPage);
            setPageSize(nextPageSize);
          },
        }}
        toolBarRender={() => [
          <Button key="create" type="primary" onClick={() => setCreateVisible(true)}>
            新增记录
          </Button>,
        ]}
      />

      <Modal
        title="新增记录"
        open={createVisible}
        onCancel={() => {
          setCreateVisible(false);
          createFormRef.current?.resetFields();
        }}
        onOk={handleCreateSubmit}
        okText="提交"
        cancelText="取消"
        confirmLoading={submitLoading}
        destroyOnClose
      >
        <BetaSchemaForm<FormRecord>
          layoutType="Form"
          formRef={createFormRef}
          columns={formColumns}
          submitter={false}
        />
      </Modal>

      <Modal
        title="编辑记录"
        open={editVisible}
        onCancel={() => setEditVisible(false)}
        onOk={handleEditSubmit}
        okText="提交"
        cancelText="取消"
        confirmLoading={submitLoading}
        destroyOnClose
      >
        <BetaSchemaForm<FormRecord>
          key={editRecordId}
          layoutType="Form"
          formRef={editFormRef}
          columns={formColumns}
          initialValues={editRecord ?? undefined}
          submitter={false}
        />
      </Modal>

      <Modal
        title="查看记录"
        open={viewVisible}
        onCancel={() => setViewVisible(false)}
        footer={
          <Button onClick={() => setViewVisible(false)}>
            关闭
          </Button>
        }
      >
        <ProDescriptions<FormRecord>
          column={1}
          dataSource={viewRecord ?? {}}
          columns={detailColumns}
        />
      </Modal>
    </div>
  );
}
