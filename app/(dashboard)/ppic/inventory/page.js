import {
  Badge,
  DataTable,
  FormCard,
  InfoBanner,
  PageHeader,
  SummaryCard,
  Tag
} from "@/components/ui";
import { inventoryRows } from "@/lib/master-data-client";

const inventoryTableRows = inventoryRows.map((row) => ({
  key: row.kodeBarang,
  kodeBarang: <Tag>{row.kodeBarang}</Tag>,
  namaBarang: row.namaBarang,
  kategori: row.kategori,
  stok: <Tag>{row.stok}</Tag>,
  satuan: row.satuan
}));

export default function InventoryPage() {
  return (
    <>
      <PageHeader
        chip="PPIC"
        description="Pantau daftar barang dan kebutuhan penggunaan kain pada area PPIC."
        eyebrow="PPIC / Inventory"
        title="Penggunaan Kain"
      />

      <InfoBanner title="Informasi">
        Gunakan halaman ini untuk melihat item yang dipakai dalam kebutuhan produksi dan pendukung proses.
      </InfoBanner>

      <div className="summary-grid three">
        <SummaryCard label="Total Item" value={inventoryRows.length} />
        <SummaryCard
          label="Kategori"
          tone="success"
          value={[...new Set(inventoryRows.map((row) => row.kategori))].length}
        />
        <SummaryCard
          label="Satuan Aktif"
          tone="warn"
          value={[...new Set(inventoryRows.map((row) => row.satuan))].length}
        />
      </div>

      <FormCard
        action={<Badge variant="success">Inventory</Badge>}
        title="Daftar Penggunaan Kain"
      >
        <DataTable
          columns={[
            { key: "kodeBarang", label: "Kode Barang" },
            { key: "namaBarang", label: "Nama Barang" },
            { key: "kategori", label: "Kategori" },
            { key: "stok", label: "Stok", align: "center" },
            { key: "satuan", label: "Satuan", align: "center" }
          ]}
          rows={inventoryTableRows}
        />
      </FormCard>
    </>
  );
}
