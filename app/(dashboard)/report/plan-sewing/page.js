"use client";

import ReportTablePage from "@/components/report-table-page";
import { Tag } from "@/components/ui";
import { getPlanSewingRecords } from "@/lib/plan-sewing-storage";

const columns = [
  { key: "tanggal", label: "Tanggal" },
  { key: "noPo", label: "No PO" },
  { key: "kodePc", label: "Kode PC" },
  { key: "kodePs", label: "Kode PS" },
  { key: "model", label: "Model" },
  { key: "sku", label: "Kode SKU" },
  { key: "colour", label: "Colour" },
  { key: "size", label: "Size", align: "center" },
  { key: "qtyPlan", label: "Qty Plan", align: "center" },
  { key: "qtyCutting", label: "Qty Cutting", align: "center" },
  { key: "qtyPlanSewing", label: "Qty Plan Sewing", align: "center" }
];

function getSummaryCards(records) {
  const allRows = records.flatMap((record) => record.rows ?? []);

  return [
    { label: "Total Kode PS", value: records.length },
    { label: "Total Baris SKU", value: allRows.length },
    {
      label: "Total Qty Plan Sewing",
      tone: "success",
      value: allRows.reduce((total, row) => total + Number(row.qtyPlanSewing ?? 0), 0)
    }
  ];
}

function mapRows(records) {
  return records.flatMap((record) =>
    (record.rows ?? []).map((row, index) => ({
      key: `${record.kodePs}-${row.sku}-${index}`,
      tanggal: record.tanggal || "-",
      noPo: <Tag>{record.noPo}</Tag>,
      kodePc: <Tag>{record.kodePc}</Tag>,
      kodePs: <Tag>{record.kodePs}</Tag>,
      model: record.model,
      sku: <Tag>{row.sku}</Tag>,
      colour: row.colour,
      size: <Tag>{row.size}</Tag>,
      qtyPlan: <Tag>{row.qtyPlan}</Tag>,
      qtyCutting: <Tag>{row.qtyCutting}</Tag>,
      qtyPlanSewing: <Tag>{row.qtyPlanSewing}</Tag>
    }))
  );
}

export default function PlanSewingReportPage() {
  return (
    <ReportTablePage
      chip="Report"
      columns={columns}
      emptyMessage="Belum ada data Plan Sewing yang tersimpan."
      eventNames={["plan-sewing-storage-changed"]}
      eyebrow="Report / Plan Sewing"
      getSummaryCards={getSummaryCards}
      loadRecords={getPlanSewingRecords}
      loadErrorMessage="Data report Plan Sewing gagal dimuat."
      mapRows={mapRows}
      title="Report Plan Sewing"
    />
  );
}
