import { apiGet, apiSend } from "@/lib/api-client";

const CUTTING_STORAGE_KEY = "minimay-cutting-records";

function readFallback() {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(CUTTING_STORAGE_KEY);

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

  window.localStorage.setItem(CUTTING_STORAGE_KEY, JSON.stringify(next));
}

export async function getCuttingRecords() {
  try {
    const payload = await apiGet("/api/cutting");
    return Array.isArray(payload?.data) ? payload.data : [];
  } catch {
    return readFallback();
  }
}

export async function getUsedCuttingKodePc() {
  const records = await getCuttingRecords();
  return records.map((record) => record.kodePc);
}

export async function saveCuttingRecord(record) {
  try {
    await apiSend("/api/cutting", "POST", record);
  } catch {
    writeFallback(record);
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("cutting-storage-changed"));
  }
}
