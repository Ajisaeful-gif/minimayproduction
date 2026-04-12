import { apiGet, apiSend } from "@/lib/api-client";

export async function getPlanCuttingRecords() {
  const payload = await apiGet("/api/plan-cutting");
  return Array.isArray(payload?.data) ? payload.data : [];
}

export async function savePlanCuttingRecord(record) {
  await apiSend("/api/plan-cutting", "POST", record);

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("plan-cutting-storage-changed"));
  }
}
