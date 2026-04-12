"use client";

import JSZip from "jszip";
import { hashPassword } from "better-auth/crypto";
import {
  cuttingOperators,
  jenisKainRows,
  kodePolaRows,
  rackOperators,
  seriOperators,
  sewingOperators,
  skuRows
} from "@/lib/excel-db.generated";
import {
  buildAuthAccountId,
  buildAuthUserId,
  defaultAuthUsers,
  normalizeAuthEmail
} from "@/lib/default-auth-users";
import {
  formatCode,
  getJenisKainByModel,
  getKodePolaByModel,
  getRowsByModel,
  modelOptions
} from "@/lib/mock-data";

const PLAN_CUTTING_STORAGE_KEY = "minimay-plan-cutting-records";
const CUTTING_STORAGE_KEY = "minimay-cutting-records";
const SERI_STORAGE_KEY = "minimay-seri-records";
const RACKING_STORAGE_KEY = "minimay-racking-records";
const PLAN_SEWING_STORAGE_KEY = "minimay-plan-sewing-records";
const SUPPLY_STORAGE_KEY = "minimay-supply-records";

const TABLE_HEADERS = {
  user: [
    "id",
    "name",
    "email",
    "email_verified",
    "image",
    "created_at",
    "updated_at"
  ],
  account: [
    "id",
    "account_id",
    "provider_id",
    "user_id",
    "access_token",
    "refresh_token",
    "id_token",
    "access_token_expires_at",
    "refresh_token_expires_at",
    "scope",
    "password",
    "created_at",
    "updated_at"
  ],
  session: [
    "id",
    "expires_at",
    "token",
    "ip_address",
    "user_agent",
    "user_id",
    "created_at",
    "updated_at"
  ],
  verification: ["id", "identifier", "value", "expires_at", "created_at", "updated_at"],
  profile: ["user_id", "email", "nama", "role", "aktif", "created_at", "updated_at"],
  sku_master: [
    "id",
    "kode_sku",
    "nama_produk",
    "model",
    "size",
    "warna",
    "keterangan_size",
    "model_size",
    "keterangan_distribusi_model",
    "jenis_produksi",
    "keterangan_distribusi_sku",
    "tipe_kain",
    "created_at",
    "updated_at"
  ],
  kode_pola_master: ["id", "model", "kode_pola", "created_at", "updated_at"],
  jenis_kain_master: ["id", "model", "jenis_kain", "created_at", "updated_at"],
  operator_master: ["id", "jenis_operator", "nama", "created_at", "updated_at"],
  plan_cutting: [
    "id",
    "kode_pc",
    "no_po",
    "model",
    "tanggal",
    "kode_pola",
    "jenis_kain",
    "created_by",
    "created_at",
    "updated_at"
  ],
  plan_cutting_row: [
    "id",
    "plan_cutting_id",
    "kode_sku",
    "nama_produk",
    "model",
    "size",
    "warna",
    "qty_plan",
    "created_at",
    "updated_at"
  ],
  cutting: [
    "id",
    "kode_pc",
    "no_po",
    "model",
    "kode_pola",
    "tanggal",
    "pemotong",
    "penggelar",
    "meja",
    "status",
    "created_by",
    "created_at",
    "updated_at"
  ],
  cutting_row: [
    "id",
    "cutting_id",
    "kode_sku",
    "nama_produk",
    "model",
    "size",
    "warna",
    "qty_plan",
    "qty_cutting",
    "created_at",
    "updated_at"
  ],
  seri: [
    "id",
    "kode_pc",
    "no_po",
    "model",
    "kode_pola",
    "tanggal",
    "operator_1",
    "operator_2",
    "last_sequence",
    "status",
    "created_by",
    "created_at",
    "updated_at"
  ],
  seri_entry: [
    "id",
    "seri_id",
    "entry_id",
    "kode_pc",
    "kode_produksi",
    "kode_sku",
    "nama_produk",
    "model",
    "size",
    "warna",
    "qty_ikat",
    "jenis",
    "created_at",
    "updated_at"
  ],
  racking: [
    "id",
    "kode_pc",
    "no_po",
    "tanggal",
    "operator",
    "total_target",
    "total_scanned",
    "status",
    "created_by",
    "created_at",
    "updated_at"
  ],
  racking_row: [
    "id",
    "racking_id",
    "kode_pc",
    "kode_produksi",
    "kode_sku",
    "nama_produk",
    "model",
    "warna",
    "size",
    "qty",
    "status",
    "created_at",
    "updated_at"
  ],
  plan_sewing: [
    "id",
    "kode_ps",
    "kode_pc",
    "no_po",
    "model",
    "tanggal",
    "status",
    "created_by",
    "created_at",
    "updated_at"
  ],
  plan_sewing_row: [
    "id",
    "plan_sewing_id",
    "kode_sku",
    "no_po",
    "nama_produk",
    "model",
    "size",
    "warna",
    "kode_pc",
    "qty_plan",
    "qty_cutting",
    "qty_plan_sewing",
    "created_at",
    "updated_at"
  ],
  supply: [
    "id",
    "kode_ps",
    "kode_pc",
    "tanggal",
    "operator",
    "total_plan",
    "total_actual",
    "status",
    "created_by",
    "created_at",
    "updated_at"
  ],
  supply_row: [
    "id",
    "supply_id",
    "kode_produksi",
    "kode_sku",
    "nama_produk",
    "model",
    "warna",
    "size",
    "qty_plan",
    "qty_actual",
    "created_at",
    "updated_at"
  ]
};

const IMPORT_ORDER = [
  "user",
  "profile",
  "account",
  "session",
  "verification",
  "sku_master",
  "kode_pola_master",
  "jenis_kain_master",
  "operator_master",
  "plan_cutting",
  "plan_cutting_row",
  "cutting",
  "cutting_row",
  "seri",
  "seri_entry",
  "racking",
  "racking_row",
  "plan_sewing",
  "plan_sewing_row",
  "supply",
  "supply_row"
];

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

function readLocalArray(storageKey, fallback = []) {
  if (typeof window === "undefined") {
    return fallback;
  }

  const raw = window.localStorage.getItem(storageKey);

  if (!raw) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function parseSequenceFromCode(kodeProduksi) {
  const matched = String(kodeProduksi ?? "").match(/(?:KPS|KPR)-?0*(\d{1,4})/i);
  return matched ? Number(matched[1]) : 0;
}

function normalizeSeriEntry(entry, index, kodePc = "") {
  const sequence =
    Number(entry?.sequence) || parseSequenceFromCode(entry?.kodeProduksi) || index + 1;

  return {
    entryId: entry?.entryId ?? `${kodePc || entry?.kodePc || "seri"}-${sequence}-${entry?.sku || "row"}`,
    kodePc: entry?.kodePc ?? kodePc ?? "",
    sku: entry?.sku ?? "",
    produk: entry?.produk ?? "",
    size: entry?.size ?? "",
    colour: entry?.colour ?? entry?.warna ?? "",
    qtyIkat: Number(entry?.qtyIkat ?? entry?.qty ?? 0),
    kodeProduksi: entry?.kodeProduksi ?? "",
    jenis: entry?.jenis ?? "",
    createdAt: entry?.createdAt ?? "",
    sequence
  };
}

function normalizeSeriRecord(record) {
  const entries = Array.isArray(record?.entries)
    ? record.entries.map((entry, index) => normalizeSeriEntry(entry, index, record?.kodePc))
    : [];

  const highestSequence = entries.reduce((max, entry) => Math.max(max, Number(entry.sequence || 0)), 0);

  return {
    kodePc: record?.kodePc ?? "",
    noPo: record?.noPo ?? "",
    model: record?.model ?? "",
    kodePola: record?.kodePola ?? "",
    tanggal: record?.tanggal ?? "",
    operator1: record?.operator1 ?? "",
    operator2: record?.operator2 ?? "",
    entries,
    nextSequence: Math.max(Number(record?.nextSequence ?? 0), highestSequence + 1, 1),
    status: record?.status ?? (entries.length ? "proses" : "draft")
  };
}

function readBrowserTransactionData() {
  return {
    planCuttingRecords: readLocalArray(
      PLAN_CUTTING_STORAGE_KEY,
      buildDefaultPlanCuttingRecords()
    ),
    cuttingRecords: readLocalArray(CUTTING_STORAGE_KEY, []),
    seriRecords: readLocalArray(SERI_STORAGE_KEY, []).map((record) => normalizeSeriRecord(record)),
    rackingRecords: readLocalArray(RACKING_STORAGE_KEY, []),
    planSewingRecords: readLocalArray(PLAN_SEWING_STORAGE_KEY, []),
    supplyRecords: readLocalArray(SUPPLY_STORAGE_KEY, [])
  };
}

function normalizeDateOnly(value) {
  if (!value) {
    return "";
  }

  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

function normalizeTimestamp(value, fallbackTimestamp) {
  if (typeof value === "string" && value.includes("T")) {
    return value;
  }

  const dateOnly = normalizeDateOnly(value);
  if (dateOnly) {
    return `${dateOnly}T00:00:00.000Z`;
  }

  return fallbackTimestamp;
}

function normalizeBoolean(value) {
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  return value ? "true" : "false";
}

function normalizeStatus(value, fallback = "draft") {
  const normalized = String(value ?? fallback).trim().toLowerCase();
  const map = {
    draft: "draft",
    proses: "proses",
    process: "proses",
    lengkap: "lengkap",
    complete: "lengkap",
    selesai: "selesai",
    done: "selesai",
    terscan: "proses"
  };

  return map[normalized] ?? fallback;
}

function csvEscape(value) {
  const normalized = value === null || value === undefined ? "" : String(value);
  if (/[",\n\r]/.test(normalized)) {
    return `"${normalized.replace(/"/g, '""')}"`;
  }

  return normalized;
}

function buildCsv(headers, rows) {
  const lines = [headers.join(",")];

  rows.forEach((row) => {
    lines.push(headers.map((header) => csvEscape(row?.[header])).join(","));
  });

  return lines.join("\r\n");
}

function uniqueRows(rows, keyBuilder) {
  const seen = new Set();
  return rows.filter((row) => {
    const key = keyBuilder(row);
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

async function buildAuthTables(exportedAt) {
  const userRows = [];
  const accountRows = [];
  const profileRows = [];

  for (const authUser of defaultAuthUsers) {
    const email = normalizeAuthEmail(authUser.email);
    const userId = buildAuthUserId(email);
    const passwordHash = await hashPassword(authUser.password);

    userRows.push({
      id: userId,
      name: authUser.nama,
      email,
      email_verified: "false",
      image: "",
      created_at: exportedAt,
      updated_at: exportedAt
    });

    profileRows.push({
      user_id: userId,
      email,
      nama: authUser.nama,
      role: authUser.role,
      aktif: normalizeBoolean(true),
      created_at: exportedAt,
      updated_at: exportedAt
    });

    accountRows.push({
      id: buildAuthAccountId(userId),
      account_id: userId,
      provider_id: "credential",
      user_id: userId,
      access_token: "",
      refresh_token: "",
      id_token: "",
      access_token_expires_at: "",
      refresh_token_expires_at: "",
      scope: "",
      password: passwordHash,
      created_at: exportedAt,
      updated_at: exportedAt
    });
  }

  return {
    user: userRows,
    account: accountRows,
    session: [],
    verification: [],
    profile: profileRows
  };
}

function buildMasterTables(exportedAt) {
  const operatorRows = uniqueRows(
    [
      ...cuttingOperators.map((nama) => ({ jenis_operator: "cutting", nama })),
      ...seriOperators.map((nama) => ({ jenis_operator: "seri", nama })),
      ...rackOperators.map((nama) => ({ jenis_operator: "racking", nama })),
      ...sewingOperators.map((nama) => ({ jenis_operator: "sewing", nama }))
    ],
    (row) => `${row.jenis_operator}:${row.nama}`
  ).map((row, index) => ({
    id: index + 1,
    jenis_operator: row.jenis_operator,
    nama: row.nama,
    created_at: exportedAt,
    updated_at: exportedAt
  }));

  return {
    sku_master: skuRows.map((row, index) => ({
      id: index + 1,
      kode_sku: row.sku,
      nama_produk: row.produk,
      model: row.model,
      size: row.size,
      warna: row.colour,
      keterangan_size: row.ketSize ?? "",
      model_size: row.modelSize ?? "",
      keterangan_distribusi_model: row.ketDistModel ?? "",
      jenis_produksi: row.jenisProduksi ?? "",
      keterangan_distribusi_sku: row.ketDistSku ?? "",
      tipe_kain: row.type ?? "",
      created_at: exportedAt,
      updated_at: exportedAt
    })),
    kode_pola_master: kodePolaRows.map((row, index) => ({
      id: index + 1,
      model: row.model,
      kode_pola: row.kodePola,
      created_at: exportedAt,
      updated_at: exportedAt
    })),
    jenis_kain_master: jenisKainRows.map((row, index) => ({
      id: index + 1,
      model: row.model,
      jenis_kain: row.jenisKain,
      created_at: exportedAt,
      updated_at: exportedAt
    })),
    operator_master: operatorRows
  };
}

function buildProcessTables(transactionData, exportedAt) {
  const planCuttingRows = [];
  const planCuttingHeaderRows = transactionData.planCuttingRecords.map((record, index) => {
    const planCuttingId = index + 1;
    const timestamp = normalizeTimestamp(record?.tanggal, exportedAt);

    (record?.rows ?? []).forEach((row, rowIndex) => {
      planCuttingRows.push({
        id: planCuttingRows.length + 1,
        plan_cutting_id: planCuttingId,
        kode_sku: row?.sku ?? row?.kodeSku ?? "",
        nama_produk: row?.produk ?? row?.namaProduk ?? "",
        model: row?.model ?? record?.model ?? "",
        size: row?.size ?? "",
        warna: row?.colour ?? row?.warna ?? "",
        qty_plan: Number(row?.qtyPlan ?? 0),
        created_at: timestamp,
        updated_at: timestamp
      });
    });

    return {
      id: planCuttingId,
      kode_pc: record?.kodePc ?? "",
      no_po: record?.noPo ?? "",
      model: record?.model ?? "",
      tanggal: normalizeDateOnly(record?.tanggal),
      kode_pola: record?.kodePola ?? "",
      jenis_kain: record?.jenisKain ?? "",
      created_by: "",
      created_at: timestamp,
      updated_at: timestamp
    };
  });

  const cuttingRows = [];
  const cuttingHeaderRows = transactionData.cuttingRecords.map((record, index) => {
    const cuttingId = index + 1;
    const timestamp = normalizeTimestamp(record?.tanggal, exportedAt);

    (record?.rows ?? []).forEach((row) => {
      cuttingRows.push({
        id: cuttingRows.length + 1,
        cutting_id: cuttingId,
        kode_sku: row?.sku ?? row?.kodeSku ?? "",
        nama_produk: row?.produk ?? row?.namaProduk ?? "",
        model: row?.model ?? record?.model ?? "",
        size: row?.size ?? "",
        warna: row?.colour ?? row?.warna ?? "",
        qty_plan: Number(row?.qtyPlan ?? 0),
        qty_cutting: Number(row?.qtyCutting ?? 0),
        created_at: timestamp,
        updated_at: timestamp
      });
    });

    return {
      id: cuttingId,
      kode_pc: record?.kodePc ?? "",
      no_po: record?.noPo ?? "",
      model: record?.model ?? "",
      kode_pola: record?.kodePola ?? "",
      tanggal: normalizeDateOnly(record?.tanggal),
      pemotong: record?.pemotong ?? "",
      penggelar: record?.penggelar ?? "",
      meja: record?.meja ?? "",
      status: normalizeStatus(record?.status, "selesai"),
      created_by: "",
      created_at: timestamp,
      updated_at: timestamp
    };
  });

  const seriEntryRows = [];
  const seriHeaderRows = transactionData.seriRecords.map((record, index) => {
    const seriId = index + 1;
    const timestamp = normalizeTimestamp(record?.tanggal, exportedAt);

    (record?.entries ?? []).forEach((entry, entryIndex) => {
      const entryTimestamp = normalizeTimestamp(entry?.createdAt, timestamp);

      seriEntryRows.push({
        id: seriEntryRows.length + 1,
        seri_id: seriId,
        entry_id: entry?.entryId ?? `${record?.kodePc ?? "seri"}-${entryIndex + 1}`,
        kode_pc: entry?.kodePc ?? record?.kodePc ?? "",
        kode_produksi: entry?.kodeProduksi ?? "",
        kode_sku: entry?.sku ?? "",
        nama_produk: entry?.produk ?? "",
        model: record?.model ?? "",
        size: entry?.size ?? "",
        warna: entry?.colour ?? "",
        qty_ikat: Number(entry?.qtyIkat ?? 0),
        jenis: entry?.jenis ?? "",
        created_at: entryTimestamp,
        updated_at: entryTimestamp
      });
    });

    return {
      id: seriId,
      kode_pc: record?.kodePc ?? "",
      no_po: record?.noPo ?? "",
      model: record?.model ?? "",
      kode_pola: record?.kodePola ?? "",
      tanggal: normalizeDateOnly(record?.tanggal),
      operator_1: record?.operator1 ?? "",
      operator_2: record?.operator2 ?? "",
      last_sequence: Math.max(Number(record?.nextSequence ?? 1) - 1, 0),
      status: normalizeStatus(record?.status, record?.entries?.length ? "proses" : "draft"),
      created_by: "",
      created_at: timestamp,
      updated_at: timestamp
    };
  });

  const rackingRows = [];
  const rackingHeaderRows = transactionData.rackingRecords.map((record, index) => {
    const rackingId = index + 1;
    const timestamp = normalizeTimestamp(record?.tanggal, exportedAt);

    (record?.rows ?? []).forEach((row) => {
      rackingRows.push({
        id: rackingRows.length + 1,
        racking_id: rackingId,
        kode_pc: row?.kodePc ?? record?.kodePc ?? "",
        kode_produksi: row?.kodeProduksi ?? "",
        kode_sku: row?.sku ?? row?.kodeSku ?? "",
        nama_produk: row?.produk ?? row?.namaProduk ?? "",
        model: row?.model ?? "",
        warna: row?.warna ?? row?.colour ?? "",
        size: row?.size ?? "",
        qty: Number(row?.qty ?? 0),
        status: row?.status ?? "Terscan",
        created_at: timestamp,
        updated_at: timestamp
      });
    });

    return {
      id: rackingId,
      kode_pc: record?.kodePc ?? "",
      no_po: record?.noPo ?? "",
      tanggal: normalizeDateOnly(record?.tanggal),
      operator: record?.operator ?? "",
      total_target: Number(record?.totalTarget ?? 0),
      total_scanned: Number(record?.totalScanned ?? 0),
      status: normalizeStatus(record?.status, "proses"),
      created_by: "",
      created_at: timestamp,
      updated_at: timestamp
    };
  });

  const planSewingRows = [];
  const planSewingHeaderRows = transactionData.planSewingRecords.map((record, index) => {
    const planSewingId = index + 1;
    const timestamp = normalizeTimestamp(record?.tanggal, exportedAt);

    (record?.rows ?? []).forEach((row) => {
      planSewingRows.push({
        id: planSewingRows.length + 1,
        plan_sewing_id: planSewingId,
        kode_sku: row?.sku ?? row?.kodeSku ?? "",
        no_po: row?.noPo ?? record?.noPo ?? "",
        nama_produk: row?.produk ?? row?.namaProduk ?? "",
        model: row?.model ?? record?.model ?? "",
        size: row?.size ?? "",
        warna: row?.warna ?? row?.colour ?? "",
        kode_pc: row?.kodePc ?? record?.kodePc ?? "",
        qty_plan: Number(row?.qtyPlan ?? 0),
        qty_cutting: Number(row?.qtyCutting ?? 0),
        qty_plan_sewing: Number(row?.qtyPlanSewing ?? 0),
        created_at: timestamp,
        updated_at: timestamp
      });
    });

    return {
      id: planSewingId,
      kode_ps: record?.kodePs ?? "",
      kode_pc: record?.kodePc ?? "",
      no_po: record?.noPo ?? "",
      model: record?.model ?? "",
      tanggal: normalizeDateOnly(record?.tanggal),
      status: normalizeStatus(record?.status, "selesai"),
      created_by: "",
      created_at: timestamp,
      updated_at: timestamp
    };
  });

  const supplyRows = [];
  const supplyHeaderRows = transactionData.supplyRecords.map((record, index) => {
    const supplyId = index + 1;
    const timestamp = normalizeTimestamp(record?.tanggal, exportedAt);

    (record?.rows ?? []).forEach((row) => {
      supplyRows.push({
        id: supplyRows.length + 1,
        supply_id: supplyId,
        kode_produksi: row?.kodeProduksi ?? "",
        kode_sku: row?.sku ?? row?.kodeSku ?? "",
        nama_produk: row?.produk ?? row?.namaProduk ?? "",
        model: row?.model ?? "",
        warna: row?.warna ?? row?.colour ?? "",
        size: row?.size ?? "",
        qty_plan: Number(row?.qtyPlan ?? 0),
        qty_actual: Number(row?.qtyActual ?? row?.qty ?? 0),
        created_at: timestamp,
        updated_at: timestamp
      });
    });

    return {
      id: supplyId,
      kode_ps: record?.kodePs ?? "",
      kode_pc: record?.kodePc ?? "",
      tanggal: normalizeDateOnly(record?.tanggal),
      operator: record?.operator ?? "",
      total_plan: Number(record?.totalPlan ?? 0),
      total_actual: Number(record?.totalActual ?? 0),
      status: normalizeStatus(record?.status, "proses"),
      created_by: "",
      created_at: timestamp,
      updated_at: timestamp
    };
  });

  return {
    plan_cutting: planCuttingHeaderRows,
    plan_cutting_row: planCuttingRows,
    cutting: cuttingHeaderRows,
    cutting_row: cuttingRows,
    seri: seriHeaderRows,
    seri_entry: seriEntryRows,
    racking: rackingHeaderRows,
    racking_row: rackingRows,
    plan_sewing: planSewingHeaderRows,
    plan_sewing_row: planSewingRows,
    supply: supplyHeaderRows,
    supply_row: supplyRows
  };
}

function buildReadmeContent(tables) {
  const serialTables = [
    "sku_master",
    "kode_pola_master",
    "jenis_kain_master",
    "operator_master",
    "plan_cutting",
    "plan_cutting_row",
    "cutting",
    "cutting_row",
    "seri",
    "seri_entry",
    "racking",
    "racking_row",
    "plan_sewing",
    "plan_sewing_row",
    "supply",
    "supply_row"
  ];

  const sequenceResetSql = serialTables
    .map(
      (tableName) =>
        `select setval(pg_get_serial_sequence('${tableName}', 'id'), coalesce((select max(id) from ${tableName}), 1), true);`
    )
    .join("\n");

  const counts = IMPORT_ORDER.map(
    (tableName) => `- ${tableName}.csv (${tables[tableName]?.length ?? 0} row)`
  ).join("\n");

  return [
    "MINIMAY SUPABASE CSV EXPORT",
    "",
    "Urutan import yang direkomendasikan:",
    "1. Jalankan migration/schema terlebih dulu di Supabase.",
    "2. Import user.csv, profile.csv, account.csv.",
    "3. session.csv dan verification.csv opsional bila tetap kosong.",
    "4. Import master data: sku_master, kode_pola_master, jenis_kain_master, operator_master.",
    "5. Import tabel header proses lalu tabel row/detail-nya.",
    "",
    "Daftar file dan jumlah row:",
    counts,
    "",
    "Setelah import ke tabel yang memakai serial id, jalankan SQL berikut untuk sinkronisasi sequence:",
    sequenceResetSql,
    ""
  ].join("\n");
}

export async function buildSupabaseCsvTables() {
  const exportedAt = new Date().toISOString();
  const transactionData = readBrowserTransactionData();
  const authTables = await buildAuthTables(exportedAt);
  const masterTables = buildMasterTables(exportedAt);
  const processTables = buildProcessTables(transactionData, exportedAt);

  return {
    ...authTables,
    ...masterTables,
    ...processTables
  };
}

export async function exportSupabaseCsvZip() {
  const tables = await buildSupabaseCsvTables();
  const zip = new JSZip();

  IMPORT_ORDER.forEach((tableName) => {
    const headers = TABLE_HEADERS[tableName];
    const rows = tables[tableName] ?? [];
    zip.file(`${tableName}.csv`, buildCsv(headers, rows));
  });

  zip.file("README_IMPORT_ORDER.txt", buildReadmeContent(tables));

  const blob = await zip.generateAsync({ type: "blob" });
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  const filename = `minimay-supabase-export-${timestamp}.zip`;
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);

  return {
    filename,
    tableCount: IMPORT_ORDER.length,
    rowCount: IMPORT_ORDER.reduce((total, tableName) => total + (tables[tableName]?.length ?? 0), 0)
  };
}
