"use client";

import { useEffect, useState } from "react";
import {
  ActionRow,
  Badge,
  Button,
  DataTable,
  FormCard,
  InfoBanner,
  PageHeader,
  SummaryCard
} from "@/components/ui";
import { ExportSupabaseCsvButton } from "@/components/export-supabase-csv-button";
import { getUserProfiles } from "@/lib/master-data-client";

export default function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadUsers() {
      try {
        const data = await getUserProfiles();

        if (!active) {
          return;
        }

        setUsers(data);
        setLoadError("");
      } catch (error) {
        if (!active) {
          return;
        }

        setUsers([]);
        setLoadError(error instanceof Error ? error.message : "Data user gagal dimuat.");
      }
    }

    loadUsers();

    return () => {
      active = false;
    };
  }, []);

  const columns = [
    { key: "name", label: "Nama" },
    { key: "email", label: "Email" },
    { key: "role", label: "Role" },
    { key: "status", label: "Status", align: "center" },
    { key: "action", label: "Aksi", align: "center" }
  ];

  const rows = users.map((user) => ({
    key: user.email,
    name: user.name,
    email: user.email,
    role: user.role,
    status: <Badge variant={user.status === "Aktif" ? "success" : "warn"}>{user.status}</Badge>,
    action: (
      <div style={{ display: "flex", justifyContent: "center", gap: "8px", flexWrap: "wrap" }}>
        <Button small>Edit</Button>
        <Button small variant="primary">
          Detail
        </Button>
      </div>
    )
  }));

  return (
    <>
      <PageHeader
        chip="User"
        description="Kelola daftar user dan utilitas data yang diperlukan untuk operasional sistem."
        eyebrow="User / Akses"
        title="User Management"
      />

      <InfoBanner title="Database">
        Export CSV tetap tersedia untuk utilitas import manual ke Supabase.
      </InfoBanner>

      {loadError ? <InfoBanner title="Status">{loadError}</InfoBanner> : null}

      <div className="summary-grid three">
        <SummaryCard label="Total User" value={users.length} />
        <SummaryCard
          label="User Aktif"
          tone="success"
          value={users.filter((user) => user.status === "Aktif").length}
        />
        <SummaryCard
          label="Menunggu Aktivasi"
          tone="warn"
          value={users.filter((user) => user.status !== "Aktif").length}
        />
      </div>

      <FormCard title="Daftar User">
        <DataTable columns={columns} rows={rows} />
      </FormCard>

      <ActionRow>
        <ExportSupabaseCsvButton />
        <Button>Import User</Button>
        <Button variant="primary">Tambah User</Button>
      </ActionRow>
    </>
  );
}
