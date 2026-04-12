"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import { exportSupabaseCsvZip } from "@/lib/supabase-csv-export";

export function ExportSupabaseCsvButton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleExport() {
    setLoading(true);
    setMessage("");

    try {
      const result = await exportSupabaseCsvZip();
      setMessage(
        `Export selesai. File ${result.filename} berisi ${result.tableCount} tabel dan ${result.rowCount} row.`
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Export CSV gagal dibuat.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: "10px" }}>
      <Button onClick={handleExport} variant="primary" disabled={loading}>
        {loading ? "Membuat ZIP CSV..." : "Export CSV Supabase"}
      </Button>
      {message ? (
        <p style={{ margin: 0, color: "var(--muted-strong)", fontSize: "0.92rem" }}>{message}</p>
      ) : null}
    </div>
  );
}
