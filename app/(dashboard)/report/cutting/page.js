"use client";

import ReportTablePage from "@/components/report-table-page";
import { Badge, Tag } from "@/components/ui";
import { getCuttingRecords } from "@/lib/cutting-storage";

const columns = [
  { key: "tanggal", label: "Tanggal" },
  { key: "noPo", label: "No PO" },
  { key: "kodePc", label: "Kode PC" },
  { key: "model", label: "Model" },
  { key: "pemotong", label: "Pemotong" },
  { key: "penggelar", label: "Penggelar" },
  { key: "meja", label: "Meja", align: "center" },
  { key: "cekWarnaPola", label: "Cek Warna & Pola" },
  { key: "cekMarker", label: "Cek Marker" },
  { key: "validasiData", label: "Validasi Data" },
  { key: "colour", label: "Colour" },
  { key: "size", label: "Size", align: "center" },
  { key: "sku", label: "Kode SKU" },
  { key: "qtyPlan", label: "Qty Plan", align: "center" },
  { key: "qtyCutting", label: "Qty Cutting", align: "center" }
];

function getSummaryCards(records) {
  const allRows = records.flatMap((record) => record.rows ?? []);

  return [
    { label: "Total Kode PC", value: records.length },
    { label: "Total Baris SKU", value: allRows.length },
    {
      label: "Total Qty Cutting",
      tone: "success",
      value: allRows.reduce((total, row) => total + Number(row.qtyCutting ?? 0), 0)
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
      pemotong: record.pemotong || "-",
      penggelar: record.penggelar || "-",
      meja: record.meja ? <Badge variant="neutral">{record.meja}</Badge> : "-",
      cekWarnaPola: record.cekWarnaPola || "-",
      cekMarker: record.cekMarker || "-",
      validasiData: record.validasiData || "-",
      colour: row.colour,
      size: <Tag>{row.size}</Tag>,
      sku: <Tag>{row.sku}</Tag>,
      qtyPlan: <Tag>{row.qtyPlan}</Tag>,
      qtyCutting: <Tag>{row.qtyCutting}</Tag>
    }))
  );
}

export default function CuttingReportPage() {
  return (
    <ReportTablePage
      chip="Report"
      columns={columns}
      emptyMessage="Belum ada data Cutting yang tersimpan."
      eventNames={["cutting-storage-changed"]}
      eyebrow="Report / Cutting"
      getSummaryCards={getSummaryCards}
      loadRecords={getCuttingRecords}
      loadErrorMessage="Data report Cutting gagal dimuat."
      mapRows={mapRows}
      title="Report Cutting"
    />
  );
}
