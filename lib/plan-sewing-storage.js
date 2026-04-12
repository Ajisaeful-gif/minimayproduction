import { apiGet, apiSend } from "@/lib/api-client";

export async function getPlanSewingRecords() {
  const payload = await apiGet("/api/plan-sewing");
  return Array.isArray(payload?.data) ? payload.data : [];
}

export async function getUsedPlanSewingKodePc() {
  const records = await getPlanSewingRecords();
  return records.map((record) => record.kodePc);
}

export async function savePlanSewingRecord(record) {
  await apiSend("/api/plan-sewing", "POST", record);

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("plan-sewing-storage-changed"));
  }
}
