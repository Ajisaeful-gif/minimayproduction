"use client";

import ReportTablePage from "@/components/report-table-page";
import { Badge, Tag } from "@/components/ui";
import { getRackingRecords } from "@/lib/racking-storage";

const columns = [
  { key: "tanggal", label: "Tanggal" },
  { key: "noPo", label: "No PO" },
  { key: "kodePc", label: "Kode PC" },
  { key: "operator", label: "Operator" },
  { key: "kodeProduksi", label: "Kode Produksi" },
  { key: "sku", label: "Kode SKU" },
  { key: "warna", label: "Warna" },
  { key: "size", label: "Size", align: "center" },
  { key: "qty", label: "Qty", align: "center" },
  { key: "status", label: "Status", align: "center" }
];

function getSummaryCards(records) {
  const allRows = records.flatMap((record) => record.rows ?? []);

  return [
    { label: "Total Kode PC", value: records.length },
    { label: "Total Scan", value: allRows.length },
    {
      label: "Total Qty Scan",
      tone: "success",
      value: allRows.reduce((total, row) => total + Number(row.qty ?? 0), 0)
    }
  ];
}

function mapRows(records) {
  return records.flatMap((record) =>
    (record.rows ?? []).map((row, index) => ({
      key: `${record.kodePc}-${row.kodeProduksi}-${index}`,
      tanggal: record.tanggal || "-",
      noPo: <Tag>{record.noPo || "-"}</Tag>,
      kodePc: <Tag>{record.kodePc}</Tag>,
      operator: record.operator || "-",
      kodeProduksi: <Tag>{row.kodeProduksi}</Tag>,
      sku: <Tag>{row.sku}</Tag>,
      warna: row.warna,
      size: <Tag>{row.size}</Tag>,
      qty: <Tag>{row.qty}</Tag>,
      status: <Badge variant={row.status === "Terscan" ? "success" : "neutral"}>{row.status}</Badge>
    }))
  );
}

export default function RackingReportPage() {
  return (
    <ReportTablePage
      chip="Report"
      columns={columns}
      emptyMessage="Belum ada data Racking yang tersimpan."
      eventNames={["racking-storage-changed"]}
      eyebrow="Report / Racking"
      getSummaryCards={getSummaryCards}
      loadRecords={getRackingRecords}
      loadErrorMessage="Data report Racking gagal dimuat."
      mapRows={mapRows}
      title="Report Racking"
    />
  );
}
