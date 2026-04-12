"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ActionRow,
  Badge,
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
import { getPlanCuttingRecords } from "@/lib/plan-cutting-storage";
import { getSeriRecords } from "@/lib/seri-storage";
import {
  getUsedRackingKodePc,
  saveRackingRecord
} from "@/lib/racking-storage";

export default function RackingPage() {
  const [masterData, setMasterData] = useState({
    operators: { cutting: [], seri: [], racking: [], sewing: [] }
  });
  const [loadError, setLoadError] = useState("");
  const [planCuttingRecords, setPlanCuttingRecords] = useState([]);
  const [seriRecords, setSeriRecords] = useState([]);
  const [usedKodePc, setUsedKodePc] = useState([]);
  const [kodePc, setKodePc] = useState("");
  const [tanggal, setTanggal] = useState("2026-04-11");
  const [operator, setOperator] = useState("");
  const [scanKodeProduksi, setScanKodeProduksi] = useState("");
  const [scannedRows, setScannedRows] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const rackOperators = masterData.operators.racking ?? [];

  useEffect(() => {
    async function syncRecords() {
      try {
        const [nextMasterData, records, nextSeriRecords, usedKode] = await Promise.all([
          getMasterData(),
          getPlanCuttingRecords(),
          getSeriRecords(),
          getUsedRackingKodePc()
        ]);
        const availableRecords = records.filter(
          (record) => !usedKode.includes(record.kodePc)
        );

        setMasterData(nextMasterData);
        setPlanCuttingRecords(availableRecords);
        setSeriRecords(nextSeriRecords);
        setUsedKodePc(usedKode);
        setLoadError("");
        setKodePc((current) => {
          if (
            current &&
            availableRecords.some((record) => record.kodePc === current)
          ) {
            return current;
          }

          return availableRecords[0]?.kodePc ?? "";
        });
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : "Data Racking gagal dimuat.");
        setPlanCuttingRecords([]);
        setSeriRecords([]);
        setUsedKodePc([]);
      }
    }

    syncRecords();
    window.addEventListener("plan-cutting-storage-changed", syncRecords);
    window.addEventListener("seri-storage-changed", syncRecords);
    window.addEventListener("racking-storage-changed", syncRecords);
    window.addEventListener("storage", syncRecords);

    return () => {
      window.removeEventListener("plan-cutting-storage-changed", syncRecords);
      window.removeEventListener("seri-storage-changed", syncRecords);
      window.removeEventListener("racking-storage-changed", syncRecords);
      window.removeEventListener("storage", syncRecords);
    };
  }, []);

  useEffect(() => {
    if (!rackOperators.length) {
      return;
    }

    setOperator((current) => current || rackOperators[0] || "");
  }, [rackOperators]);

  const selectedPlan =
    planCuttingRecords.find((record) => record.kodePc === kodePc) ?? null;
  const selectedSeriRecord =
    seriRecords.find((record) => record.kodePc === kodePc) ?? null;

  const generatedScanRows = useMemo(() => {
    const entries = selectedSeriRecord?.entries ?? [];

    if (!entries.length) {
      return [];
    }

    return entries.map((entry) => {
      return {
        kodeProduksi: entry.kodeProduksi,
        noPo: selectedPlan?.noPo ?? selectedSeriRecord?.noPo ?? "",
        sku: entry.sku,
        model: selectedPlan?.model ?? selectedSeriRecord?.model ?? "",
        produk: entry.produk,
        warna: entry.colour,
        size: entry.size,
        qty: Number(entry.qtyIkat ?? 0),
        jenis: entry.jenis ?? "-",
        status: "Terscan"
      };
    });
  }, [selectedPlan, selectedSeriRecord]);

  useEffect(() => {
    setScannedRows([]);
    setScanKodeProduksi("");
  }, [kodePc]);

  useEffect(() => {
    const normalizedCode = scanKodeProduksi.trim().toLowerCase();

    if (!normalizedCode) {
      return;
    }

    const found = generatedScanRows.find(
      (row) =>
        row.kodeProduksi.toLowerCase() === normalizedCode &&
        !scannedRows.some((item) => item.kodeProduksi === row.kodeProduksi)
    );

    if (found) {
      setScannedRows((current) => [...current, found]);
      setScanKodeProduksi("");
    }
  }, [generatedScanRows, scanKodeProduksi, scannedRows]);

  const isReady = Boolean(selectedPlan?.kodePc);
  const hasSeriData = generatedScanRows.length > 0;
  const target = generatedScanRows.length;
  const scanned = scannedRows.length;
  const sisa = Math.max(target - scanned, 0);
  const isLengkap = isReady && target > 0 && sisa === 0;

  const statusColumns = [
    { key: "model", label: "Model" },
    { key: "warna", label: "Warna" },
    { key: "totalIkat", label: "Total Ikat", align: "center" },
    { key: "terscan", label: "Terscan", align: "center" },
    { key: "sisa", label: "Sisa", align: "center" },
    { key: "status", label: "Status", align: "center" }
  ];

  const statusRows = Object.values(
    generatedScanRows.reduce((accumulator, row) => {
      const key = `${row.model}__${row.warna}`;

      if (!accumulator[key]) {
        accumulator[key] = {
          key,
          model: row.model,
          warna: row.warna,
          totalIkat: 0,
          terscan: 0
        };
      }

      accumulator[key].totalIkat += 1;
      accumulator[key].terscan += scannedRows.some(
        (item) => item.kodeProduksi === row.kodeProduksi
      )
        ? 1
        : 0;

      return accumulator;
    }, {})
  ).map((group) => {
    const remain = Math.max(group.totalIkat - group.terscan, 0);

    return {
      key: group.key,
      model: group.model,
      warna: group.warna,
      totalIkat: <Tag>{group.totalIkat}</Tag>,
      terscan: <Tag>{group.terscan}</Tag>,
      sisa: <Tag>{remain}</Tag>,
      status:
        remain === 0 ? (
          <Badge variant="success">Lengkap</Badge>
        ) : (
          <Badge variant="warn">Proses</Badge>
        )
    };
  });

  const listColumns = [
    { key: "no", label: "No", align: "center" },
    { key: "kodeProduksi", label: "Kode Produksi" },
    { key: "noPo", label: "No PO" },
    { key: "sku", label: "SKU" },
    { key: "model", label: "Model" },
    { key: "produk", label: "Nama Produk" },
    { key: "warna", label: "Warna" },
    { key: "size", label: "Size", align: "center" },
    { key: "qty", label: "Qty", align: "center" },
    { key: "status", label: "Status", align: "center" },
    { key: "aksi", label: "Aksi", align: "center" }
  ];

  const listRows = scannedRows.map((row, index) => ({
    key: row.kodeProduksi,
    no: index + 1,
    kodeProduksi: <Tag>{row.kodeProduksi}</Tag>,
    noPo: row.noPo,
    sku: <Tag>{row.sku}</Tag>,
    model: row.model,
    produk: row.produk,
    warna: row.warna,
    size: <Tag>{row.size}</Tag>,
    qty: <Tag>{row.qty}</Tag>,
    status: <Badge variant="success">{row.status}</Badge>,
    aksi: (
      <Button
        onClick={() => {
          setScannedRows((current) =>
            current.filter((item) => item.kodeProduksi !== row.kodeProduksi)
          );
        }}
        small
        variant="warn"
      >
        Hapus
      </Button>
    )
  }));

  return (
    <>
      <PageHeader
        chip="PPIC"
        eyebrow="PPIC / Proses Produksi"
        title="Racking"
      />

      <FormCard title="Step 1 - Pilih Kode PC">
        <div className="form-grid">
          <Field badge={{ label: "Dropdown", variant: "dropdown" }} label="Kode PC" required>
            <SelectInput
              onChange={(event) => setKodePc(event.target.value)}
              value={kodePc}
            >
              <option value="">-- Pilih Kode PC --</option>
              {planCuttingRecords.map((record) => (
                <option key={record.kodePc} value={record.kodePc}>
                  {record.kodePc}
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

      {!planCuttingRecords.length ? (
        <FormCard title="Status Kode PC">
          <div className="muted-box">
            {usedKodePc.length
              ? "Semua Kode PC dari Plan Cutting sudah dipakai di Racking."
              : "Belum ada data Plan Cutting yang siap dipakai di Racking."}
          </div>
        </FormCard>
      ) : null}

      {isReady && !hasSeriData ? (
        <FormCard title="Status Data Seri">
          <div className="muted-box">
            Belum ada data Seri untuk Kode PC ini, jadi target scan Racking belum bisa dibentuk.
          </div>
        </FormCard>
      ) : null}

      {isReady && hasSeriData ? (
        <>
          <FormCard title="Status per Model dan Warna">
            <DataTable columns={statusColumns} rows={statusRows} />
          </FormCard>

          <FormCard title="Step 2 - Scan Kode Produksi">
            <Field badge={{ label: "Scanner - Auto", variant: "scanner" }} label="Kode Produksi">
              <div className="stack" style={{ gap: "10px" }}>
                <TextInput
                  onChange={(event) => setScanKodeProduksi(event.target.value)}
                  placeholder="Arahkan scanner..."
                  value={scanKodeProduksi}
                />
                <div className="muted-box">
                  {scanKodeProduksi
                    ? "Jika kode cocok dengan hasil kode produksi dari Seri, daftar terscan akan bertambah otomatis."
                    : "Scan kode produksi satu per satu. Qty pada daftar scan akan mengikuti qty per ikat dari Seri."}
                </div>
              </div>
            </Field>
            <div className="summary-grid four" style={{ marginTop: "20px" }}>
              <SummaryCard label="Total Ikat (Target)" value={target} />
              <SummaryCard label="Sudah Discan" tone="success" value={scanned} />
              <SummaryCard label="Sisa" tone={sisa === 0 ? "success" : "warn"} value={sisa} />
              <SummaryCard label="Status" tone={isLengkap ? "success" : "warn"} value={isLengkap ? "Lengkap" : "Proses"} />
            </div>
          </FormCard>

          <FormCard title="Daftar Kode Produksi Terscan">
            <DataTable columns={listColumns} rows={listRows} />
          </FormCard>
        </>
      ) : null}

      <ActionRow>
        <Button
          disabled={!isLengkap}
          onClick={() => {
            if (loadError) {
              window.alert(loadError);
              return;
            }

            if (!selectedPlan || !kodePc) {
              window.alert("Pilih Kode PC terlebih dahulu.");
              return;
            }

            if (!isLengkap) {
              window.alert("Racking belum lengkap, selesaikan scan terlebih dahulu.");
              return;
            }

            setOpenModal(true);
          }}
          variant="primary"
        >
          Simpan ke DB Racking
        </Button>
      </ActionRow>

      <ModalConfirm
        description="Periksa kembali data Racking sebelum disimpan."
        onClose={() => setOpenModal(false)}
        onConfirm={() => {
          (async () => {
          if (!selectedPlan || !kodePc) {
            window.alert("Pilih Kode PC terlebih dahulu.");
            return;
          }

          if (!isLengkap) {
            window.alert("Racking belum lengkap, selesaikan scan terlebih dahulu.");
            return;
          }

            try {
              await saveRackingRecord({
                kodePc,
                noPo: selectedPlan.noPo,
                model: selectedPlan.model,
                tanggal,
                operator,
                rows: scannedRows,
                totalTarget: target,
                totalScanned: scanned,
                status: "Lengkap"
              });

              setOpenModal(false);
              window.alert(`Data Racking disimpan.\nKode PC: ${kodePc}`);
            } catch (error) {
              window.alert(error instanceof Error ? error.message : "Data Racking gagal disimpan.");
            }
          })();
        }}
        open={openModal}
        title="Konfirmasi Simpan Racking"
      >
        <div className="stack" style={{ gap: "12px" }}>
          <div className="summary-grid three">
            <div className="summary-card">
              <span className="summary-label">Kode PC</span>
              <strong>{kodePc || "-"}</strong>
            </div>
            <div className="summary-card">
              <span className="summary-label">KP Terscan</span>
              <strong>{scanned}</strong>
            </div>
            <div className="summary-card">
              <span className="summary-label">Status</span>
              <strong>{isLengkap ? "Lengkap" : "Proses"}</strong>
            </div>
          </div>
          <div className="muted-box">
            Total target ikat: {target} | Sisa: {sisa}
          </div>
        </div>
      </ModalConfirm>
    </>
  );
}
