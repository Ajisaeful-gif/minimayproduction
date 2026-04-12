import { apiGet, apiSend } from "@/lib/api-client";

const RACKING_STORAGE_KEY = "minimay-racking-records";

function readFallback() {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(RACKING_STORAGE_KEY);

  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);

    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch {}

  return [];
}

function writeFallback(record) {
  if (typeof window === "undefined") {
    return;
  }

  const current = readFallback();
  const next = [record, ...current.filter((item) => item.kodePc !== record.kodePc)];

  window.localStorage.setItem(RACKING_STORAGE_KEY, JSON.stringify(next));
}

export async function getRackingRecords() {
  try {
    const payload = await apiGet("/api/racking");
    return Array.isArray(payload?.data) ? payload.data : [];
  } catch {
    return readFallback();
  }
}

export async function getUsedRackingKodePc() {
  const records = await getRackingRecords();
  return records.map((record) => record.kodePc);
}

export async function saveRackingRecord(record) {
  try {
    await apiSend("/api/racking", "POST", record);
  } catch {
    writeFallback(record);
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("racking-storage-changed"));
  }
}
