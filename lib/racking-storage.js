import { apiGet, apiSend } from "@/lib/api-client";

export async function getRackingRecords() {
  const payload = await apiGet("/api/racking");
  return Array.isArray(payload?.data) ? payload.data : [];
}

export async function getUsedRackingKodePc() {
  const records = await getRackingRecords();
  return records.map((record) => record.kodePc);
}

export async function saveRackingRecord(record) {
  await apiSend("/api/racking", "POST", record);

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("racking-storage-changed"));
  }
}
