import { apiGet, apiSend } from "@/lib/api-client";

const PLAN_SEWING_STORAGE_KEY = "minimay-plan-sewing-records";

function readFallback() {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(PLAN_SEWING_STORAGE_KEY);

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

  window.localStorage.setItem(PLAN_SEWING_STORAGE_KEY, JSON.stringify(next));
}

export async function getPlanSewingRecords() {
  try {
    const payload = await apiGet("/api/plan-sewing");
    return Array.isArray(payload?.data) ? payload.data : [];
  } catch {
    return readFallback();
  }
}

export async function getUsedPlanSewingKodePc() {
  const records = await getPlanSewingRecords();
  return records.map((record) => record.kodePc);
}

export async function savePlanSewingRecord(record) {
  try {
    await apiSend("/api/plan-sewing", "POST", record);
  } catch {
    writeFallback(record);
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("plan-sewing-storage-changed"));
  }
}
