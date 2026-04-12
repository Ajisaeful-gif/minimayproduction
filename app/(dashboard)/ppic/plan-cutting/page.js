"use client";

import { useState } from "react";
import {
  ActionRow,
  Badge,
  Button,
  DataTable,
  Field,
  FormCard,
  ModalConfirm,
  PageHeader,
  SearchableCombobox,
  Tag,
  TextInput
} from "@/components/ui";
import {
  formatCode,
  getJenisKainByModel,
  getKodePolaByModel,
  getRowsByModel,
  modelOptions
} from "@/lib/mock-data";
import { savePlanCuttingRecord } from "@/lib/plan-cutting-storage";

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

function generatePlanCuttingNoPo(dateValue) {
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

  return `PC${month}${weekLetter}${year}`;
}

function getWeekdayIndex(dateValue) {
  const date = new Date(`${dateValue}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return -1;
  }

  return date.getDay();
}

export default function PlanCuttingPage() {
  const initialModel = modelOptions[0]?.value ?? "";
  const [tanggal, setTanggal] = useState("2026-04-11");
  const [noPo, setNoPo] = useState(generatePlanCuttingNoPo("2026-04-11"));
  const [model, setModel] = useState(initialModel);
  const [modelSearch, setModelSearch] = useState(initialModel);
  const [kodePola, setKodePola] = useState(
    getKodePolaByModel(initialModel)
  );
  const [jenisKain, setJenisKain] = useState(
    getJenisKainByModel(initialModel)
  );
  const [qtyMap, setQtyMap] = useState(() =>
    Object.fromEntries(getRowsByModel(initialModel).map((row) => [row.sku, row.qtyPlan]))
  );
  const [openModal, setOpenModal] = useState(false);
  const [tanggalInfo, setTanggalInfo] = useState(
    "Tanggal bisa dipilih dari Senin sampai Sabtu. Hari Minggu tidak digunakan untuk Plan Cutting."
  );

  const rows = getRowsByModel(model);
  const kodePc = formatCode("PC", noPo, model);

  function resolveExactModel(keyword) {
    const normalizedKeyword = String(keyword ?? "").trim().toLowerCase();

    if (!normalizedKeyword) {
      return "";
    }

    const matched = modelOptions.find(
      (item) => item.value.trim().toLowerCase() === normalizedKeyword
    );

    return matched?.value ?? "";
  }

  function applySelectedModel(nextModel) {
    setModel(nextModel);
    setModelSearch(nextModel);
    setKodePola(getKodePolaByModel(nextModel));
    setJenisKain(getJenisKainByModel(nextModel));
    setQtyMap(
      Object.fromEntries(
        getRowsByModel(nextModel).map((row) => [row.sku, row.qtyPlan])
      )
    );
  }

  const columns = [
    { key: "sku", label: "Kode SKU" },
    { key: "produk", label: "Nama Produk" },
    { key: "model", label: "Model" },
    { key: "size", label: "Size", align: "center" },
    { key: "colour", label: "Colour" },
    { key: "qtyPlan", label: "Qty Plan", align: "center" }
  ];

  const tableRows = rows.map((row) => ({
    key: row.sku,
    sku: <Tag>{row.sku}</Tag>,
    produk: row.produk,
    model: row.model,
    size: <Tag>{row.size}</Tag>,
    colour: row.colour,
    qtyPlan: (
      <div style={{ display: "flex", justifyContent: "center" }}>
        <input
          className="text-input"
          min="0"
          onChange={(event) =>
            setQtyMap((current) => ({
              ...current,
              [row.sku]: Number(event.target.value || 0)
            }))
          }
          style={{ maxWidth: "108px", textAlign: "center", minHeight: "42px" }}
          type="number"
          value={qtyMap[row.sku] ?? row.qtyPlan}
        />
      </div>
    )
  }));

  function buildSavedRows() {
    return rows
      .map((row) => ({
        sku: row.sku,
        produk: row.produk,
        model: row.model,
        size: row.size,
        colour: row.colour,
        qtyPlan: Number(qtyMap[row.sku] ?? row.qtyPlan)
      }))
      .filter((row) => row.qtyPlan > 0);
  }

  return (
    <>
      <PageHeader
        chip="PPIC"
        eyebrow="PPIC / Proses Produksi"
        title="Plan Cutting"
      />

      <FormCard title="Informasi Order">
        <div className="form-grid">
          <Field badge={{ label: "Auto Fill", variant: "auto" }} label="No PO" required>
            <TextInput
              placeholder="Format otomatis: PC3A26 (berdasarkan tanggal + 1 minggu)"
              readOnly
              value={noPo}
            />
          </Field>

          <Field badge={{ label: "Search", variant: "dropdown" }} label="Nama Model" required>
            <SearchableCombobox
              emptyMessage="Model tidak ditemukan."
              items={modelOptions}
              onSearchChange={(nextSearch) => {
                setModelSearch(nextSearch);

                const exactModel = resolveExactModel(nextSearch);

                if (exactModel) {
                  applySelectedModel(exactModel);
                  return;
                }

                if (nextSearch !== model) {
                  setModel("");
                  setKodePola("");
                  setJenisKain("");
                  setQtyMap({});
                }
              }}
              onSelect={applySelectedModel}
              placeholder="Ketik nama model, misalnya celana apj..."
              searchValue={modelSearch}
              value={model}
            />
          </Field>

          <Field badge={{ label: "Manual", variant: "manual" }} label="Tanggal">
            <div className="stack" style={{ gap: "8px" }}>
              <TextInput
                onChange={(event) => {
                  const nextDate = event.target.value;

                  if (!nextDate) {
                    setTanggal("");
                    setNoPo("");
                    setTanggalInfo(
                      "Pilih tanggal Plan Cutting. Tanggal yang diperbolehkan adalah Senin sampai Sabtu."
                    );
                    return;
                  }

                  if (getWeekdayIndex(nextDate) === 0) {
                    setTanggalInfo(
                      "Hari Minggu tidak bisa dipilih. Silakan pilih tanggal Senin sampai Sabtu."
                    );
                    return;
                  }

                  setTanggal(nextDate);
                  setNoPo(generatePlanCuttingNoPo(nextDate));
                  setTanggalInfo(
                    "Tanggal aktif valid untuk Plan Cutting. No PO dihitung dari tanggal efektif + 1 minggu, dengan range kerja Senin sampai Sabtu."
                  );
                }}
                type="date"
                value={tanggal}
              />
              <div className="muted-box">{tanggalInfo}</div>
            </div>
          </Field>

          <Field badge={{ label: "Auto Fill", variant: "auto" }} label="Kode Pola">
            <TextInput
              placeholder="Terisi otomatis dari database kode pola"
              readOnly
              value={kodePola}
            />
          </Field>

          <Field badge={{ label: "Auto Fill", variant: "auto" }} label="Jenis Kain">
            <TextInput
              placeholder="Terisi otomatis dari database jenis kain"
              readOnly
              value={jenisKain}
            />
          </Field>

          <Field badge={{ label: "Auto Generate", variant: "generate" }} label="Kode PC">
            <TextInput readOnly value={kodePc} />
          </Field>
        </div>
      </FormCard>

      <FormCard
        action={<Badge variant="success">SKU Aktif {rows.length}</Badge>}
        title="Qty per SKU"
      >
        <DataTable
          columns={columns}
          emptyMessage="Pilih model terlebih dahulu."
          rows={tableRows}
        />
      </FormCard>

      <ActionRow>
        <Button
          onClick={() => {
            if (!tanggal || !noPo || !model || !kodePc) {
              window.alert("Lengkapi tanggal dan model terlebih dahulu.");
              return;
            }

            const savedRows = buildSavedRows();

            if (!savedRows.length) {
              window.alert("Isi minimal satu Qty Plan sebelum disimpan.");
              return;
            }

            setOpenModal(true);
          }}
          variant="primary"
        >
          Simpan & Generate Barcode
        </Button>
      </ActionRow>

      <ModalConfirm
        description="Periksa kembali data Plan Cutting sebelum disimpan."
        onClose={() => setOpenModal(false)}
        onConfirm={() => {
          (async () => {
          const savedRows = buildSavedRows();

          if (!tanggal || !noPo || !model || !kodePc) {
            window.alert("Lengkapi tanggal dan model terlebih dahulu.");
            return;
          }

          if (!savedRows.length) {
            window.alert("Isi minimal satu Qty Plan sebelum disimpan.");
            return;
          }

            await savePlanCuttingRecord({
              id: kodePc,
              kodePc,
              noPo,
              model,
              tanggal,
              kodePola,
              jenisKain,
              rows: savedRows
            });

            setOpenModal(false);
            window.alert(`Plan Cutting disimpan.\nKode PC: ${kodePc}`);
          })();
        }}
        open={openModal}
        title="Konfirmasi Simpan Plan Cutting"
      >
        <div className="stack" style={{ gap: "12px" }}>
          <div className="summary-grid three">
            <div className="summary-card">
              <span className="summary-label">Kode PC</span>
              <strong>{kodePc || "-"}</strong>
            </div>
            <div className="summary-card">
              <span className="summary-label">No PO</span>
              <strong>{noPo || "-"}</strong>
            </div>
            <div className="summary-card">
              <span className="summary-label">Model</span>
              <strong>{model || "-"}</strong>
            </div>
          </div>
          <div className="muted-box">
            Jumlah SKU yang akan disimpan: {buildSavedRows().length}
          </div>
        </div>
      </ModalConfirm>
    </>
  );
}
