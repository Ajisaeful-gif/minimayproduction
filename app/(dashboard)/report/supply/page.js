"use client";

import ReportTablePage from "@/components/report-table-page";
import { Badge, Tag } from "@/components/ui";
import { getSupplyRecords } from "@/lib/supply-storage";

const columns = [
  { key: "tanggal", label: "Tanggal" },
  { key: "kodePs", label: "Kode PS" },
  { key: "kodePc", label: "Kode PC" },
  { key: "operator", label: "Operator" },
  { key: "kodeProduksi", label: "Kode Produksi" },
  { key: "sku", label: "Kode SKU" },
  { key: "warna", label: "Warna" },
  { key: "size", label: "Size", align: "center" },
  { key: "qty", label: "Qty Actual", align: "center" },
  { key: "status", label: "Status", align: "center" }
];

function getSummaryCards(records) {
  const allRows = records.flatMap((record) => record.rows ?? []);

  return [
    { label: "Total Kode PS", value: records.length },
    { label: "Total Scan", value: allRows.length },
    {
      label: "Total Qty Actual",
      tone: "success",
      value: allRows.reduce((total, row) => total + Number(row.qty ?? 0), 0)
    }
  ];
}

function mapRows(records) {
  return records.flatMap((record) =>
    (record.rows ?? []).map((row, index) => ({
      key: `${record.kodePs}-${row.kodeProduksi}-${index}`,
      tanggal: record.tanggal || "-",
      kodePs: <Tag>{record.kodePs}</Tag>,
      kodePc: <Tag>{record.kodePc}</Tag>,
      operator: record.operator || "-",
      kodeProduksi: <Tag>{row.kodeProduksi}</Tag>,
      sku: <Tag>{row.sku}</Tag>,
      warna: row.warna,
      size: <Tag>{row.size}</Tag>,
      qty: <Tag>{row.qty}</Tag>,
      status: (
        <Badge variant={record.status === "lengkap" ? "success" : "warn"}>
          {record.status}
        </Badge>
      )
    }))
  );
}

export default function SupplyReportPage() {
  return (
    <ReportTablePage
      chip="Report"
      columns={columns}
      emptyMessage="Belum ada data Supply yang tersimpan."
      eventNames={["supply-storage-changed"]}
      eyebrow="Report / Supply"
      getSummaryCards={getSummaryCards}
      loadRecords={getSupplyRecords}
      loadErrorMessage="Data report Supply gagal dimuat."
      mapRows={mapRows}
      title="Report Supply"
    />
  );
}
