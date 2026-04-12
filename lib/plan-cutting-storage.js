import { apiGet, apiSend } from "@/lib/api-client";
import {
  formatCode,
  getJenisKainByModel,
  getKodePolaByModel,
  getRowsByModel,
  modelOptions
} from "@/lib/mock-data";

const PLAN_CUTTING_STORAGE_KEY = "minimay-plan-cutting-records";

function buildDemoQtyPlan(index) {
  return [20, 18, 24, 16, 22, 14][index] ?? 12;
}

function buildDefaultPlanCuttingRecords() {
  const tanggal = "2026-04-11";
  const noPo = "PC4B26";
  const model = modelOptions[0]?.value ?? "";
  const rows = getRowsByModel(model).slice(0, 6).map((row, index) => ({
    sku: row.sku,
    produk: row.produk,
    model: row.model,
    size: row.size,
    colour: row.colour,
    qtyPlan: buildDemoQtyPlan(index)
  }));

  return [
    {
      id: "default-pc-1",
      kodePc: formatCode("PC", noPo, model),
      noPo,
      model,
      tanggal,
      kodePola: getKodePolaByModel(model),
      jenisKain: getJenisKainByModel(model),
      rows
    }
  ];
}

function readFallback() {
  if (typeof window === "undefined") {
    return buildDefaultPlanCuttingRecords();
  }

  const raw = window.localStorage.getItem(PLAN_CUTTING_STORAGE_KEY);

  if (!raw) {
    const defaults = buildDefaultPlanCuttingRecords();
    window.localStorage.setItem(PLAN_CUTTING_STORAGE_KEY, JSON.stringify(defaults));
    return defaults;
  }

  try {
    const parsed = JSON.parse(raw);

    if (Array.isArray(parsed) && parsed.length) {
      return parsed;
    }
  } catch {}

  const defaults = buildDefaultPlanCuttingRecords();
  window.localStorage.setItem(PLAN_CUTTING_STORAGE_KEY, JSON.stringify(defaults));
  return defaults;
}

function writeFallback(record) {
  if (typeof window === "undefined") {
    return;
  }

  const current = readFallback();
  const next = [record, ...current.filter((item) => item.kodePc !== record.kodePc)];

  window.localStorage.setItem(PLAN_CUTTING_STORAGE_KEY, JSON.stringify(next));
}

export async function getPlanCuttingRecords() {
  try {
    const payload = await apiGet("/api/plan-cutting");
    return Array.isArray(payload?.data) && payload.data.length
      ? payload.data
      : readFallback();
  } catch {
    return readFallback();
  }
}

export async function savePlanCuttingRecord(record) {
  try {
    await apiSend("/api/plan-cutting", "POST", record);
  } catch {
    writeFallback(record);
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("plan-cutting-storage-changed"));
  }
}
