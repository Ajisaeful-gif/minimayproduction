import { apiGet, apiSend } from "@/lib/api-client";

const SUPPLY_STORAGE_KEY = "minimay-supply-records";

function readFallback() {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(SUPPLY_STORAGE_KEY);

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
  const next = [record, ...current.filter((item) => item.kodePs !== record.kodePs)];

  window.localStorage.setItem(SUPPLY_STORAGE_KEY, JSON.stringify(next));
}

export async function getSupplyRecords() {
  try {
    const payload = await apiGet("/api/supply");
    return Array.isArray(payload?.data) ? payload.data : [];
  } catch {
    return readFallback();
  }
}

export async function getUsedSupplyKodePs() {
  const records = await getSupplyRecords();
  return records.map((record) => record.kodePs);
}

export async function saveSupplyRecord(record) {
  try {
    await apiSend("/api/supply", "POST", record);
  } catch {
    writeFallback(record);
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("supply-storage-changed"));
  }
}
