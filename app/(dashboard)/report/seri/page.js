"use client";

import ReportTablePage from "@/components/report-table-page";
import { Tag } from "@/components/ui";
import { getSeriRecords } from "@/lib/seri-storage";

const columns = [
  { key: "tanggal", label: "Tanggal" },
  { key: "noPo", label: "No PO" },
  { key: "kodePc", label: "Kode PC" },
  { key: "kodeProduksi", label: "Kode Produksi" },
  { key: "operator1", label: "Operator 1" },
  { key: "operator2", label: "Operator 2" },
  { key: "sku", label: "Kode SKU" },
  { key: "colour", label: "Colour" },
  { key: "size", label: "Size", align: "center" },
  { key: "qtyIkat", label: "Qty Ikat", align: "center" },
  { key: "jenis", label: "Ket. Rayon & Kaos" }
];

function getSummaryCards(records) {
  const allEntries = records.flatMap((record) => record.entries ?? []);

  return [
    { label: "Total Kode PC", value: records.length },
    { label: "Total Ikat", value: allEntries.length },
    {
      label: "Total Qty Ikat",
      tone: "success",
      value: allEntries.reduce((total, entry) => total + Number(entry.qtyIkat ?? 0), 0)
    }
  ];
}

function mapRows(records) {
  return records.flatMap((record) =>
    (record.entries ?? []).map((entry, index) => ({
      key: `${entry.entryId}-${index}`,
      tanggal: record.tanggal || "-",
      noPo: <Tag>{record.noPo}</Tag>,
      kodePc: <Tag>{record.kodePc}</Tag>,
      kodeProduksi: <Tag>{entry.kodeProduksi}</Tag>,
      operator1: record.operator1 || "-",
      operator2: record.operator2 || "-",
      sku: <Tag>{entry.sku}</Tag>,
      colour: entry.colour,
      size: <Tag>{entry.size}</Tag>,
      qtyIkat: <Tag>{entry.qtyIkat}</Tag>,
      jenis: entry.jenis || "-"
    }))
  );
}

export default function SeriReportPage() {
  return (
    <ReportTablePage
      chip="Report"
      columns={columns}
      emptyMessage="Belum ada data Seri yang tersimpan."
      eventNames={["seri-storage-changed"]}
      eyebrow="Report / Seri"
      getSummaryCards={getSummaryCards}
      loadRecords={getSeriRecords}
      loadErrorMessage="Data report Seri gagal dimuat."
      mapRows={mapRows}
      title="Report Seri"
    />
  );
}
