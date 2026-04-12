"use client";

import { useEffect, useState } from "react";
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
import {
  cuttingOperators,
  cuttingSizeOrder,
  normalizeCuttingSize
} from "@/lib/mock-data";
import { getPlanCuttingRecords } from "@/lib/plan-cutting-storage";
import {
  getUsedCuttingKodePc,
  saveCuttingRecord
} from "@/lib/cutting-storage";

function buildCuttingMap(rows = []) {
  return Object.fromEntries(
    rows.map((row) => [row.sku, Number(row.qtyPlan ?? 0)])
  );
}

export default function CuttingPage() {
  const [planCuttingRecords, setPlanCuttingRecords] = useState([]);
  const [usedKodePc, setUsedKodePc] = useState([]);
  const [kodePc, setKodePc] = useState("");
  const [tanggal, setTanggal] = useState("2026-04-11");
  const [pemotong, setPemotong] = useState(cuttingOperators[0]);
  const [penggelar, setPenggelar] = useState(cuttingOperators[1]);
  const [meja, setMeja] = useState("2");
  const [cuttingMap, setCuttingMap] = useState({});
  const [openModal, setOpenModal] = useState(false);

  useEffect(() => {
    async function syncRecords() {
      const [records, usedKode] = await Promise.all([
        getPlanCuttingRecords(),
        getUsedCuttingKodePc()
      ]);
      const availableRecords = records.filter(
        (record) => !usedKode.includes(record.kodePc)
      );

      setPlanCuttingRecords(availableRecords);
      setUsedKodePc(usedKode);
      setKodePc((current) => {
        if (
          current &&
          availableRecords.some((record) => record.kodePc === current)
        ) {
          return current;
        }

        return availableRecords[0]?.kodePc ?? "";
      });
    }

    syncRecords();
    window.addEventListener("plan-cutting-storage-changed", syncRecords);
    window.addEventListener("cutting-storage-changed", syncRecords);
    window.addEventListener("storage", syncRecords);

    return () => {
      window.removeEventListener("plan-cutting-storage-changed", syncRecords);
      window.removeEventListener("cutting-storage-changed", syncRecords);
      window.removeEventListener("storage", syncRecords);
    };
  }, []);

  const selectedPlan =
    planCuttingRecords.find((record) => record.kodePc === kodePc) ?? null;
  const planRows = selectedPlan?.rows ?? [];

  useEffect(() => {
    setCuttingMap(buildCuttingMap(planRows));
  }, [planRows]);

  const isReady = Boolean(kodePc.trim());
  const totalPlan = planRows.reduce(
    (total, row) => total + Number(row.qtyPlan ?? 0),
    0
  );
  const totalCut = planRows.reduce(
    (total, row) => total + Number(cuttingMap[row.sku] ?? 0),
    0
  );
  const totalSelisih = totalCut - totalPlan;

  const columns = [
    { key: "sku", label: "Kode SKU" },
    { key: "produk", label: "Nama Produk" },
    { key: "model", label: "Model" },
    { key: "size", label: "Size", align: "center" },
    { key: "colour", label: "Colour" },
    { key: "qtyPlan", label: "Qty Plan", align: "center" },
    { key: "qtyCutting", label: "Qty Cutting", align: "center" },
    { key: "selisih", label: "Selisih", align: "center" }
  ];

  const tableRows = planRows.map((row) => {
    const selisih = Number(cuttingMap[row.sku] ?? 0) - row.qtyPlan;

    return {
      key: row.sku,
      sku: <Tag>{row.sku}</Tag>,
      produk: row.produk,
      model: row.model,
      size: <Tag>{row.size}</Tag>,
      colour: row.colour,
      qtyPlan: <Tag>{row.qtyPlan}</Tag>,
      qtyCutting: (
        <div style={{ display: "flex", justifyContent: "center" }}>
          <input
            className="text-input"
            min="0"
            onChange={(event) =>
              setCuttingMap((current) => ({
                ...current,
                [row.sku]: Number(event.target.value || 0)
              }))
            }
            style={{ maxWidth: "96px", textAlign: "center", minHeight: "42px" }}
            type="number"
            value={cuttingMap[row.sku] ?? 0}
          />
        </div>
      ),
      selisih: (
        <span style={{ color: selisih < 0 ? "#c05621" : selisih > 0 ? "#d97706" : "#2f855a", fontWeight: 700 }}>
          {selisih > 0 ? `+${selisih}` : selisih}
        </span>
      )
    };
  });

  function buildCuttingRows() {
    return planRows.map((row) => ({
      sku: row.sku,
      produk: row.produk,
      model: row.model,
      size: row.size,
      colour: row.colour,
      qtyPlan: Number(row.qtyPlan ?? 0),
      qtyCutting: Number(cuttingMap[row.sku] ?? 0)
    }));
  }

  const recapRows = [...new Set(planRows.map((row) => row.colour))].map(
    (colour) => {
      const byColour = planRows.filter((row) => row.colour === colour);
      const hasilCuttingBySize = Object.fromEntries(
        cuttingSizeOrder.map((size) => [size, 0])
      );
      const pengajuanBySize = Object.fromEntries(
        cuttingSizeOrder.map((size) => [size, 0])
      );

      byColour.forEach((row) => {
        const sizeKey = normalizeCuttingSize(row.size);

        if (!cuttingSizeOrder.includes(sizeKey)) {
          return;
        }

        hasilCuttingBySize[sizeKey] += Number(cuttingMap[row.sku] ?? 0);
        pengajuanBySize[sizeKey] += Number(row.qtyPlan ?? 0);
      });

      const hasilCuttingTotal = cuttingSizeOrder.reduce(
        (total, size) => total + hasilCuttingBySize[size],
        0
      );
      const pengajuanTotal = cuttingSizeOrder.reduce(
        (total, size) => total + pengajuanBySize[size],
        0
      );

      return {
        key: colour,
        warna: colour,
        hasilCuttingBySize,
        hasilCuttingTotal,
        pengajuanBySize,
        pengajuanTotal
      };
    }
  );

  return (
    <>
      <PageHeader
        chip="Produksi"
        eyebrow="Produksi / Proses Produksi"
        title="Cutting"
      />

      <FormCard title="Pilih Kode PC dari Plan Cutting">
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
      </FormCard>

      {!planCuttingRecords.length ? (
        <FormCard title="Status Kode PC">
          <div className="muted-box">
            {usedKodePc.length
              ? "Semua Kode PC dari Plan Cutting sudah dipakai di Cutting."
              : "Belum ada data Plan Cutting yang siap dipakai di Cutting."}
          </div>
        </FormCard>
      ) : null}

      {isReady ? (
        <>
          <FormCard title="Info Order">
            <div className="form-grid">
              <Field badge={{ label: "Auto Fill", variant: "auto" }} label="No PO">
                <TextInput readOnly value={selectedPlan?.noPo ?? ""} />
              </Field>
              <Field badge={{ label: "Auto Fill", variant: "auto" }} label="Nama Model">
                <TextInput readOnly value={selectedPlan?.model ?? ""} />
              </Field>
              <Field badge={{ label: "Auto Fill", variant: "auto" }} label="Kode Pola">
                <TextInput readOnly value={selectedPlan?.kodePola ?? ""} />
              </Field>
              <Field badge={{ label: "Manual", variant: "manual" }} label="Tanggal">
                <TextInput onChange={(event) => setTanggal(event.target.value)} type="date" value={tanggal} />
              </Field>
              <Field badge={{ label: "Dropdown", variant: "dropdown" }} label="Nama Pemotong">
                <SelectInput onChange={(event) => setPemotong(event.target.value)} value={pemotong}>
                  {cuttingOperators.map((operator) => (
                    <option key={operator} value={operator}>
                      {operator}
                    </option>
                  ))}
                </SelectInput>
              </Field>
              <Field badge={{ label: "Dropdown", variant: "dropdown" }} label="Nama Penggelar">
                <SelectInput onChange={(event) => setPenggelar(event.target.value)} value={penggelar}>
                  {cuttingOperators.map((operator) => (
                    <option key={operator} value={operator}>
                      {operator}
                    </option>
                  ))}
                </SelectInput>
              </Field>
              <Field badge={{ label: "Dropdown", variant: "dropdown" }} label="No Meja">
                <SelectInput onChange={(event) => setMeja(event.target.value)} value={meja}>
                  {["1", "2", "3", "4", "5", "6", "7", "8"].map((nomor) => (
                    <option key={nomor} value={nomor}>
                      {nomor}
                    </option>
                  ))}
                </SelectInput>
              </Field>
            </div>
          </FormCard>

          <FormCard title="Input Qty Cutting">
            <DataTable columns={columns} rows={tableRows} />
            <div className="summary-grid three" style={{ marginTop: "20px" }}>
              <SummaryCard label="Total Qty Plan" value={totalPlan} />
              <SummaryCard label="Total Qty Cutting" value={totalCut} tone="success" />
              <SummaryCard
                label="Total Selisih"
                tone={totalSelisih === 0 ? "success" : totalSelisih > 0 ? "warn" : "danger"}
                value={totalSelisih > 0 ? `+${totalSelisih}` : totalSelisih}
              />
            </div>
          </FormCard>

          <FormCard title="Rekap Cutting">
            <div className="recap-matrix-wrap">
              <table className="recap-matrix-table">
                <thead>
                  <tr>
                    <th className="recap-matrix-head base" rowSpan="2">
                      No
                    </th>
                    <th className="recap-matrix-head base warna" rowSpan="2">
                      Warna
                    </th>
                    <th
                      className="recap-matrix-head hasil-group"
                      colSpan={cuttingSizeOrder.length + 1}
                    >
                      Hasil Cutting
                    </th>
                    <th
                      className="recap-matrix-head pengajuan-group"
                      colSpan={cuttingSizeOrder.length + 1}
                    >
                      Pengajuan Cutting
                    </th>
                  </tr>
                  <tr>
                    {cuttingSizeOrder.map((size) => (
                      <th
                        className="recap-matrix-subhead hasil"
                        key={`hasil-${size}`}
                      >
                        {size}
                      </th>
                    ))}
                    <th className="recap-matrix-subhead hasil total">Total</th>
                    {cuttingSizeOrder.map((size) => (
                      <th
                        className="recap-matrix-subhead pengajuan"
                        key={`pengajuan-${size}`}
                      >
                        {size}
                      </th>
                    ))}
                    <th className="recap-matrix-subhead pengajuan total">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recapRows.length ? (
                    recapRows.map((row, index) => (
                      <tr key={row.key}>
                        <td className="recap-matrix-cell no">{index + 1}</td>
                        <td className="recap-matrix-cell warna">{row.warna}</td>
                        {cuttingSizeOrder.map((size) => (
                          <td
                            className="recap-matrix-cell hasil"
                            key={`${row.key}-hasil-${size}`}
                          >
                            {row.hasilCuttingBySize[size]}
                          </td>
                        ))}
                        <td className="recap-matrix-cell hasil total">
                          {row.hasilCuttingTotal}
                        </td>
                        {cuttingSizeOrder.map((size) => (
                          <td
                            className="recap-matrix-cell pengajuan"
                            key={`${row.key}-pengajuan-${size}`}
                          >
                            {row.pengajuanBySize[size]}
                          </td>
                        ))}
                        <td className="recap-matrix-cell pengajuan total">
                          {row.pengajuanTotal}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        className="recap-matrix-empty"
                        colSpan={cuttingSizeOrder.length * 2 + 4}
                      >
                        Belum ada data warna untuk ditampilkan pada Rekap Cutting.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </FormCard>
        </>
      ) : null}

      <ActionRow>
        <Button
          onClick={() => {
            if (!selectedPlan || !kodePc) {
              window.alert("Pilih Kode PC terlebih dahulu.");
              return;
            }

            setOpenModal(true);
          }}
          variant="primary"
        >
          Simpan ke DB Cutting
        </Button>
      </ActionRow>

      <ModalConfirm
        description="Periksa kembali data hasil Cutting sebelum disimpan."
        onClose={() => setOpenModal(false)}
        onConfirm={() => {
          (async () => {
          if (!selectedPlan || !kodePc) {
            window.alert("Pilih Kode PC terlebih dahulu.");
            return;
          }

          const rows = buildCuttingRows();

          await saveCuttingRecord({
            kodePc,
            noPo: selectedPlan.noPo,
            model: selectedPlan.model,
            kodePola: selectedPlan.kodePola ?? "",
            tanggal,
            pemotong,
            penggelar,
            meja,
            rows
          });

          setOpenModal(false);
          window.alert(`Data Cutting disimpan.\nKode PC: ${kodePc}`);
          })();
        }}
        open={openModal}
        title="Konfirmasi Simpan Cutting"
      >
        <div className="stack" style={{ gap: "12px" }}>
          <div className="summary-grid three">
            <div className="summary-card">
              <span className="summary-label">Kode PC</span>
              <strong>{kodePc || "-"}</strong>
            </div>
            <div className="summary-card">
              <span className="summary-label">Model</span>
              <strong>{selectedPlan?.model ?? "-"}</strong>
            </div>
            <div className="summary-card">
              <span className="summary-label">Total Qty Cutting</span>
              <strong>{totalCut}</strong>
            </div>
          </div>
          <div className="muted-box">
            Jumlah baris yang akan disimpan: {buildCuttingRows().length}
          </div>
        </div>
      </ModalConfirm>
    </>
  );
}
