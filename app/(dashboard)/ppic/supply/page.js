"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ActionRow,
  Button,
  DataTable,
  Field,
  FormCard,
  ModalConfirm,
  PageHeader,
  SummaryCard,
  Tag,
  TextInput,
  SelectInput
} from "@/components/ui";
import { getMasterData } from "@/lib/master-data-client";
import { getPlanSewingRecords } from "@/lib/plan-sewing-storage";
import { getRackingRecords } from "@/lib/racking-storage";
import {
  getUsedSupplyKodePs,
  saveSupplyRecord
} from "@/lib/supply-storage";

export default function SupplyPage() {
  const [masterData, setMasterData] = useState({
    operators: { cutting: [], seri: [], racking: [], sewing: [] }
  });
  const [loadError, setLoadError] = useState("");
  const [planSewingRecords, setPlanSewingRecords] = useState([]);
  const [usedKodePs, setUsedKodePs] = useState([]);
  const [rackingRecords, setRackingRecords] = useState([]);
  const [kodePs, setKodePs] = useState("");
  const [tanggal, setTanggal] = useState("2026-04-11");
  const [operator, setOperator] = useState("");
  const [scanKodeProduksi, setScanKodeProduksi] = useState("");
  const [scannedRows, setScannedRows] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const rackOperators = masterData.operators.racking ?? [];

  useEffect(() => {
    async function syncRecords() {
      try {
        const [nextMasterData, planRecords, usedPs, nextRackingRecords] = await Promise.all([
          getMasterData(),
          getPlanSewingRecords(),
          getUsedSupplyKodePs(),
          getRackingRecords()
        ]);
        const availableRecords = planRecords.filter(
          (record) => !usedPs.includes(record.kodePs)
        );

        setMasterData(nextMasterData);
        setPlanSewingRecords(availableRecords);
        setUsedKodePs(usedPs);
        setRackingRecords(nextRackingRecords);
        setLoadError("");
        setKodePs((current) => {
          if (
            current &&
            availableRecords.some((record) => record.kodePs === current)
          ) {
            return current;
          }

          return availableRecords[0]?.kodePs ?? "";
        });
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : "Data Supply gagal dimuat.");
        setPlanSewingRecords([]);
        setUsedKodePs([]);
        setRackingRecords([]);
      }
    }

    syncRecords();
    window.addEventListener("plan-sewing-storage-changed", syncRecords);
    window.addEventListener("racking-storage-changed", syncRecords);
    window.addEventListener("supply-storage-changed", syncRecords);
    window.addEventListener("storage", syncRecords);

    return () => {
      window.removeEventListener("plan-sewing-storage-changed", syncRecords);
      window.removeEventListener("racking-storage-changed", syncRecords);
      window.removeEventListener("supply-storage-changed", syncRecords);
      window.removeEventListener("storage", syncRecords);
    };
  }, []);

  useEffect(() => {
    if (!rackOperators.length) {
      return;
    }

    setOperator((current) => current || rackOperators[0] || "");
  }, [rackOperators]);

  const selectedPlanSewing =
    planSewingRecords.find((record) => record.kodePs === kodePs) ?? null;
  const relatedRacking =
    rackingRecords.find((record) => record.kodePc === selectedPlanSewing?.kodePc) ??
    null;
  const planRows = selectedPlanSewing?.rows ?? [];
  const validScanRows = useMemo(() => relatedRacking?.rows ?? [], [relatedRacking]);
  const hasRackingData = validScanRows.length > 0;

  useEffect(() => {
    setScannedRows([]);
    setScanKodeProduksi("");
  }, [kodePs]);

  useEffect(() => {
    const found = validScanRows.find(
      (row) =>
        row.kodeProduksi.toLowerCase() === scanKodeProduksi.trim().toLowerCase() &&
        !scannedRows.some((item) => item.kodeProduksi === row.kodeProduksi)
    );

    if (found) {
      setScannedRows((current) => [...current, found]);
      setScanKodeProduksi("");
    }
  }, [scanKodeProduksi, scannedRows, validScanRows]);

  const isReady = Boolean(selectedPlanSewing?.kodePs);
  const totalPlan = planRows.reduce(
    (total, row) => total + Number(row.qtyPlanSewing ?? 0),
    0
  );
  const totalActual = scannedRows.reduce((total, row) => total + row.qty, 0);
  const statusTone = totalActual === totalPlan ? "success" : totalActual > totalPlan ? "warn" : "danger";
  const statusText = totalActual === totalPlan ? "Sesuai" : totalActual > totalPlan ? "Lebih" : "Kurang";

  const planColumns = [
    { key: "po", label: "No PO" },
    { key: "sku", label: "SKU" },
    { key: "produk", label: "Nama Produk" },
    { key: "warna", label: "Warna" },
    { key: "size", label: "Size", align: "center" },
    { key: "kodePc", label: "Kode PC" },
    { key: "qtyPlan", label: "Qty Plan", align: "center" }
  ];

  const planTableRows = planRows.map((row) => ({
    key: row.sku,
    po: selectedPlanSewing?.noPo ?? "-",
    sku: <Tag>{row.sku}</Tag>,
    produk: row.produk,
    warna: row.colour,
    size: <Tag>{row.size}</Tag>,
    kodePc: <Tag>{selectedPlanSewing?.kodePc ?? "-"}</Tag>,
    qtyPlan: <Tag>{row.qtyPlanSewing}</Tag>
  }));

  const scannedColumns = [
    { key: "no", label: "No", align: "center" },
    { key: "kodeProduksi", label: "Kode Produksi" },
    { key: "sku", label: "SKU" },
    { key: "produk", label: "Nama Produk" },
    { key: "warna", label: "Warna" },
    { key: "size", label: "Size", align: "center" },
    { key: "qty", label: "Qty", align: "center" },
    { key: "hapus", label: "Hapus", align: "center" }
  ];

  const scannedTableRows = scannedRows.map((row, index) => ({
    key: row.kodeProduksi,
    no: index + 1,
    kodeProduksi: <Tag>{row.kodeProduksi}</Tag>,
    sku: <Tag>{row.sku}</Tag>,
    produk: row.produk,
    warna: row.warna,
    size: <Tag>{row.size}</Tag>,
    qty: <Tag>{row.qty}</Tag>,
    hapus: (
      <Button
        onClick={() =>
          setScannedRows((current) => current.filter((item) => item.kodeProduksi !== row.kodeProduksi))
        }
        small
      >
        Hapus
      </Button>
    )
  }));

  const recapColumns = [
    { key: "kodePs", label: "Kode PS" },
    { key: "sku", label: "SKU" },
    { key: "produk", label: "Nama Produk" },
    { key: "warna", label: "Warna" },
    { key: "size", label: "Size", align: "center" },
    { key: "qtyPlan", label: "Qty Plan", align: "center" },
    { key: "qtyActual", label: "Qty Actual", align: "center" },
    { key: "selisih", label: "Selisih", align: "center" }
  ];

  const recapRows = planRows.map((row) => {
    const actual = scannedRows
      .filter((item) => item.sku === row.sku)
      .reduce((total, item) => total + item.qty, 0);
    const selisih = actual - row.qtyPlanSewing;

    return {
      key: row.sku,
      kodePs: <Tag>{kodePs}</Tag>,
      sku: <Tag>{row.sku}</Tag>,
      produk: row.produk,
      warna: row.colour,
      size: <Tag>{row.size}</Tag>,
      qtyPlan: <Tag>{row.qtyPlanSewing}</Tag>,
      qtyActual: <Tag>{actual}</Tag>,
      selisih: (
        <span style={{ color: selisih === 0 ? "#2f855a" : selisih > 0 ? "#d97706" : "#c05621", fontWeight: 700 }}>
          {selisih > 0 ? `+${selisih}` : selisih}
        </span>
      )
    };
  });

  return (
    <>
      <PageHeader
        chip="PPIC"
        eyebrow="PPIC / Proses Produksi"
        title="Supply"
      />

      <FormCard title="Pilih No PS">
        <div className="form-grid">
          <Field badge={{ label: "Dropdown", variant: "dropdown" }} label="No PS" required>
            <SelectInput onChange={(event) => setKodePs(event.target.value)} value={kodePs}>
              <option value="">-- Pilih No PS --</option>
              {planSewingRecords.map((record) => (
                <option key={record.kodePs} value={record.kodePs}>
                  {record.kodePs}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field badge={{ label: "Manual", variant: "manual" }} label="Tanggal">
            <TextInput onChange={(event) => setTanggal(event.target.value)} type="date" value={tanggal} />
          </Field>
          <Field badge={{ label: "Dropdown", variant: "dropdown" }} label="Operator">
            <SelectInput onChange={(event) => setOperator(event.target.value)} value={operator}>
              {rackOperators.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </SelectInput>
          </Field>
        </div>
      </FormCard>

      {loadError ? (
        <FormCard title="Status Database">
          <div className="muted-box">{loadError}</div>
        </FormCard>
      ) : null}

      {!planSewingRecords.length ? (
        <FormCard title="Status No PS">
          <div className="muted-box">
            {usedKodePs.length
              ? "Semua No PS dari Plan Sewing sudah dipakai di Supply."
              : "Belum ada data Plan Sewing yang siap dipakai di Supply."}
          </div>
        </FormCard>
      ) : null}

      {isReady && !hasRackingData ? (
        <FormCard title="Status Data Racking">
          <div className="muted-box">
            Belum ada data Racking untuk Kode PC pada No PS ini, jadi scan Kode Produksi belum bisa dipakai.
          </div>
        </FormCard>
      ) : null}

      {isReady ? (
        <>
          <FormCard title="Data dari DB Plan Sewing">
            <DataTable columns={planColumns} rows={planTableRows} />
          </FormCard>

          <FormCard title="Scan Kode Produksi (auto input)">
            <Field badge={{ label: "Scanner - Auto", variant: "scanner" }} label="Kode Produksi">
              <div className="stack" style={{ gap: "10px" }}>
                <TextInput
                  onChange={(event) => setScanKodeProduksi(event.target.value)}
                  placeholder="Scan Kode Produksi..."
                  value={scanKodeProduksi}
                />
                <div className="muted-box">
                  {hasRackingData
                    ? "Scan akan menerima hanya kode produksi yang sudah ada di data Racking."
                    : "Data scan belum tersedia karena No PS ini belum punya data Racking yang terhubung."}
                </div>
              </div>
            </Field>
            <div className="summary-grid three" style={{ marginTop: "20px" }}>
              <SummaryCard label="Total KP Terscan" value={scannedRows.length} />
              <SummaryCard label="Total Qty Actual" tone="success" value={totalActual} />
              <SummaryCard label="Status" tone={statusTone} value={statusText} />
            </div>
          </FormCard>

          <FormCard title="Daftar Ikat Terscan">
            <DataTable columns={scannedColumns} rows={scannedTableRows} />
          </FormCard>

          <FormCard title="Rekap">
            <DataTable columns={recapColumns} rows={recapRows} />
          </FormCard>
        </>
      ) : null}

      <ActionRow>
        <Button
          disabled={!isReady || !hasRackingData}
          onClick={() => {
            if (loadError) {
              window.alert(loadError);
              return;
            }

            setOpenModal(true);
          }}
          variant="primary"
        >
          Simpan ke DB Supply
        </Button>
      </ActionRow>

      <ModalConfirm
        description="Periksa kembali data Supply sebelum disimpan."
        onClose={() => setOpenModal(false)}
        onConfirm={() => {
          (async () => {
          if (!selectedPlanSewing || !kodePs) {
            window.alert("Pilih No PS terlebih dahulu.");
            return;
          }

          try {
            await saveSupplyRecord({
              kodePs,
              kodePc: selectedPlanSewing.kodePc,
              tanggal,
              operator,
              rows: scannedRows,
              totalPlan,
              totalActual,
              status: statusText
            });

            setOpenModal(false);
            window.alert(`Data Supply disimpan.\nNo PS: ${kodePs}`);
          } catch (error) {
            window.alert(error instanceof Error ? error.message : "Data Supply gagal disimpan.");
          }
          })();
        }}
        open={openModal}
        title="Konfirmasi Simpan Supply"
      >
        <div className="stack" style={{ gap: "16px" }}>
          <div className="summary-grid three">
            <div className="summary-card">
              <span className="summary-label">No PS</span>
              <strong>{kodePs || "-"}</strong>
            </div>
            <div className="summary-card">
              <span className="summary-label">Kode PC</span>
              <strong>{selectedPlanSewing?.kodePc ?? "-"}</strong>
            </div>
            <div className="summary-card">
              <span className="summary-label">Total Qty Actual</span>
              <strong>{totalActual}</strong>
            </div>
          </div>
          <DataTable columns={recapColumns} rows={recapRows} />
        </div>
      </ModalConfirm>
    </>
  );
}
