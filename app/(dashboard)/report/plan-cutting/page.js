"use client";

import ReportTablePage from "@/components/report-table-page";
import { Tag } from "@/components/ui";
import { getPlanCuttingRecords } from "@/lib/plan-cutting-storage";

const columns = [
  { key: "tanggal", label: "Tanggal" },
  { key: "noPo", label: "No PO" },
  { key: "kodePc", label: "Kode PC" },
  { key: "model", label: "Model" },
  { key: "kodePola", label: "Kode Pola" },
  { key: "jenisKain", label: "Jenis Kain" },
  { key: "colour", label: "Colour" },
  { key: "size", label: "Size", align: "center" },
  { key: "sku", label: "Kode SKU" },
  { key: "produk", label: "Nama Produk" },
  { key: "qtyPlan", label: "Qty Plan", align: "center" }
];

function getSummaryCards(records) {
  const allRows = records.flatMap((record) => record.rows ?? []);

  return [
    { label: "Total Kode PC", value: records.length },
    { label: "Total Baris SKU", value: allRows.length },
    {
      label: "Total Qty Plan",
      tone: "success",
      value: allRows.reduce((total, row) => total + Number(row.qtyPlan ?? 0), 0)
    }
  ];
}

function mapRows(records) {
  return records.flatMap((record) =>
    (record.rows ?? []).map((row, index) => ({
      key: `${record.kodePc}-${row.sku}-${index}`,
      tanggal: record.tanggal || "-",
      noPo: <Tag>{record.noPo}</Tag>,
      kodePc: <Tag>{record.kodePc}</Tag>,
      model: record.model,
      kodePola: record.kodePola || "-",
      jenisKain: record.jenisKain || "-",
      colour: row.colour,
      size: <Tag>{row.size}</Tag>,
      sku: <Tag>{row.sku}</Tag>,
      produk: row.produk,
      qtyPlan: <Tag>{row.qtyPlan}</Tag>
    }))
  );
}

export default function PlanCuttingReportPage() {
  return (
    <ReportTablePage
      chip="Report"
      columns={columns}
      emptyMessage="Belum ada data Plan Cutting yang tersimpan."
      eventNames={["plan-cutting-storage-changed"]}
      eyebrow="Report / Plan Cutting"
      getSummaryCards={getSummaryCards}
      loadRecords={getPlanCuttingRecords}
      loadErrorMessage="Data report Plan Cutting gagal dimuat."
      mapRows={mapRows}
      title="Report Plan Cutting"
    />
  );
}
