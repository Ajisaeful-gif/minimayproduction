"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Badge,
  DataTable,
  FormCard,
  PageHeader,
  SummaryCard
} from "@/components/ui";

export default function ReportTablePage({
  title,
  eyebrow = "Report / Proses Produksi",
  chip = "Report",
  loadRecords,
  eventNames = [],
  emptyMessage = "Belum ada data report.",
  loadErrorMessage = "Data report gagal dimuat.",
  getSummaryCards,
  columns = [],
  mapRows
}) {
  const [records, setRecords] = useState([]);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let active = true;

    async function syncRecords() {
      try {
        const nextRecords = await loadRecords();

        if (!active) {
          return;
        }

        setRecords(Array.isArray(nextRecords) ? nextRecords : []);
        setLoadError("");
      } catch (error) {
        if (!active) {
          return;
        }

        setRecords([]);
        setLoadError(error instanceof Error ? error.message : loadErrorMessage);
      }
    }

    syncRecords();
    eventNames.forEach((eventName) => window.addEventListener(eventName, syncRecords));
    window.addEventListener("storage", syncRecords);

    return () => {
      active = false;
      eventNames.forEach((eventName) => window.removeEventListener(eventName, syncRecords));
      window.removeEventListener("storage", syncRecords);
    };
  }, [eventNames, loadErrorMessage, loadRecords]);

  const tableRows = useMemo(
    () => (typeof mapRows === "function" ? mapRows(records) : []),
    [mapRows, records]
  );
  const summaryCards = useMemo(
    () => (typeof getSummaryCards === "function" ? getSummaryCards(records) : []),
    [getSummaryCards, records]
  );

  return (
    <>
      <PageHeader chip={chip} eyebrow={eyebrow} title={title} />

      <FormCard title="Ringkasan Report">
        <div className="summary-grid three">
          {summaryCards.map((card) => (
            <SummaryCard
              key={card.label}
              label={card.label}
              tone={card.tone}
              value={card.value}
            />
          ))}
        </div>
      </FormCard>

      {loadError ? (
        <FormCard title="Status Database">
          <div className="muted-box">{loadError}</div>
        </FormCard>
      ) : null}

      <FormCard
        action={<Badge variant="success">Rows {tableRows.length}</Badge>}
        title="Data Report"
      >
        <DataTable columns={columns} emptyMessage={emptyMessage} rows={tableRows} />
      </FormCard>
    </>
  );
}
