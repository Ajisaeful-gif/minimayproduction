"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ActionRow,
  Badge,
  Button,
  CodeDisplay,
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
import { getMasterData, getSkuMetaBySku } from "@/lib/master-data-client";
import { getCuttingRecords } from "@/lib/cutting-storage";
import {
  deleteSeriEntry,
  getSeriRecords,
  saveSeriEntry
} from "@/lib/seri-storage";

function buildKodeProduksi(type, sequence, noPo) {
  const prefix = type === "Rayon" ? "KPR" : "KPS";

  return `${prefix}${String(sequence).padStart(3, "0")}-${noPo ?? ""}`;
}

function buildSkuTotals(entries = []) {
  return entries.reduce((accumulator, entry) => {
    const current = Number(accumulator[entry.sku] ?? 0);

    return {
      ...accumulator,
      [entry.sku]: current + Number(entry.qtyIkat ?? 0)
    };
  }, {});
}

function isKodePcComplete(cuttingRecord, seriRecord) {
  if (!cuttingRecord || !Array.isArray(cuttingRecord.rows) || !cuttingRecord.rows.length) {
    return false;
  }

  const skuTotals = buildSkuTotals(seriRecord?.entries ?? []);

  return cuttingRecord.rows.every(
    (row) => Number(skuTotals[row.sku] ?? 0) === Number(row.qtyCutting ?? 0)
  );
}

const EMPTY_ROWS = [];
const EMPTY_ENTRIES = [];

export default function SeriPage() {
  const [masterData, setMasterData] = useState({
    skuRows: [],
    operators: { cutting: [], seri: [], racking: [], sewing: [] }
  });
  const [loadError, setLoadError] = useState("");
  const [availableCuttingRecords, setAvailableCuttingRecords] = useState([]);
  const [seriRecords, setSeriRecords] = useState([]);
  const [completedKodePc, setCompletedKodePc] = useState([]);
  const [kodePc, setKodePc] = useState("");
  const [tanggal, setTanggal] = useState("2026-04-12");
  const [operator1, setOperator1] = useState("");
  const [operator2, setOperator2] = useState("");
  const [selectedSku, setSelectedSku] = useState("");
  const [qtyIkatInput, setQtyIkatInput] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const seriOperators = masterData.operators.seri ?? [];

  useEffect(() => {
    async function syncRecords() {
      try {
        const [nextMasterData, cuttingRecords, nextSeriRecords] = await Promise.all([
          getMasterData(),
          getCuttingRecords(),
          getSeriRecords()
        ]);
        const doneKodePc = cuttingRecords
          .filter((record) =>
            isKodePcComplete(
              record,
              nextSeriRecords.find((item) => item.kodePc === record.kodePc)
            )
          )
          .map((record) => record.kodePc);
        const nextAvailableRecords = cuttingRecords.filter(
          (record) => !doneKodePc.includes(record.kodePc)
        );

        setMasterData(nextMasterData);
        setSeriRecords(nextSeriRecords);
        setCompletedKodePc(doneKodePc);
        setAvailableCuttingRecords(nextAvailableRecords);
        setLoadError("");
        setKodePc((current) => {
          if (
            current &&
            nextAvailableRecords.some((record) => record.kodePc === current)
          ) {
            return current;
          }

          return nextAvailableRecords[0]?.kodePc ?? "";
        });
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : "Data Seri gagal dimuat.");
        setAvailableCuttingRecords([]);
        setSeriRecords([]);
        setCompletedKodePc([]);
      }
    }

    syncRecords();
    window.addEventListener("cutting-storage-changed", syncRecords);
    window.addEventListener("seri-storage-changed", syncRecords);
    window.addEventListener("storage", syncRecords);

    return () => {
      window.removeEventListener("cutting-storage-changed", syncRecords);
      window.removeEventListener("seri-storage-changed", syncRecords);
      window.removeEventListener("storage", syncRecords);
    };
  }, []);

  const selectedCutting =
    availableCuttingRecords.find((record) => record.kodePc === kodePc) ?? null;
  const selectedSeriRecord =
    seriRecords.find((record) => record.kodePc === kodePc) ?? null;
  const cuttingRows = selectedCutting?.rows ?? EMPTY_ROWS;
  const historyEntries = selectedSeriRecord?.entries ?? EMPTY_ENTRIES;
  const skuTotals = useMemo(() => buildSkuTotals(historyEntries), [historyEntries]);

  useEffect(() => {
    setSelectedSku((current) => {
      if (current && cuttingRows.some((row) => row.sku === current)) {
        return current;
      }

      return cuttingRows[0]?.sku ?? "";
    });

    if (selectedSeriRecord?.kodePc === kodePc) {
      setTanggal(selectedSeriRecord.tanggal || "2026-04-12");
      setOperator1(selectedSeriRecord.operator1 || seriOperators[0] || "");
      setOperator2(
        selectedSeriRecord.operator2 || seriOperators[1] || seriOperators[0] || ""
      );
    } else {
      setTanggal("2026-04-12");
      setOperator1(seriOperators[0] || "");
      setOperator2(seriOperators[1] || seriOperators[0] || "");
    }

    setQtyIkatInput("");
  }, [cuttingRows, kodePc, selectedSeriRecord, seriOperators]);

  const selectedRow =
    cuttingRows.find((row) => row.sku === selectedSku) ?? cuttingRows[0] ?? null;
  const selectedMeta = selectedRow ? getSkuMetaBySku(masterData.skuRows, selectedRow.sku) : null;
  const totalSavedForSelected = selectedRow
    ? Number(skuTotals[selectedRow.sku] ?? 0)
    : 0;
  const selectedQtyCutting = Number(selectedRow?.qtyCutting ?? 0);
  const sisaSelected = Math.max(selectedQtyCutting - totalSavedForSelected, 0);
  const nextSequence = selectedSeriRecord?.nextSequence ?? 1;
  const kodeProduksi = selectedRow
    ? buildKodeProduksi(selectedMeta?.type, nextSequence, selectedCutting?.noPo)
    : "";
  const isReady = Boolean(kodePc.trim());

  const progressColumns = [
    { key: "sku", label: "Kode SKU" },
    { key: "produk", label: "Nama Produk" },
    { key: "size", label: "Size", align: "center" },
    { key: "colour", label: "Colour" },
    { key: "qtyCutting", label: "Qty Cutting", align: "center" },
    { key: "totalIkat", label: "Total Ikat", align: "center" },
    { key: "status", label: "Status", align: "center" }
  ];

  const progressRows = cuttingRows.map((row) => {
    const qtyIkat = Number(skuTotals[row.sku] ?? 0);
    const qtyCutting = Number(row.qtyCutting ?? 0);
    const progress = qtyCutting ? Math.round((qtyIkat / qtyCutting) * 100) : 0;
    const status =
      qtyIkat === qtyCutting ? (
        <Badge variant="success">Sesuai</Badge>
      ) : (
        <Badge variant="warn">{progress}%</Badge>
      );

    return {
      key: row.sku,
      sku: <Tag>{row.sku}</Tag>,
      produk: row.produk,
      size: <Tag>{row.size}</Tag>,
      colour: row.colour,
      qtyCutting: <Tag>{qtyCutting}</Tag>,
      totalIkat: <Tag>{qtyIkat}</Tag>,
      status
    };
  });

  const historyColumns = [
    { key: "kodeProduksi", label: "Kode Produksi" },
    { key: "size", label: "Size", align: "center" },
    { key: "sku", label: "Kode SKU" },
    { key: "qty", label: "Qty Ikat", align: "center" },
    { key: "jenis", label: "Ket. Rayon & Kaos" },
    { key: "aksi", label: "Aksi", align: "center" }
  ];

  const historyRows = historyEntries.map((entry) => ({
    key: entry.entryId,
    kodeProduksi: <Tag>{entry.kodeProduksi}</Tag>,
    size: <Tag>{entry.size}</Tag>,
    sku: <Tag>{entry.sku}</Tag>,
    qty: <Tag>{entry.qtyIkat}</Tag>,
    jenis: entry.jenis,
    aksi: (
      <Button
        onClick={() => {
          void deleteSeriEntry(kodePc, entry.entryId).catch((error) => {
            window.alert(
              error instanceof Error ? error.message : "Riwayat Seri gagal dihapus."
            );
          });
        }}
        small
        variant="warn"
      >
        Hapus
      </Button>
    )
  }));
  const totalHistoryQty = historyEntries.reduce(
    (total, entry) => total + Number(entry.qtyIkat ?? 0),
    0
  );
  const kodeProduksiSummary = [
    ...new Set(historyEntries.map((entry) => String(entry.kodeProduksi).slice(0, 3)))
  ].join("/") || "-";

  return (
    <>
      <PageHeader
        chip="Produksi"
        eyebrow="Produksi / Proses Produksi"
        title="Seri"
      />

      <FormCard title="Pilih Kode PC dari Cutting">
        <Field badge={{ label: "Dropdown", variant: "dropdown" }} label="Kode PC" required>
          <SelectInput
            onChange={(event) => setKodePc(event.target.value)}
            value={kodePc}
          >
            <option value="">-- Pilih Kode PC --</option>
            {availableCuttingRecords.map((record) => (
              <option key={record.kodePc} value={record.kodePc}>
                {record.kodePc}
              </option>
            ))}
          </SelectInput>
        </Field>
      </FormCard>

      {!availableCuttingRecords.length ? (
        <FormCard title="Status Kode PC">
          <div className="muted-box">
            {completedKodePc.length
              ? "Semua Kode PC dari Cutting sudah selesai diproses di Seri."
              : "Belum ada data Cutting yang siap dipakai di Seri."}
          </div>
        </FormCard>
      ) : null}

      {loadError ? (
        <FormCard title="Status Database">
          <div className="muted-box">{loadError}</div>
        </FormCard>
      ) : null}

      {isReady && selectedCutting ? (
        <>
          <FormCard title="Data Order">
            <div className="form-grid">
              <Field badge={{ label: "Auto Fill", variant: "auto" }} label="No PO">
                <TextInput readOnly value={selectedCutting.noPo ?? ""} />
              </Field>
              <Field badge={{ label: "Auto Fill", variant: "auto" }} label="Nama Model">
                <TextInput readOnly value={selectedCutting.model ?? ""} />
              </Field>
              <Field badge={{ label: "Auto Fill", variant: "auto" }} label="Kode Pola">
                <TextInput readOnly value={selectedCutting.kodePola ?? ""} />
              </Field>
              <Field badge={{ label: "Manual", variant: "manual" }} label="Tanggal">
                <TextInput
                  onChange={(event) => setTanggal(event.target.value)}
                  type="date"
                  value={tanggal}
                />
              </Field>
              <Field badge={{ label: "Dropdown", variant: "dropdown" }} label="Operator 1">
                <SelectInput
                  onChange={(event) => setOperator1(event.target.value)}
                  value={operator1}
                >
                  {seriOperators.map((operator) => (
                    <option key={operator} value={operator}>
                      {operator}
                    </option>
                  ))}
                </SelectInput>
              </Field>
              <Field badge={{ label: "Dropdown", variant: "dropdown" }} label="Operator 2">
                <SelectInput
                  onChange={(event) => setOperator2(event.target.value)}
                  value={operator2}
                >
                  {seriOperators.map((operator) => (
                    <option key={operator} value={operator}>
                      {operator}
                    </option>
                  ))}
                </SelectInput>
              </Field>
            </div>
          </FormCard>

          <FormCard title="Progress Ikat per SKU">
            <DataTable columns={progressColumns} rows={progressRows} />
          </FormCard>

          <FormCard title="Input per Ikat">
            <div className="form-grid">
              <Field badge={{ label: "Dropdown", variant: "dropdown" }} label="Pilih SKU" required>
                <SelectInput
                  onChange={(event) => {
                    setSelectedSku(event.target.value);
                    setQtyIkatInput("");
                  }}
                  value={selectedSku}
                >
                  {cuttingRows.map((row) => (
                    <option key={row.sku} value={row.sku}>
                      {row.sku} - {row.size} / {row.colour}
                    </option>
                  ))}
                </SelectInput>
              </Field>

              <Field badge={{ label: "Auto Fill", variant: "auto" }} label="Kode SKU">
                <TextInput readOnly value={selectedRow?.sku ?? ""} />
              </Field>

              <Field badge={{ label: "Auto Fill", variant: "auto" }} label="Nama Produk">
                <TextInput readOnly value={selectedRow?.produk ?? ""} />
              </Field>

              <Field badge={{ label: "Auto Fill", variant: "auto" }} label="Colour">
                <TextInput readOnly value={selectedRow?.colour ?? ""} />
              </Field>

              <Field badge={{ label: "Auto Fill", variant: "auto" }} label="Qty PC">
                <TextInput readOnly value={selectedRow?.qtyPlan ?? 0} />
              </Field>

              <Field badge={{ label: "Auto Fill", variant: "auto" }} label="Qty Cutting">
                <TextInput readOnly value={selectedQtyCutting} />
              </Field>

              <Field badge={{ label: "Manual", variant: "manual" }} label="Qty (Ikat)" required>
                <div className="stack" style={{ gap: "8px" }}>
                  <TextInput
                    min="0"
                    onChange={(event) => setQtyIkatInput(event.target.value)}
                    placeholder="Isi qty per ikat"
                    type="number"
                    value={qtyIkatInput}
                  />
                  <div className="muted-box">
                    Progress ikat: {totalSavedForSelected} dari {selectedQtyCutting}. Sisa yang belum diproses: {sisaSelected}
                  </div>
                </div>
              </Field>

              <Field badge={{ label: "Auto", variant: "auto" }} label="Ket. Rayon & Kaos">
                <div style={{ minHeight: "48px", display: "flex", alignItems: "center" }}>
                  <Badge variant={selectedMeta?.type === "Rayon" ? "success" : "warn"}>
                    {selectedMeta?.type ?? "-"}
                  </Badge>
                </div>
              </Field>

              <Field badge={{ label: "Auto Generate", variant: "generate" }} full label="Kode Produksi">
                <CodeDisplay
                  action={<Button small>Salin</Button>}
                  meta="KPS/KPR + nomor urut + No PO"
                  value={kodeProduksi}
                />
              </Field>
            </div>

            <ActionRow>
              <Button variant="success">Cetak Label</Button>
              <Button
                onClick={() => {
                  if (loadError) {
                    window.alert(loadError);
                    return;
                  }

                  if (!selectedCutting || !kodePc || !selectedRow) {
                    window.alert("Pilih Kode PC dan SKU terlebih dahulu.");
                    return;
                  }

                  const qtyIkat = Number(qtyIkatInput || 0);

                  if (qtyIkat <= 0) {
                    window.alert("Qty Ikat harus lebih dari 0.");
                    return;
                  }

                  if (qtyIkat > sisaSelected) {
                    window.alert(
                      "Qty Ikat melebihi sisa qty cutting untuk SKU yang dipilih."
                    );
                    return;
                  }

                  setOpenModal(true);
                }}
                variant="primary"
              >
                Simpan Ikat
              </Button>
            </ActionRow>
          </FormCard>

          <ModalConfirm
            description="Periksa kembali data ikat sebelum menyimpan hasil Seri."
            onClose={() => setOpenModal(false)}
            onConfirm={() => {
              (async () => {
              if (!selectedCutting || !kodePc || !selectedRow) {
                window.alert("Pilih Kode PC dan SKU terlebih dahulu.");
                return;
              }

              const qtyIkat = Number(qtyIkatInput || 0);

              if (qtyIkat <= 0) {
                window.alert("Qty Ikat harus lebih dari 0.");
                return;
              }

              if (qtyIkat > sisaSelected) {
                window.alert(
                  "Qty Ikat melebihi sisa qty cutting untuk SKU yang dipilih."
                );
                return;
              }

              try {
                const savedEntry = await saveSeriEntry(
                  {
                    kodePc,
                    noPo: selectedCutting.noPo,
                    model: selectedCutting.model,
                    kodePola: selectedCutting.kodePola ?? "",
                    tanggal,
                    operator1,
                    operator2
                  },
                  {
                    sku: selectedRow.sku,
                    produk: selectedRow.produk,
                    size: selectedRow.size,
                    colour: selectedRow.colour,
                    qtyIkat,
                    kodeProduksi,
                    jenis: getSkuMetaBySku(masterData.skuRows, selectedRow.sku)?.type ?? "-"
                  }
                );

                setOpenModal(false);
                setQtyIkatInput("");
                window.alert(
                  `Data ikat disimpan.\nKode Produksi: ${savedEntry?.kodeProduksi ?? kodeProduksi}`
                );
              } catch (error) {
                window.alert(error instanceof Error ? error.message : "Data Seri gagal disimpan.");
              }
              })();
            }}
            open={openModal}
            title="Konfirmasi Simpan Seri"
          >
            <div className="stack" style={{ gap: "12px" }}>
              <div className="summary-grid four">
                <div className="summary-card">
                  <span className="summary-label">Kode PC</span>
                  <strong>{kodePc || "-"}</strong>
                </div>
                <div className="summary-card">
                  <span className="summary-label">SKU</span>
                  <strong>{selectedRow?.sku ?? "-"}</strong>
                </div>
                <div className="summary-card">
                  <span className="summary-label">Qty Ikat</span>
                  <strong>{Number(qtyIkatInput || 0)}</strong>
                </div>
                <div className="summary-card">
                  <span className="summary-label">Kode Produksi</span>
                  <strong>{kodeProduksi || "-"}</strong>
                </div>
              </div>
              <div className="muted-box">
                Warna: {selectedRow?.colour ?? "-"} | Size: {selectedRow?.size ?? "-"}
              </div>
            </div>
          </ModalConfirm>

          <FormCard title="Riwayat Ikat">
            <DataTable columns={historyColumns} rows={historyRows} />
            <div className="summary-grid three" style={{ marginTop: "20px" }}>
              <SummaryCard label="Total Ikat" value={historyRows.length} />
              <SummaryCard
                label="Total Qty"
                tone="success"
                value={totalHistoryQty}
              />
              <SummaryCard label="Kode Produksi" value={kodeProduksiSummary} />
            </div>
          </FormCard>
        </>
      ) : null}
    </>
  );
}
