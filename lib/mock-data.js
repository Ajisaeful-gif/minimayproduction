import {
  cuttingOperators as excelCuttingOperators,
  jenisKainRows as excelJenisKainRows,
  kodePolaRows as excelKodePolaRows,
  rackOperators as excelRackOperators,
  seriOperators as excelSeriOperators,
  sewingOperators as excelSewingOperators,
  skuRows as excelSkuRows
} from "@/lib/excel-db.generated";

function buildModelShort(model) {
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

function buildDemoScannedProductionRows(rows) {
  const firstModel = rows[0]?.model;

  if (!firstModel) {
    return [];
  }

  const demoRows = rows.filter((row) => row.model === firstModel).slice(0, 3);

  return demoRows.map((row, index) => ({
    kodeProduksi: `${row.type === "Rayon" ? "KPR" : "KPS"}-${String(index + 1).padStart(4, "0")}-PC4B26`,
    noPo: "PC4B26",
    sku: row.sku,
    model: row.model,
    produk: row.produk,
    warna: row.colour,
    size: row.size,
    qty: [5, 6, 4][index] ?? 3,
    status: "Terscan"
  }));
}

export const modelOptions = [...new Set(excelSkuRows.map((row) => row.model))]
  .filter(Boolean)
  .map((value) => ({
    value,
    short: buildModelShort(value)
  }));

export const cuttingOperators = excelCuttingOperators;
export const seriOperators = excelSeriOperators;
export const rackOperators = excelRackOperators;
export const sewingOperators = excelSewingOperators;
export const cuttingSizeOrder = ["01", "02", "03", "04", "05", "06-07"];
export const kodePolaRows = excelKodePolaRows;
export const jenisKainRows = excelJenisKainRows;
export const skuRows = excelSkuRows;

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

export const scannedProductionRows = buildDemoScannedProductionRows(skuRows);

export const users = [
  {
    name: "Ayu Lestari",
    email: "ayu@minimay.id",
    role: "Admin PPIC",
    status: "Aktif"
  },
  {
    name: "Rizal Maulana",
    email: "rizal@minimay.id",
    role: "Operator Cutting",
    status: "Aktif"
  },
  {
    name: "Dwi Pratama",
    email: "dwi@minimay.id",
    role: "Supervisor Produksi",
    status: "Pending"
  }
];

export function getRowsByModel(model) {
  if (!model) {
    return [];
  }

  return skuRows.filter((row) => row.model === model);
}

export function getKodePolaByModel(model) {
  if (!model) {
    return "";
  }

  const foundRow = kodePolaRows.find((row) => row.model === model);

  return foundRow?.kodePola ?? "";
}

export function getJenisKainByModel(model) {
  if (!model) {
    return "";
  }

  const foundRow = jenisKainRows.find((row) => row.model === model);

  return foundRow?.jenisKain ?? "";
}

export function getSkuMetaBySku(sku) {
  if (!sku) {
    return null;
  }

  return skuRows.find((row) => row.sku === sku) ?? null;
}

export function formatCode(prefix, noPo, model) {
  const cleanedPo = noPo?.trim();
  const foundModel = modelOptions.find((item) => item.value === model);
  const cleanedModel = foundModel?.short;

  if (!cleanedPo || !cleanedModel) {
    return "";
  }

  return `${cleanedPo}-${cleanedModel}`;
}
