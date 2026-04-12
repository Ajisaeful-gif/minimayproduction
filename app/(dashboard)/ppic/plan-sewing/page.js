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
  StatusStrip,
  SummaryCard,
  Tag,
  TextInput,
  SelectInput
} from "@/components/ui";
import { formatCode } from "@/lib/master-data-client";
import { getPlanCuttingRecords } from "@/lib/plan-cutting-storage";
import { getRackingRecords } from "@/lib/racking-storage";
import {
  getUsedPlanSewingKodePc,
  savePlanSewingRecord
} from "@/lib/plan-sewing-storage";

function getWeekLetter(dateValue) {
  const day = dateValue.getDate();

  if (day <= 7) {
    return "A";
  }

  if (day <= 14) {
    return "B";
  }

  if (day <= 21) {
    return "C";
  }

  if (day <= 28) {
    return "D";
  }

  return "E";
}

function generatePlanSewingNoPo(dateValue) {
  if (!dateValue) {
    return "";
  }

  const date = new Date(`${dateValue}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const effectiveDate = new Date(date);
  effectiveDate.setDate(effectiveDate.getDate() + 7);

  const month = effectiveDate.getMonth() + 1;
  const weekLetter = getWeekLetter(effectiveDate);
  const year = String(effectiveDate.getFullYear()).slice(-2);

  return `PS${month}${weekLetter}${year}`;
}

export default function PlanSewingPage() {
  const [loadError, setLoadError] = useState("");
  const [planCuttingRecords, setPlanCuttingRecords] = useState([]);
  const [usedKodePc, setUsedKodePc] = useState([]);
  const [rackingRecords, setRackingRecords] = useState([]);
  const [kodePc, setKodePc] = useState("");
  const [tanggal, setTanggal] = useState("2026-04-11");
  const [noPo, setNoPo] = useState(generatePlanSewingNoPo("2026-04-11"));
  const [qtyMap, setQtyMap] = useState({});
  const [openModal, setOpenModal] = useState(false);

  useEffect(() => {
    async function syncRecords() {
      try {
        const [planRecords, usedKode, nextRackingRecords] = await Promise.all([
          getPlanCuttingRecords(),
          getUsedPlanSewingKodePc(),
          getRackingRecords()
        ]);
        const availableRecords = planRecords.filter(
          (record) => !usedKode.includes(record.kodePc)
        );

        setPlanCuttingRecords(availableRecords);
        setUsedKodePc(usedKode);
        setRackingRecords(nextRackingRecords);
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
        setLoadError(error instanceof Error ? error.message : "Data Plan Sewing gagal dimuat.");
        setPlanCuttingRecords([]);
        setUsedKodePc([]);
        setRackingRecords([]);
      }
    }

    syncRecords();
    window.addEventListener("plan-cutting-storage-changed", syncRecords);
    window.addEventListener("racking-storage-changed", syncRecords);
    window.addEventListener("plan-sewing-storage-changed", syncRecords);
    window.addEventListener("storage", syncRecords);

    return () => {
      window.removeEventListener("plan-cutting-storage-changed", syncRecords);
      window.removeEventListener("racking-storage-changed", syncRecords);
      window.removeEventListener("plan-sewing-storage-changed", syncRecords);
      window.removeEventListener("storage", syncRecords);
    };
  }, []);

  const selectedPlan =
    planCuttingRecords.find((record) => record.kodePc === kodePc) ?? null;
  const model = selectedPlan?.model ?? "";
  const rows = selectedPlan?.rows ?? [];
  const relatedRacking =
    rackingRecords.find((record) => record.kodePc === kodePc) ?? null;
  const rackingQtyMap = useMemo(() => {
    return (relatedRacking?.rows ?? []).reduce((accumulator, row) => {
      const current = Number(accumulator[row.sku] ?? 0);

      return {
        ...accumulator,
        [row.sku]: current + Number(row.qty ?? 0)
      };
    }, {});
  }, [relatedRacking]);
  const hasRackingData = Boolean(relatedRacking);

  useEffect(() => {
    setQtyMap(
      Object.fromEntries(
        rows.map((row) => [
          row.sku,
          hasRackingData
            ? Number(rackingQtyMap[row.sku] ?? 0)
            : Number(row.qtyPlan ?? 0)
        ])
      )
    );
  }, [hasRackingData, kodePc, rackingQtyMap, rows]);

  const isReady = Boolean(selectedPlan?.kodePc);
  const noPc = kodePc;
  const kodePs = formatCode("PS", noPo, model);
  const totalCut = rows.reduce(
    (total, row) => total + Number(rackingQtyMap[row.sku] ?? 0),
    0
  );
  const totalPlanCutting = rows.reduce(
    (total, row) => total + Number(row.qtyPlan ?? 0),
    0
  );
  const totalReferenceQty = hasRackingData ? totalCut : totalPlanCutting;
  const totalPlanSewing = rows.reduce((total, row) => total + Number(qtyMap[row.sku] ?? 0), 0);

  const columns = [
    { key: "sku", label: "Kode SKU" },
    { key: "po", label: "No PO" },
    { key: "produk", label: "Nama Produk" },
    { key: "model", label: "Model" },
    { key: "size", label: "Size", align: "center" },
    { key: "warna", label: "Warna" },
    { key: "kodePc", label: "Kode PC" },
    { key: "racking", label: "Racking / Qty Cutting", align: "center" },
    { key: "planCutting", label: "Plan Cutting / Qty PC", align: "center" },
    { key: "planSewing", label: "Plan Sewing / Qty PS", align: "center" }
  ];

  function getReferenceQty(row) {
    return hasRackingData
      ? Number(rackingQtyMap[row.sku] ?? 0)
      : Number(row.qtyPlan ?? 0);
  }

  const tableRows = rows.map((row) => {
    const referenceQty = getReferenceQty(row);

    return {
      key: row.sku,
      sku: <Tag>{row.sku}</Tag>,
      po: noPo || "-",
      produk: row.produk,
      model: row.model,
      size: <Tag>{row.size}</Tag>,
      warna: row.colour,
      kodePc: <Tag>{noPc || "-"}</Tag>,
      racking: hasRackingData ? (
        <Tag>{Number(rackingQtyMap[row.sku] ?? 0)}</Tag>
      ) : (
        <span style={{ color: "#6d6255" }}>-</span>
      ),
      planCutting: hasRackingData ? (
        <span style={{ color: "#6d6255" }}>-</span>
      ) : (
        <Tag>{Number(row.qtyPlan ?? 0)}</Tag>
      ),
      planSewing: (
        <div style={{ display: "flex", justifyContent: "center" }}>
          <input
            className="text-input"
            min="0"
            onChange={(event) =>
              setQtyMap((current) => ({
                ...current,
                [row.sku]: Math.min(
                  Number(event.target.value || 0),
                  referenceQty
                )
              }))
            }
            style={{ maxWidth: "96px", textAlign: "center", minHeight: "42px" }}
            type="number"
            max={referenceQty}
            value={qtyMap[row.sku] ?? 0}
          />
        </div>
      )
    };
  });

  function buildSavedRows() {
    return rows.map((row) => {
      const referenceQty = getReferenceQty(row);
      const qtyPlanSewing = Number(qtyMap[row.sku] ?? 0);

      if (qtyPlanSewing > referenceQty) {
        throw new Error(
          `Qty Plan Sewing untuk SKU ${row.sku} tidak boleh lebih dari ${referenceQty}.`
        );
      }

      return {
        sku: row.sku,
        produk: row.produk,
        model: row.model,
        size: row.size,
        colour: row.colour,
        qtyPlan: Number(row.qtyPlan ?? 0),
        qtyCutting: Number(rackingQtyMap[row.sku] ?? 0),
        qtyPlanSewing
      };
    });
  }

  return (
    <>
      <PageHeader
        chip="PPIC"
        eyebrow="PPIC / Proses Produksi"
        title="Plan Sewing"
      />

      <FormCard title="Informasi Order">
        <div className="form-grid">
          <Field badge={{ label: "Dropdown", variant: "dropdown" }} label="Kode PC" required>
            <SelectInput onChange={(event) => setKodePc(event.target.value)} value={kodePc}>
              <option value="">-- Pilih Kode PC --</option>
              {planCuttingRecords.map((record) => (
                <option key={record.kodePc} value={record.kodePc}>
                  {record.kodePc}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field badge={{ label: "Auto Fill", variant: "auto" }} label="No PO" required>
            <TextInput
              placeholder="Format otomatis: PS4B26 (berdasarkan tanggal + 1 minggu)"
              readOnly
              value={noPo}
            />
          </Field>
          <Field badge={{ label: "Manual", variant: "manual" }} label="Tanggal">
            <TextInput
              onChange={(event) => {
                const nextDate = event.target.value;
                setTanggal(nextDate);
                setNoPo(generatePlanSewingNoPo(nextDate));
              }}
              type="date"
              value={tanggal}
            />
          </Field>
          <Field badge={{ label: "Auto Fill", variant: "auto" }} label="Nama Model" required>
            <TextInput readOnly value={model} />
          </Field>
          <Field badge={{ label: "Auto Generate", variant: "generate" }} full label="Kode PS">
            <TextInput readOnly value={kodePs} />
          </Field>
        </div>

        {!planCuttingRecords.length ? (
          <StatusStrip>
            <Badge variant="warn">Belum Ada Kode PC</Badge>
            <span className="status-copy">
              {usedKodePc.length
                ? "Semua Kode PC dari Plan Cutting sudah dipakai di Plan Sewing."
                : "Belum ada data Plan Cutting yang siap dipakai di Plan Sewing."}
            </span>
          </StatusStrip>
        ) : null}

        {isReady ? (
          <StatusStrip>
            <Badge variant={hasRackingData ? "success" : "warn"}>
              {hasRackingData ? "Ada di Racking" : "Belum Sampai Racking"}
            </Badge>
            <span className="status-copy">
              {hasRackingData
                ? "Qty Cutting sudah terbaca dari data Racking yang disimpan dan menjadi satu-satunya referensi qty."
                : "Qty Cutting belum tersedia. Tabel hanya memakai Qty Plan dari Plan Cutting sebagai referensi."}
            </span>
            <Tag>{noPc}</Tag>
          </StatusStrip>
        ) : null}
      </FormCard>

      {loadError ? (
        <FormCard title="Status Database">
          <div className="muted-box">{loadError}</div>
        </FormCard>
      ) : null}

      {isReady ? (
        <FormCard title="Data SKU - isi Qty Plan Sewing">
          <DataTable columns={columns} rows={tableRows} />
          <div className="summary-grid three" style={{ marginTop: "20px" }}>
            <SummaryCard label="Total SKU" value={rows.length} />
            <SummaryCard
              label={hasRackingData ? "Total Qty Cutting (Racking)" : "Total Qty Plan (Plan Cutting)"}
              tone="success"
              value={totalReferenceQty}
            />
            <SummaryCard label="Total Qty Plan Sewing" tone="warn" value={totalPlanSewing} />
          </div>
        </FormCard>
      ) : null}

      <ActionRow>
        <Button
          onClick={() => {
            if (loadError) {
              window.alert(loadError);
              return;
            }

            if (!selectedPlan || !kodePc || !noPo || !kodePs) {
              window.alert("Pilih Kode PC dan tanggal terlebih dahulu.");
              return;
            }

            try {
              buildSavedRows();
            } catch (error) {
              window.alert(error.message);
              return;
            }

            setOpenModal(true);
          }}
          variant="primary"
        >
          Simpan ke DB Plan Sewing
        </Button>
      </ActionRow>

      <ModalConfirm
        description="Periksa kembali data Plan Sewing sebelum disimpan."
        onClose={() => setOpenModal(false)}
        onConfirm={() => {
          (async () => {
          if (!selectedPlan || !kodePc || !noPo || !kodePs) {
            window.alert("Pilih Kode PC dan tanggal terlebih dahulu.");
            return;
          }

          try {
            const savedRows = buildSavedRows();

            await savePlanSewingRecord({
              kodePc,
              noPc,
              noPo,
              kodePs,
              tanggal,
              model,
              rows: savedRows
            });
          } catch (error) {
            window.alert(error.message);
            return;
          }

          setOpenModal(false);
          window.alert(`Plan Sewing disimpan.\nKode PC: ${kodePc}`);
          })();
        }}
        open={openModal}
        title="Konfirmasi Simpan Plan Sewing"
      >
        <div className="stack" style={{ gap: "12px" }}>
          <div className="summary-grid three">
            <div className="summary-card">
              <span className="summary-label">Kode PC</span>
              <strong>{kodePc || "-"}</strong>
            </div>
            <div className="summary-card">
              <span className="summary-label">Kode PS</span>
              <strong>{kodePs || "-"}</strong>
            </div>
            <div className="summary-card">
              <span className="summary-label">Total Qty PS</span>
              <strong>{totalPlanSewing}</strong>
            </div>
          </div>
          <div className="muted-box">
            Referensi qty aktif: {hasRackingData ? "Racking / Qty Cutting" : "Plan Cutting / Qty PC"}
          </div>
        </div>
      </ModalConfirm>
    </>
  );
}
