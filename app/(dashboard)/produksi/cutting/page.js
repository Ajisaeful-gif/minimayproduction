"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ActionRow,
  Button,
  Field,
  FormCard,
  ModalConfirm,
  PageHeader,
  SelectInput,
  TextInput
} from "@/components/ui";
import {
  cuttingSizeOrder,
  getMasterData,
  normalizeCuttingSize
} from "@/lib/master-data-client";
import { getCuttingRecords, saveCuttingRecord } from "@/lib/cutting-storage";
import { getPlanCuttingRecords } from "@/lib/plan-cutting-storage";

const EMPTY_ROWS = [];
const DEFAULT_DATE = "2026-04-11";

function buildSizeMap(initialValue = 0) {
  return Object.fromEntries(cuttingSizeOrder.map((size) => [size, initialValue]));
}

function buildMatrixKey(colour, size) {
  return `${String(colour ?? "")}::${String(size ?? "")}`;
}

function toWholeNumber(value) {
  return Math.max(0, Math.trunc(Number(value) || 0));
}

function areNumberMapsEqual(currentMap, nextMap) {
  const currentKeys = Object.keys(currentMap);
  const nextKeys = Object.keys(nextMap);

  if (currentKeys.length !== nextKeys.length) {
    return false;
  }

  return nextKeys.every((key) => Number(currentMap[key] ?? 0) === Number(nextMap[key] ?? 0));
}

function distributeQtyAcrossRows(rows, totalQty) {
  const normalizedTotal = toWholeNumber(totalQty);

  if (!rows.length) {
    return [];
  }

  if (rows.length === 1) {
    return [{ ...rows[0], qtyCutting: normalizedTotal }];
  }

  const totalPlan = rows.reduce((total, row) => total + Number(row.qtyPlan ?? 0), 0);

  if (totalPlan <= 0) {
    return rows.map((row, index) => ({
      ...row,
      qtyCutting: index === 0 ? normalizedTotal : 0
    }));
  }

  const rankedRows = rows.map((row, index) => {
    const rawQty = (normalizedTotal * Number(row.qtyPlan ?? 0)) / totalPlan;
    const baseQty = Math.floor(rawQty);

    return {
      index,
      row,
      qtyCutting: baseQty,
      remainder: rawQty - baseQty
    };
  });

  let remaining = normalizedTotal - rankedRows.reduce((total, item) => total + item.qtyCutting, 0);

  rankedRows
    .slice()
    .sort((left, right) => {
      if (right.remainder !== left.remainder) {
        return right.remainder - left.remainder;
      }

      const rightPlan = Number(right.row.qtyPlan ?? 0);
      const leftPlan = Number(left.row.qtyPlan ?? 0);

      if (rightPlan !== leftPlan) {
        return rightPlan - leftPlan;
      }

      return left.index - right.index;
    })
    .forEach((item) => {
      if (remaining <= 0) {
        return;
      }

      item.qtyCutting += 1;
      remaining -= 1;
    });

  const qtyByIndex = new Map(rankedRows.map((item) => [item.index, item.qtyCutting]));

  return rows.map((row, index) => ({
    ...row,
    qtyCutting: qtyByIndex.get(index) ?? 0
  }));
}

function buildColourGroups(planRows, savedRows, hasSavedRecord) {
  const savedQtyByKey = (savedRows ?? []).reduce((accumulator, row) => {
    const sizeKey = normalizeCuttingSize(row.size);

    if (!cuttingSizeOrder.includes(sizeKey)) {
      return accumulator;
    }

    const key = buildMatrixKey(row.colour, sizeKey);
    const current = Number(accumulator[key] ?? 0);

    return {
      ...accumulator,
      [key]: current + Number(row.qtyCutting ?? 0)
    };
  }, {});

  const groups = new Map();

  planRows.forEach((row) => {
    const sizeKey = normalizeCuttingSize(row.size);

    if (!cuttingSizeOrder.includes(sizeKey)) {
      return;
    }

    const existingGroup = groups.get(row.colour) ?? {
      key: row.colour,
      warna: row.colour,
      planRowsBySize: Object.fromEntries(cuttingSizeOrder.map((size) => [size, []])),
      pengajuanBySize: buildSizeMap(0)
    };

    existingGroup.planRowsBySize[sizeKey].push(row);
    existingGroup.pengajuanBySize[sizeKey] += Number(row.qtyPlan ?? 0);
    groups.set(row.colour, existingGroup);
  });

  return [...groups.values()].map((group) => {
    const hasilBySize = Object.fromEntries(
      cuttingSizeOrder.map((size) => {
        const key = buildMatrixKey(group.warna, size);
        const fallback = hasSavedRecord ? 0 : Number(group.pengajuanBySize[size] ?? 0);

        return [size, Number(savedQtyByKey[key] ?? fallback)];
      })
    );

    return {
      ...group,
      hasilBySize
    };
  });
}

function buildInitialMatrixMap(colourGroups) {
  return Object.fromEntries(
    colourGroups.flatMap((group) =>
      cuttingSizeOrder.map((size) => [buildMatrixKey(group.warna, size), Number(group.hasilBySize[size] ?? 0)])
    )
  );
}

export default function CuttingPage() {
  const [masterData, setMasterData] = useState({
    operators: { cutting: [], seri: [], racking: [], sewing: [] }
  });
  const [loadError, setLoadError] = useState("");
  const [planCuttingRecords, setPlanCuttingRecords] = useState([]);
  const [cuttingRecords, setCuttingRecords] = useState([]);
  const [kodePc, setKodePc] = useState("");
  const [tanggal, setTanggal] = useState(DEFAULT_DATE);
  const [pemotong, setPemotong] = useState("");
  const [penggelar, setPenggelar] = useState("");
  const [meja, setMeja] = useState("2");
  const [cekWarnaPola, setCekWarnaPola] = useState("");
  const [cekMarker, setCekMarker] = useState("");
  const [validasiData, setValidasiData] = useState("");
  const [matrixMap, setMatrixMap] = useState({});
  const [openModal, setOpenModal] = useState(false);
  const cuttingOperators = masterData.operators.cutting ?? [];
  const cuttingOperatorOptions = [...new Set(cuttingOperators.filter(Boolean))];

  useEffect(() => {
    async function syncRecords() {
      try {
        const [nextMasterData, nextPlanCuttingRecords] = await Promise.all([
          getMasterData(),
          getPlanCuttingRecords()
        ]);

        const nextAvailablePlanCuttingRecords = nextPlanCuttingRecords.filter((record) =>
          Array.isArray(record?.rows)
            ? record.rows.some((row) => Number(row.qtyPlan ?? 0) > 0)
            : false
        );

        if (!nextAvailablePlanCuttingRecords.length) {
          setMasterData(nextMasterData);
          setPlanCuttingRecords([]);
          setCuttingRecords([]);
          setLoadError("");
          setKodePc("");
          return;
        }

        const nextCuttingRecords = await getCuttingRecords();

        setMasterData(nextMasterData);
        setPlanCuttingRecords(nextAvailablePlanCuttingRecords);
        setCuttingRecords(nextCuttingRecords);
        setLoadError("");
        setKodePc((current) => {
          if (
            current &&
            nextAvailablePlanCuttingRecords.some((record) => record.kodePc === current)
          ) {
            return current;
          }

          return nextAvailablePlanCuttingRecords[0]?.kodePc ?? "";
        });
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : "Data Cutting gagal dimuat.");
        setPlanCuttingRecords([]);
        setCuttingRecords([]);
      }
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
  const selectedCutting =
    cuttingRecords.find((record) => record.kodePc === kodePc) ?? null;
  const planRows = selectedPlan?.rows ?? EMPTY_ROWS;
  const colourGroups = useMemo(
    () => buildColourGroups(planRows, selectedCutting?.rows ?? EMPTY_ROWS, Boolean(selectedCutting)),
    [planRows, selectedCutting]
  );
  const initialMatrixMap = useMemo(() => buildInitialMatrixMap(colourGroups), [colourGroups]);

  useEffect(() => {
    setMatrixMap((current) =>
      areNumberMapsEqual(current, initialMatrixMap) ? current : initialMatrixMap
    );
  }, [initialMatrixMap]);

  useEffect(() => {
    if (selectedCutting) {
      setTanggal(selectedCutting.tanggal || DEFAULT_DATE);
      setPemotong(selectedCutting.pemotong || cuttingOperatorOptions[0] || "");
      setPenggelar(
        selectedCutting.penggelar || cuttingOperatorOptions[1] || cuttingOperatorOptions[0] || ""
      );
      setMeja(selectedCutting.meja || "2");
      setCekWarnaPola(selectedCutting.cekWarnaPola || cuttingOperatorOptions[0] || "");
      setCekMarker(selectedCutting.cekMarker || cuttingOperatorOptions[0] || "");
      setValidasiData(selectedCutting.validasiData || cuttingOperatorOptions[0] || "");
      return;
    }

    setTanggal(DEFAULT_DATE);
    setPemotong(cuttingOperatorOptions[0] || "");
    setPenggelar(cuttingOperatorOptions[1] || cuttingOperatorOptions[0] || "");
    setMeja("2");
    setCekWarnaPola(cuttingOperatorOptions[0] || "");
    setCekMarker(cuttingOperatorOptions[0] || "");
    setValidasiData(cuttingOperatorOptions[0] || "");
  }, [cuttingOperatorOptions, selectedCutting, kodePc]);

  const isReady = Boolean(kodePc.trim() && selectedPlan);
  const totalCut = colourGroups.reduce(
    (total, group) =>
      total +
      cuttingSizeOrder.reduce(
        (groupTotal, size) => groupTotal + Number(matrixMap[buildMatrixKey(group.warna, size)] ?? 0),
        0
      ),
    0
  );

  function buildCuttingRows() {
    return colourGroups.flatMap((group) =>
      cuttingSizeOrder.flatMap((size) => {
        const groupedPlanRows = group.planRowsBySize[size] ?? [];
        const distributedRows = distributeQtyAcrossRows(
          groupedPlanRows,
          matrixMap[buildMatrixKey(group.warna, size)] ?? 0
        );

        return distributedRows.map((row) => ({
          sku: row.sku,
          produk: row.produk,
          model: row.model,
          size: row.size,
          colour: row.colour,
          qtyPlan: Number(row.qtyPlan ?? 0),
          qtyCutting: Number(row.qtyCutting ?? 0)
        }));
      })
    );
  }

  function renderOperatorField(label, value, onChange) {
    const options = [...new Set([value, ...cuttingOperatorOptions].filter(Boolean))];

    return (
      <Field badge={{ label: "Dropdown", variant: "dropdown" }} label={label}>
        <SelectInput onChange={(event) => onChange(event.target.value)} value={value}>
          {!options.length ? <option value="">-- Belum ada operator cutting --</option> : null}
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </SelectInput>
      </Field>
    );
  }

  return (
    <>
      <PageHeader
        chip="Produksi"
        eyebrow="Produksi / Proses Produksi"
        title="Cutting"
      />

      {planCuttingRecords.length ? (
        <FormCard title="Pilih Kode PC dari Plan Cutting">
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
        </FormCard>
      ) : null}

      {loadError && planCuttingRecords.length ? (
        <FormCard title="Status Database">
          <div className="muted-box">{loadError}</div>
        </FormCard>
      ) : null}

      {!planCuttingRecords.length ? (
        <FormCard title="Status Kode PC">
          <div className="muted-box">
            Belum ada data Plan Cutting yang siap dipakai di Cutting atau semua qty plan sudah habis.
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
                <TextInput
                  onChange={(event) => setTanggal(event.target.value)}
                  type="date"
                  value={tanggal}
                />
              </Field>
              <Field badge={{ label: "Dropdown", variant: "dropdown" }} label="Nama Pemotong">
                <SelectInput onChange={(event) => setPemotong(event.target.value)} value={pemotong}>
                  {!cuttingOperatorOptions.length ? (
                    <option value="">-- Belum ada operator cutting --</option>
                  ) : null}
                  {cuttingOperatorOptions.map((operator) => (
                    <option key={operator} value={operator}>
                      {operator}
                    </option>
                  ))}
                </SelectInput>
              </Field>
              <Field badge={{ label: "Dropdown", variant: "dropdown" }} label="Nama Penggelar">
                <SelectInput onChange={(event) => setPenggelar(event.target.value)} value={penggelar}>
                  {!cuttingOperatorOptions.length ? (
                    <option value="">-- Belum ada operator cutting --</option>
                  ) : null}
                  {cuttingOperatorOptions.map((operator) => (
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
              {renderOperatorField("Cek warna & pola", cekWarnaPola, setCekWarnaPola)}
              {renderOperatorField("Cek Marker", cekMarker, setCekMarker)}
              {renderOperatorField("Validasi Data", validasiData, setValidasiData)}
            </div>
          </FormCard>

          <FormCard title="Input Cutting">
            <div className="recap-matrix-layout">
              <div className="recap-matrix-wrap">
                <table className="recap-matrix-table">
                  <colgroup>
                    <col className="recap-matrix-col-no recap-matrix-col-no-main" />
                    <col className="recap-matrix-col-warna recap-matrix-col-warna-main" />
                    {cuttingSizeOrder.map((size) => (
                      <col
                        className="recap-matrix-col-size recap-matrix-col-size-main"
                        key={`col-hasil-${size}`}
                      />
                    ))}
                    <col className="recap-matrix-col-total recap-matrix-col-total-main" />
                  </colgroup>
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
                    </tr>
                    <tr>
                      {cuttingSizeOrder.map((size) => (
                        <th className="recap-matrix-subhead hasil" key={`hasil-${size}`}>
                          {size}
                        </th>
                      ))}
                      <th className="recap-matrix-subhead hasil total">Total Qty Potong</th>
                    </tr>
                  </thead>
                  <tbody>
                    {colourGroups.length ? (
                      colourGroups.map((group, index) => {
                        const totalQtyPotong = cuttingSizeOrder.reduce(
                          (total, size) => total + Number(matrixMap[buildMatrixKey(group.warna, size)] ?? 0),
                          0
                        );

                        return (
                          <tr className="recap-matrix-body-row" key={group.key}>
                            <td className="recap-matrix-cell no">{index + 1}</td>
                            <td className="recap-matrix-cell warna">{group.warna}</td>
                            {cuttingSizeOrder.map((size) => {
                              const matrixKey = buildMatrixKey(group.warna, size);

                              return (
                                <td className="recap-matrix-cell hasil" key={`${group.key}-${size}`}>
                                  <input
                                    className="text-input recap-matrix-input"
                                    min="0"
                                    onChange={(event) =>
                                      setMatrixMap((current) => ({
                                        ...current,
                                        [matrixKey]: toWholeNumber(event.target.value)
                                      }))
                                    }
                                    type="number"
                                    value={matrixMap[matrixKey] ?? 0}
                                  />
                                </td>
                              );
                            })}
                            <td className="recap-matrix-cell hasil total">{totalQtyPotong}</td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td className="recap-matrix-empty" colSpan={cuttingSizeOrder.length + 3}>
                          Belum ada data warna untuk ditampilkan pada Cutting.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="recap-matrix-wrap recap-matrix-wrap-secondary">
                <table className="recap-matrix-table recap-matrix-table-secondary">
                  <colgroup>
                    <col className="recap-matrix-col-no recap-matrix-col-no-secondary" />
                    {cuttingSizeOrder.map((size) => (
                      <col
                        className="recap-matrix-col-size recap-matrix-col-size-secondary"
                        key={`col-pengajuan-${size}`}
                      />
                    ))}
                  </colgroup>
                  <thead>
                    <tr>
                      <th
                        className="recap-matrix-head pengajuan-group"
                        colSpan={cuttingSizeOrder.length + 1}
                      >
                        Pengajuan Cutting
                      </th>
                    </tr>
                    <tr>
                      <th className="recap-matrix-subhead pengajuan">No</th>
                      {cuttingSizeOrder.map((size) => (
                        <th className="recap-matrix-subhead pengajuan" key={`pengajuan-${size}`}>
                          {size}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {colourGroups.length ? (
                      colourGroups.map((group, index) => (
                        <tr className="recap-matrix-body-row" key={`${group.key}-pengajuan`}>
                          <td className="recap-matrix-cell pengajuan no">{index + 1}</td>
                          {cuttingSizeOrder.map((size) => (
                            <td
                              className="recap-matrix-cell pengajuan"
                              key={`${group.key}-pengajuan-${size}`}
                            >
                              {Number(group.pengajuanBySize[size] ?? 0)}
                            </td>
                          ))}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="recap-matrix-empty" colSpan={cuttingSizeOrder.length + 1}>
                          Belum ada data pengajuan cutting.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </FormCard>
        </>
      ) : null}

      {isReady ? (
        <ActionRow>
          <Button
            onClick={() => {
              if (loadError) {
                window.alert(loadError);
                return;
              }

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
      ) : null}

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

            try {
              await saveCuttingRecord({
                kodePc,
                noPo: selectedPlan.noPo,
                model: selectedPlan.model,
                kodePola: selectedPlan.kodePola ?? "",
                tanggal,
                pemotong,
                penggelar,
                meja,
                cekWarnaPola,
                cekMarker,
                validasiData,
                rows
              });

              setOpenModal(false);
              window.alert(`Data Cutting disimpan.\nKode PC: ${kodePc}`);
            } catch (error) {
              window.alert(error instanceof Error ? error.message : "Data Cutting gagal disimpan.");
            }
          })();
        }}
        open={openModal}
        title="Konfirmasi Simpan Cutting"
      >
        <div className="stack" style={{ gap: "12px" }}>
          <div className="summary-grid four">
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
            <div className="summary-card">
              <span className="summary-label">Validasi Data</span>
              <strong>{validasiData}</strong>
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
