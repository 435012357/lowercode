import { useEffect, useMemo, useState } from "react";
import type { StoredRecord } from "@lowercode/types";

function makeRecordId() {
  const cryptoApi = globalThis.crypto as Crypto | undefined;

  if (cryptoApi && typeof cryptoApi.randomUUID === "function") {
    return cryptoApi.randomUUID();
  }

  return `record_${Math.random().toString(36).slice(2, 10)}`;
}

function loadStoredRecords(storageKey: string) {
  if (typeof window === "undefined") {
    return [] as StoredRecord[];
  }

  const raw = window.localStorage.getItem(storageKey);

  if (!raw) {
    return [] as StoredRecord[];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as StoredRecord[]) : [];
  } catch {
    return [] as StoredRecord[];
  }
}

export default function useLocalCrud(formUuid: string) {
  const storageKey = `lowercode.records.${formUuid}`;
  const [records, setRecords] = useState<StoredRecord[]>(() =>
    loadStoredRecords(storageKey),
  );
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setRecords(loadStoredRecords(storageKey));
    setPage(1);
  }, [storageKey]);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(records));
  }, [records, storageKey]);

  const pagedRecords = useMemo(() => {
    const start = (page - 1) * pageSize;
    return records.slice(start, start + pageSize);
  }, [page, pageSize, records]);

  async function createRecord(data: Record<string, unknown>) {
    const now = new Date().toISOString();

    setRecords((current) => [
      {
        id: makeRecordId(),
        createdAt: now,
        updatedAt: now,
        ...data,
      },
      ...current,
    ]);

    setPage(1);
  }

  async function updateRecord(recordId: string, data: Record<string, unknown>) {
    const now = new Date().toISOString();

    setRecords((current) =>
      current.map((record) =>
        record.id === recordId
          ? {
              ...record,
              ...data,
              updatedAt: now,
            }
          : record,
      ),
    );
  }

  async function removeRecord(recordId: string) {
    setRecords((current) => current.filter((record) => record.id !== recordId));
  }

  function getRecord(recordId: string) {
    return records.find((record) => record.id === recordId) ?? null;
  }

  return {
    page,
    pageSize,
    pagedRecords,
    records,
    total: records.length,
    setPage,
    setPageSize,
    createRecord,
    updateRecord,
    removeRecord,
    getRecord,
  };
}
