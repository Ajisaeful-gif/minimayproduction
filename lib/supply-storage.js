import { apiGet, apiSend } from "@/lib/api-client";

export async function getSupplyRecords() {
  const payload = await apiGet("/api/supply");
  return Array.isArray(payload?.data) ? payload.data : [];
}

export async function getUsedSupplyKodePs() {
  const records = await getSupplyRecords();
  return records.map((record) => record.kodePs);
}

export async function saveSupplyRecord(record) {
  await apiSend("/api/supply", "POST", record);

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("supply-storage-changed"));
  }
}
