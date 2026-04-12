import { apiGet, apiSend } from "@/lib/api-client";

export async function getCuttingRecords() {
  const payload = await apiGet("/api/cutting");
  return Array.isArray(payload?.data) ? payload.data : [];
}

export async function getUsedCuttingKodePc() {
  const records = await getCuttingRecords();
  return records.map((record) => record.kodePc);
}

export async function saveCuttingRecord(record) {
  await apiSend("/api/cutting", "POST", record);

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("cutting-storage-changed"));
  }
}
