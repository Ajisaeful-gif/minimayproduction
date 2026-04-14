import { apiGet } from "@/lib/api-client";
import { normalizeColourLabel } from "@/lib/colour-format";

export const cuttingSizeOrder = ["01", "02", "03", "04", "05", "06-07"];

export const inventoryRows = [
  {
    kodeBarang: "FAB-RYN-CRM",
    namaBarang: "Kain Rayon Cream",
    kategori: "Bahan Baku",
    stok: 128,
    satuan: "Roll"
  },
  {
    kodeBarang: "LBL-SERI-01",
    namaBarang: "Label Seri Cutting",
    kategori: "Pendukung Produksi",
    stok: 540,
    satuan: "Pcs"
  },
  {
    kodeBarang: "ACC-ZIP-18",
    namaBarang: "Resleting 18 cm",
    kategori: "Aksesoris",
    stok: 320,
    satuan: "Pcs"
  }
];

const emptyMasterData = {
  skuRows: [],
  kodePolaRows: [],
  jenisKainRows: [],
  modelOptions: [],
  operators: {
    cutting: [],
    seri: [],
    racking: [],
    sewing: []
  }
};

let masterDataCache = null;

export function buildModelShort(model) {
  const tokens = String(model ?? "")
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (!tokens.length) {
    return "";
  }

  const initials = tokens.map((token) => token[0]?.toUpperCase() ?? "").join("");

  if (initials.length >= 2) {
    return initials.slice(0, 3);
  }

  return tokens.join("").replace(/[^A-Za-z0-9]/g, "").slice(0, 3).toUpperCase();
}

export function formatCode(prefix, noPo, model) {
  const cleanedPo = String(noPo ?? "").trim();
  const cleanedModel = buildModelShort(model);

  if (!cleanedPo || !cleanedModel) {
    return "";
  }

  return `${cleanedPo}-${cleanedModel}`;
}

export function normalizeCuttingSize(size) {
  const normalized = String(size ?? "").trim().toUpperCase();
  const sizeMap = {
    "1": "01",
    "01": "01",
    S: "01",
    "2": "02",
    "02": "02",
    M: "02",
    "3": "03",
    "03": "03",
    L: "03",
    "4": "04",
    "04": "04",
    XL: "04",
    "5": "05",
    "05": "05",
    XXL: "05",
    "6": "06-07",
    "7": "06-07",
    "06": "06-07",
    "07": "06-07",
    "6-7": "06-07",
    "06-07": "06-07"
  };

  return sizeMap[normalized] ?? normalized;
}

function normalizeSkuRow(row) {
  return {
    sku: row?.kodeSku ?? row?.sku ?? "",
    produk: row?.namaProduk ?? row?.produk ?? "",
    model: row?.model ?? "",
    size: row?.size ?? "",
    colour: normalizeColourLabel(row?.warna ?? row?.colour ?? ""),
    ketSize: row?.keteranganSize ?? row?.ketSize ?? "",
    modelSize: row?.modelSize ?? "",
    ketDistModel: row?.keteranganDistribusiModel ?? row?.ketDistModel ?? "",
    jenisProduksi: row?.jenisProduksi ?? "",
    ketDistSku: row?.keteranganDistribusiSku ?? row?.ketDistSku ?? "",
    type: row?.tipeKain ?? row?.type ?? "",
    qtyPlan: Number(row?.qtyPlan ?? 0),
    qtyCutting: Number(row?.qtyCutting ?? 0),
    qtyRacking: Number(row?.qtyRacking ?? 0),
    qtyPlanSewing: Number(row?.qtyPlanSewing ?? 0),
    qtyIkat: Number(row?.qtyIkat ?? 0)
  };
}

function normalizeMasterData(raw) {
  const skuRows = Array.isArray(raw?.skuRows) ? raw.skuRows.map(normalizeSkuRow) : [];
  const kodePolaRows = Array.isArray(raw?.kodePolaRows)
    ? raw.kodePolaRows.map((row) => ({
        model: row?.model ?? "",
        kodePola: row?.kodePola ?? row?.kode_pola ?? ""
      }))
    : [];
  const jenisKainRows = Array.isArray(raw?.jenisKainRows)
    ? raw.jenisKainRows.map((row) => ({
        model: row?.model ?? "",
        jenisKain: row?.jenisKain ?? row?.jenis_kain ?? ""
      }))
    : [];
  const modelOptions = [...new Set(skuRows.map((row) => row.model))]
    .filter(Boolean)
    .map((value) => ({
      value,
      short: buildModelShort(value)
    }));
  const operatorRows = Array.isArray(raw?.operatorRows) ? raw.operatorRows : [];
  const operators = {
    cutting: operatorRows
      .filter((row) => row?.jenisOperator === "cutting")
      .map((row) => row.nama),
    seri: operatorRows
      .filter((row) => row?.jenisOperator === "seri")
      .map((row) => row.nama),
    racking: operatorRows
      .filter((row) => row?.jenisOperator === "racking")
      .map((row) => row.nama),
    sewing: operatorRows
      .filter((row) => row?.jenisOperator === "sewing")
      .map((row) => row.nama)
  };

  return {
    skuRows,
    kodePolaRows,
    jenisKainRows,
    modelOptions,
    operators
  };
}

export async function getMasterData(forceRefresh = false) {
  if (!forceRefresh && masterDataCache) {
    return masterDataCache;
  }

  const payload = await apiGet("/api/master-data");
  const normalized = normalizeMasterData(payload?.data ?? payload ?? emptyMasterData);
  masterDataCache = normalized;
  return normalized;
}

export async function getUserProfiles() {
  const payload = await apiGet("/api/users");
  return Array.isArray(payload?.data) ? payload.data : [];
}

export function getRowsByModel(skuRows, model) {
  if (!model) {
    return [];
  }

  return skuRows
    .filter((row) => row.model === model)
    .sort((left, right) => {
      const colourCompare = String(left.colour ?? "").localeCompare(String(right.colour ?? ""), undefined, {
        numeric: true,
        sensitivity: "base"
      });

      if (colourCompare !== 0) {
        return colourCompare;
      }

      const sizeCompare = String(left.size ?? "").localeCompare(String(right.size ?? ""), undefined, {
        numeric: true,
        sensitivity: "base"
      });

      if (sizeCompare !== 0) {
        return sizeCompare;
      }

      return String(left.sku ?? "").localeCompare(String(right.sku ?? ""), undefined, {
        numeric: true,
        sensitivity: "base"
      });
    });
}

export function getKodePolaByModel(kodePolaRows, model) {
  if (!model) {
    return "";
  }

  return kodePolaRows.find((row) => row.model === model)?.kodePola ?? "";
}

export function getJenisKainByModel(jenisKainRows, model) {
  if (!model) {
    return "";
  }

  return jenisKainRows.find((row) => row.model === model)?.jenisKain ?? "";
}

export function getSkuMetaBySku(skuRows, sku) {
  if (!sku) {
    return null;
  }

  return skuRows.find((row) => row.sku === sku) ?? null;
}
