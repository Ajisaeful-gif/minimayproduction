"use client";

import { useEffect, useRef, useState } from "react";
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
  SelectInput,
  Tag,
  TextInput
} from "@/components/ui";
import {
  getMasterData,
  getJenisKainByModel,
  getKodePolaByModel,
  getRowsByModel,
  formatCode
} from "@/lib/master-data-client";
import { normalizeColourKey } from "@/lib/colour-format";
import {
  getPlanCuttingRecords,
  savePlanCuttingRecord
} from "@/lib/plan-cutting-storage";

function getWeekdayIndex(dateValue) {
  const date = new Date(`${dateValue}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return -1;
  }

  return date.getDay();
}

function buildPlanCuttingCode(noPo, model) {
  return formatCode("PC", noPo, model);
}

function getColourOptionsByModel(skuRows, model) {
  if (!model) {
    return [];
  }

  const uniqueColours = new Map();

  getRowsByModel(skuRows, model)
    .map((row) => row.colour)
    .filter(Boolean)
    .forEach((value) => {
      const colourKey = normalizeColourKey(value);

      if (!colourKey || uniqueColours.has(colourKey)) {
        return;
      }

      uniqueColours.set(colourKey, value);
    });

  return [...uniqueColours.values()]
    .map((value) => ({ value }))
    .sort((left, right) =>
      String(left.value ?? "").localeCompare(String(right.value ?? ""), undefined, {
        numeric: true,
        sensitivity: "base"
      })
    );
}

function getRowsByModelAndColour(skuRows, model, colour) {
  if (!model || !colour) {
    return [];
  }

  const selectedColourKey = normalizeColourKey(colour);

  return getRowsByModel(skuRows, model).filter(
    (row) => normalizeColourKey(row.colour) === selectedColourKey
  );
}

function areNumberMapsEqual(currentMap, nextMap) {
  const currentKeys = Object.keys(currentMap);
  const nextKeys = Object.keys(nextMap);

  if (currentKeys.length !== nextKeys.length) {
    return false;
  }

  return nextKeys.every((key) => Number(currentMap[key] ?? 0) === Number(nextMap[key] ?? 0));
}

export default function PlanCuttingPage() {
  const [tanggal, setTanggal] = useState("2026-04-11");
  const [noPo, setNoPo] = useState("");
  const [masterData, setMasterData] = useState({
    skuRows: [],
    kodePolaRows: [],
    jenisKainRows: [],
    modelOptions: [],
    operators: { cutting: [], seri: [], racking: [], sewing: [] }
  });
  const [masterError, setMasterError] = useState("");
  const [planCuttingRecords, setPlanCuttingRecords] = useState([]);
  const [model, setModel] = useState("");
  const [modelSearch, setModelSearch] = useState("");
  const [colour, setColour] = useState("");
  const [clearedSelectionKey, setClearedSelectionKey] = useState("");
  const [kodePola, setKodePola] = useState("");
  const [jenisKain, setJenisKain] = useState("");
  const [qtyMap, setQtyMap] = useState({});
  const [openModal, setOpenModal] = useState(false);
  const latestModelRef = useRef("");

  useEffect(() => {
    latestModelRef.current = model;
  }, [model]);

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        const [data, records] = await Promise.all([
          getMasterData(),
          getPlanCuttingRecords()
        ]);

        if (!active) {
          return;
        }

        setMasterData(data);
        setPlanCuttingRecords(records);
        setMasterError("");

        if (!latestModelRef.current && data.modelOptions.length) {
          applySelectedModel(data.modelOptions[0].value, data);
        }
      } catch (error) {
        if (!active) {
          return;
        }

        setMasterError(error instanceof Error ? error.message : "Master data gagal dimuat.");
      }
    }

    loadData();
    window.addEventListener("plan-cutting-storage-changed", loadData);

    return () => {
      active = false;
      window.removeEventListener("plan-cutting-storage-changed", loadData);
    };
  }, []);

  const kodePc = buildPlanCuttingCode(noPo, model);
  const colourOptions = getColourOptionsByModel(masterData.skuRows, model);
  const rows = getRowsByModelAndColour(masterData.skuRows, model, colour);
  const existingRecord =
    planCuttingRecords.find((record) => record.kodePc === kodePc) ?? null;

  function resolveExactModel(keyword) {
    const normalizedKeyword = String(keyword ?? "").trim().toLowerCase();

    if (!normalizedKeyword) {
      return "";
    }

    const matched = masterData.modelOptions.find(
      (item) => item.value.trim().toLowerCase() === normalizedKeyword
    );

    return matched?.value ?? "";
  }

  function applySelectedColour(nextColour, nextModel = model, sourceData = masterData) {
    const nextRows = getRowsByModelAndColour(sourceData.skuRows, nextModel, nextColour);
    const selectionKey = `${buildPlanCuttingCode(noPo, nextModel)}::${nextColour}`;
    const savedRowsBySku = Object.fromEntries(
      (existingRecord?.rows ?? [])
        .filter((row) => normalizeColourKey(row.colour) === normalizeColourKey(nextColour))
        .map((row) => [row.sku, Number(row.qtyPlan ?? 0)])
    );

    setColour(nextColour);
    setQtyMap((current) => {
      const nextQtyMap = Object.fromEntries(
        nextRows.map((row) => [
          row.sku,
          clearedSelectionKey === selectionKey
            ? 0
            : Number(savedRowsBySku[row.sku] ?? row.qtyPlan ?? 0)
        ])
      );

      return areNumberMapsEqual(current, nextQtyMap) ? current : nextQtyMap;
    });
  }

  function applySelectedModel(nextModel, sourceData = masterData) {
    const availableColours = getColourOptionsByModel(sourceData.skuRows, nextModel);
    const nextColour = availableColours[0]?.value ?? "";

    setModel(nextModel);
    setModelSearch(nextModel);
    setColour(nextColour);
    setClearedSelectionKey("");
    setKodePola(getKodePolaByModel(sourceData.kodePolaRows, nextModel));
    setJenisKain(getJenisKainByModel(sourceData.jenisKainRows, nextModel));
  }

  useEffect(() => {
    if (!model || !colour) {
      setQtyMap({});
      return;
    }

    applySelectedColour(colour);
  }, [colour, existingRecord, model]);

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
          <Field badge={{ label: "Manual", variant: "manual" }} label="No PO" required>
            <TextInput
              onChange={(event) => setNoPo(event.target.value)}
              placeholder="Isi No PO manual"
              value={noPo}
            />
          </Field>

          <Field badge={{ label: "Search", variant: "dropdown" }} label="Nama Model" required>
            <SearchableCombobox
              emptyMessage="Model tidak ditemukan."
              items={masterData.modelOptions}
              onSearchChange={(nextSearch) => {
                setModelSearch(nextSearch);

                const exactModel = resolveExactModel(nextSearch);

                if (exactModel) {
                  applySelectedModel(exactModel);
                  return;
                }

                if (nextSearch !== model) {
                  setModel("");
                  setColour("");
                  setClearedSelectionKey("");
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

          <Field badge={{ label: "Dropdown", variant: "dropdown" }} label="Colour" required>
            <SelectInput
              disabled={!model || !colourOptions.length}
              onChange={(event) => {
                setClearedSelectionKey("");
                applySelectedColour(event.target.value);
              }}
              value={colour}
            >
              <option value="">
                {model ? "-- Pilih Colour dari Master SKU --" : "-- Pilih Model terlebih dahulu --"}
              </option>
              {colourOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.value}
                </option>
              ))}
            </SelectInput>
          </Field>

          <Field badge={{ label: "Manual", variant: "manual" }} label="Tanggal">
            <TextInput
              onChange={(event) => {
                const nextDate = event.target.value;

                if (!nextDate) {
                  setTanggal("");
                  return;
                }

                if (getWeekdayIndex(nextDate) === 0) {
                  window.alert("Hari Minggu tidak bisa dipilih. Silakan pilih Senin sampai Sabtu.");
                  return;
                }

                setTanggal(nextDate);
              }}
              type="date"
              value={tanggal}
            />
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

      {masterError ? (
        <FormCard title="Status Database">
          <div className="muted-box">{masterError}</div>
        </FormCard>
      ) : null}

      <FormCard
        action={<Badge variant="success">SKU Aktif {rows.length}</Badge>}
        title="Qty per SKU"
      >
        <DataTable
          columns={columns}
          emptyMessage="Pilih model dan colour terlebih dahulu."
          rows={tableRows}
        />
      </FormCard>

      <ActionRow>
        <Button
          onClick={() => {
            if (masterError) {
              window.alert(masterError);
              return;
            }

            if (!tanggal || !noPo || !model || !colour || !kodePc) {
              window.alert("Lengkapi tanggal, model, dan colour terlebih dahulu.");
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
          if (masterError) {
            window.alert(masterError);
            return;
          }

          const savedRows = buildSavedRows();

          if (!tanggal || !noPo || !model || !colour || !kodePc) {
            window.alert("Lengkapi tanggal, model, dan colour terlebih dahulu.");
            return;
          }

          if (!savedRows.length) {
            window.alert("Isi minimal satu Qty Plan sebelum disimpan.");
            return;
          }

            try {
              await savePlanCuttingRecord({
                id: kodePc,
                kodePc,
                noPo,
                model,
                colour,
                tanggal,
                kodePola,
                jenisKain,
                rows: savedRows
              });

              setOpenModal(false);
              setClearedSelectionKey(`${kodePc}::${colour}`);
              setQtyMap(
                Object.fromEntries(rows.map((row) => [row.sku, 0]))
              );
              window.alert(`Plan Cutting disimpan.\nKode PC: ${kodePc}`);
            } catch (error) {
              window.alert(error instanceof Error ? error.message : "Plan Cutting gagal disimpan.");
            }
          })();
        }}
        open={openModal}
        title="Konfirmasi Simpan Plan Cutting"
      >
        <div className="stack" style={{ gap: "12px" }}>
          <div className="summary-grid four">
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
            <div className="summary-card">
              <span className="summary-label">Colour</span>
              <strong>{colour || "-"}</strong>
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
