import { apiGet, apiSend } from "@/lib/api-client";

function parseSequenceFromCode(kodeProduksi) {
  const matched = String(kodeProduksi ?? "").match(/(?:KPS|KPR)-?0*(\d{1,4})/i);

  return matched ? Number(matched[1]) : 0;
}

function normalizeEntry(entry, index) {
  const sequence =
    Number(entry?.sequence) ||
    parseSequenceFromCode(entry?.kodeProduksi) ||
    index + 1;

  return {
    entryId: entry?.entryId ?? `${entry?.kodePc ?? "seri"}-${sequence}-${entry?.sku ?? "row"}`,
    kodePc: entry?.kodePc ?? "",
    sku: entry?.sku ?? "",
    produk: entry?.produk ?? "",
    size: entry?.size ?? "",
    colour: entry?.colour ?? "",
    qtyIkat: Number(entry?.qtyIkat ?? entry?.qty ?? 0),
    kodeProduksi: entry?.kodeProduksi ?? "",
    jenis: entry?.jenis ?? "-",
    createdAt: entry?.createdAt ?? "",
    sequence
  };
}

function normalizeRecord(record) {
  const rawEntries = Array.isArray(record?.entries) ? record.entries : [];
  const entries = rawEntries.map((entry, index) => normalizeEntry(entry, index));
  const highestSequence = entries.reduce(
    (max, entry) => Math.max(max, Number(entry.sequence ?? 0)),
    0
  );

  return {
    kodePc: record?.kodePc ?? "",
    noPo: record?.noPo ?? "",
    model: record?.model ?? "",
    kodePola: record?.kodePola ?? "",
    tanggal: record?.tanggal ?? "",
    operator1: record?.operator1 ?? "",
    operator2: record?.operator2 ?? "",
    entries,
    nextSequence: Math.max(Number(record?.nextSequence ?? 0), highestSequence + 1, 1)
  };
}

export async function getSeriRecords() {
  const payload = await apiGet("/api/seri");
  return Array.isArray(payload?.data)
    ? payload.data.map((record) => normalizeRecord(record))
    : [];
}

export async function getSeriRecordByKodePc(kodePc) {
  const records = await getSeriRecords();
  return records.find((record) => record.kodePc === kodePc) ?? null;
}

export async function getUsedSeriKodePc() {
  const records = await getSeriRecords();
  return records.map((record) => record.kodePc);
}

export async function saveSeriEntry(recordHeader, entry) {
  const payload = await apiSend("/api/seri/entries", "POST", {
    recordHeader,
    entry
  });

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("seri-storage-changed"));
  }

  return payload?.data ?? null;
}

export async function deleteSeriEntry(kodePc, entryId) {
  await apiSend("/api/seri/entries", "DELETE", { kodePc, entryId });

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("seri-storage-changed"));
  }
}

export async function saveSeriRecord(record) {
  if (!record?.kodePc) {
    return;
  }

  const rows = Array.isArray(record.rows) ? record.rows : [];

  for (const row of rows.filter((item) => Number(item?.qtyIkat ?? 0) > 0)) {
    await saveSeriEntry(record, row);
  }
}
