import Link from "next/link";
import {
  Badge,
  DataTable,
  FormCard,
  InfoBanner,
  PageHeader,
  SummaryCard,
  Tag
} from "@/components/ui";

const moduleRows = [
  {
    menu: "Dashboard",
    status: <Badge variant="success">Aktif</Badge>,
    keterangan: "Ringkasan akses dan navigasi utama"
  },
  {
    menu: "PPIC",
    status: <Badge variant="success">Siap</Badge>,
    keterangan: "Plan Cutting, Racking, Plan Sewing, Supply, Penggunaan Kain"
  },
  {
    menu: "Produksi",
    status: <Badge variant="success">Siap</Badge>,
    keterangan: "Cutting dan Seri"
  },
  {
    menu: "User",
    status: <Badge variant="warn">Draft</Badge>,
    keterangan: "Manajemen user dan utilitas export data"
  }
];

const flowRows = [
  {
    tahap: "1",
    proses: "Plan Cutting",
    catatan: "Buat Kode PC dan qty plan per SKU"
  },
  {
    tahap: "2",
    proses: "Cutting",
    catatan: "Input hasil cutting berdasarkan Kode PC"
  },
  {
    tahap: "3",
    proses: "Seri",
    catatan: "Generate kode produksi dan qty ikat"
  },
  {
    tahap: "4",
    proses: "Racking",
    catatan: "Scan kode produksi hasil seri"
  },
  {
    tahap: "5",
    proses: "Plan Sewing",
    catatan: "Susun qty sewing berdasarkan referensi proses sebelumnya"
  },
  {
    tahap: "6",
    proses: "Supply",
    catatan: "Scan dan cocokkan actual supply"
  }
];

const quickLinks = [
  { href: "/ppic/plan-cutting", title: "Plan Cutting", copy: "Buka form perencanaan cutting." },
  { href: "/ppic/racking", title: "Racking", copy: "Buka form scan racking." },
  { href: "/ppic/plan-sewing", title: "Plan Sewing", copy: "Buka form perencanaan sewing." },
  { href: "/ppic/supply", title: "Supply", copy: "Buka form supply dan rekap." },
  { href: "/ppic/inventory", title: "Penggunaan Kain", copy: "Buka halaman penggunaan kain PPIC." },
  { href: "/produksi/cutting", title: "Cutting", copy: "Buka form hasil cutting." },
  { href: "/produksi/seri", title: "Seri", copy: "Buka form input ikat seri." },
  { href: "/user/management", title: "User Management", copy: "Buka halaman manajemen user." }
];

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        chip="Ringkasan"
        description="Dashboard berisi akses cepat ke form produksi dan ringkasan alur kerja yang dipakai harian."
        eyebrow="Dashboard"
        title="Dashboard"
      />

      <InfoBanner title="Informasi">
        Pilih menu sesuai proses yang sedang dikerjakan. Data utama mengalir dari Plan Cutting sampai Supply.
      </InfoBanner>

      <div className="summary-grid three">
        <SummaryCard label="Menu Utama" value="4" />
        <SummaryCard label="Form Proses" tone="success" value="7" />
        <SummaryCard label="Master & Utilitas" tone="warn" value="2" />
      </div>

      <FormCard title="Akses Cepat Form">
        <div className="quick-links-grid">
          {quickLinks.map((link) => (
            <Link className="quick-link-card" href={link.href} key={link.href}>
              <p className="quick-link-title">{link.title}</p>
              <p className="quick-link-copy">{link.copy}</p>
              <span className="quick-link-action">Buka Halaman</span>
            </Link>
          ))}
        </div>
      </FormCard>

      <FormCard title="Ringkasan Menu">
        <DataTable
          columns={[
            { key: "menu", label: "Menu" },
            { key: "status", label: "Status", align: "center" },
            { key: "keterangan", label: "Keterangan" }
          ]}
          rows={moduleRows}
        />
      </FormCard>

      <FormCard title="Alur Proses">
        <DataTable
          columns={[
            { key: "tahap", label: "Tahap", align: "center" },
            { key: "proses", label: "Proses" },
            { key: "catatan", label: "Catatan" }
          ]}
          rows={flowRows}
        />
      </FormCard>
    </>
  );
}
