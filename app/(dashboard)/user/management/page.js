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
import { users } from "@/lib/mock-data";

export default function UserManagementPage() {
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

      <InfoBanner title="Informasi">
        Halaman ini sekarang juga bisa mengekspor seluruh tabel app dan auth ke paket CSV ZIP
        untuk import manual ke Supabase dari data browser aktif.
      </InfoBanner>

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
