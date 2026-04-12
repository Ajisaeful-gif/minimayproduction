import {
  boolean,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex
} from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp("created_at", {
    mode: "date",
    withTimezone: true
  })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", {
    mode: "date",
    withTimezone: true
  })
    .defaultNow()
    .notNull()
};

export const userRoleEnum = pgEnum("user_role", ["admin", "ppic", "produksi"]);
export const processStatusEnum = pgEnum("process_status", [
  "draft",
  "proses",
  "lengkap",
  "selesai"
]);
export const operatorTypeEnum = pgEnum("operator_type", [
  "cutting",
  "seri",
  "racking",
  "sewing"
]);

export const users = pgTable(
  "user",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    emailVerified: boolean("email_verified").default(false).notNull(),
    image: text("image"),
    ...timestamps
  },
  (table) => ({
    emailUniqueIdx: uniqueIndex("user_email_unique").on(table.email)
  })
);

export const sessions = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at", {
      mode: "date",
      withTimezone: true
    }).notNull(),
    token: text("token").notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    ...timestamps
  },
  (table) => ({
    tokenUniqueIdx: uniqueIndex("session_token_unique").on(table.token),
    userIdx: index("session_user_idx").on(table.userId)
  })
);

export const accounts = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", {
      mode: "date",
      withTimezone: true
    }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
      mode: "date",
      withTimezone: true
    }),
    scope: text("scope"),
    password: text("password"),
    ...timestamps
  },
  (table) => ({
    providerAccountUniqueIdx: uniqueIndex("account_provider_account_unique").on(
      table.providerId,
      table.accountId
    ),
    userIdx: index("account_user_idx").on(table.userId)
  })
);

export const verifications = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", {
      mode: "date",
      withTimezone: true
    }).notNull(),
    ...timestamps
  },
  (table) => ({
    identifierValueUniqueIdx: uniqueIndex("verification_identifier_value_unique").on(
      table.identifier,
      table.value
    )
  })
);

export const profiles = pgTable(
  "profile",
  {
    userId: text("user_id")
      .primaryKey()
      .references(() => users.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    nama: text("nama").notNull(),
    role: userRoleEnum("role").notNull(),
    aktif: boolean("aktif").default(true).notNull(),
    ...timestamps
  },
  (table) => ({
    emailUniqueIdx: uniqueIndex("profile_email_unique").on(table.email)
  })
);

export const skuMaster = pgTable(
  "sku_master",
  {
    id: serial("id").primaryKey(),
    kodeSku: text("kode_sku").notNull(),
    namaProduk: text("nama_produk").notNull(),
    model: text("model").notNull(),
    size: text("size").notNull(),
    warna: text("warna").notNull(),
    keteranganSize: text("keterangan_size"),
    modelSize: text("model_size"),
    keteranganDistribusiModel: text("keterangan_distribusi_model"),
    jenisProduksi: text("jenis_produksi"),
    keteranganDistribusiSku: text("keterangan_distribusi_sku"),
    tipeKain: text("tipe_kain"),
    ...timestamps
  },
  (table) => ({
    skuUniqueIdx: uniqueIndex("sku_master_kode_sku_unique").on(table.kodeSku)
  })
);

export const kodePolaMaster = pgTable(
  "kode_pola_master",
  {
    id: serial("id").primaryKey(),
    model: text("model").notNull(),
    kodePola: text("kode_pola").notNull(),
    ...timestamps
  },
  (table) => ({
    modelUniqueIdx: uniqueIndex("kode_pola_master_model_unique").on(table.model)
  })
);

export const jenisKainMaster = pgTable(
  "jenis_kain_master",
  {
    id: serial("id").primaryKey(),
    model: text("model").notNull(),
    jenisKain: text("jenis_kain").notNull(),
    ...timestamps
  },
  (table) => ({
    modelUniqueIdx: uniqueIndex("jenis_kain_master_model_unique").on(table.model)
  })
);

export const operatorMaster = pgTable("operator_master", {
  id: serial("id").primaryKey(),
  jenisOperator: operatorTypeEnum("jenis_operator").notNull(),
  nama: text("nama").notNull(),
  ...timestamps
});

export const planCutting = pgTable(
  "plan_cutting",
  {
    id: serial("id").primaryKey(),
    kodePc: text("kode_pc").notNull(),
    noPo: text("no_po").notNull(),
    model: text("model").notNull(),
    tanggal: date("tanggal").notNull(),
    kodePola: text("kode_pola"),
    jenisKain: text("jenis_kain"),
    createdBy: text("created_by").references(() => users.id),
    ...timestamps
  },
  (table) => ({
    kodePcUniqueIdx: uniqueIndex("plan_cutting_kode_pc_unique").on(table.kodePc)
  })
);

export const planCuttingRows = pgTable("plan_cutting_row", {
  id: serial("id").primaryKey(),
  planCuttingId: integer("plan_cutting_id")
    .notNull()
    .references(() => planCutting.id, { onDelete: "cascade" }),
  kodeSku: text("kode_sku").notNull(),
  namaProduk: text("nama_produk").notNull(),
  model: text("model").notNull(),
  size: text("size").notNull(),
  warna: text("warna").notNull(),
  qtyPlan: integer("qty_plan").default(0).notNull(),
  ...timestamps
});

export const cutting = pgTable(
  "cutting",
  {
    id: serial("id").primaryKey(),
    kodePc: text("kode_pc").notNull(),
    noPo: text("no_po").notNull(),
    model: text("model").notNull(),
    kodePola: text("kode_pola"),
    tanggal: date("tanggal"),
    pemotong: text("pemotong"),
    penggelar: text("penggelar"),
    meja: text("meja"),
    status: processStatusEnum("status").default("selesai").notNull(),
    createdBy: text("created_by").references(() => users.id),
    ...timestamps
  },
  (table) => ({
    kodePcUniqueIdx: uniqueIndex("cutting_kode_pc_unique").on(table.kodePc)
  })
);

export const cuttingRows = pgTable("cutting_row", {
  id: serial("id").primaryKey(),
  cuttingId: integer("cutting_id")
    .notNull()
    .references(() => cutting.id, { onDelete: "cascade" }),
  kodeSku: text("kode_sku").notNull(),
  namaProduk: text("nama_produk").notNull(),
  model: text("model").notNull(),
  size: text("size").notNull(),
  warna: text("warna").notNull(),
  qtyPlan: integer("qty_plan").default(0).notNull(),
  qtyCutting: integer("qty_cutting").default(0).notNull(),
  ...timestamps
});

export const seri = pgTable(
  "seri",
  {
    id: serial("id").primaryKey(),
    kodePc: text("kode_pc").notNull(),
    noPo: text("no_po").notNull(),
    model: text("model").notNull(),
    kodePola: text("kode_pola"),
    tanggal: date("tanggal"),
    operator1: text("operator_1"),
    operator2: text("operator_2"),
    lastSequence: integer("last_sequence").default(0).notNull(),
    status: processStatusEnum("status").default("proses").notNull(),
    createdBy: text("created_by").references(() => users.id),
    ...timestamps
  },
  (table) => ({
    kodePcUniqueIdx: uniqueIndex("seri_kode_pc_unique").on(table.kodePc)
  })
);

export const seriEntries = pgTable(
  "seri_entry",
  {
    id: serial("id").primaryKey(),
    seriId: integer("seri_id")
      .notNull()
      .references(() => seri.id, { onDelete: "cascade" }),
    entryId: text("entry_id").notNull(),
    kodePc: text("kode_pc").notNull(),
    kodeProduksi: text("kode_produksi").notNull(),
    kodeSku: text("kode_sku").notNull(),
    namaProduk: text("nama_produk").notNull(),
    model: text("model").notNull(),
    size: text("size").notNull(),
    warna: text("warna").notNull(),
    qtyIkat: integer("qty_ikat").default(0).notNull(),
    jenis: text("jenis"),
    ...timestamps
  },
  (table) => ({
    entryIdUniqueIdx: uniqueIndex("seri_entry_entry_id_unique").on(table.entryId),
    kodeProduksiUniqueIdx: uniqueIndex("seri_entry_kode_produksi_unique").on(
      table.kodeProduksi
    )
  })
);

export const racking = pgTable(
  "racking",
  {
    id: serial("id").primaryKey(),
    kodePc: text("kode_pc").notNull(),
    noPo: text("no_po"),
    tanggal: date("tanggal"),
    operator: text("operator"),
    totalTarget: integer("total_target").default(0).notNull(),
    totalScanned: integer("total_scanned").default(0).notNull(),
    status: processStatusEnum("status").default("proses").notNull(),
    createdBy: text("created_by").references(() => users.id),
    ...timestamps
  },
  (table) => ({
    kodePcUniqueIdx: uniqueIndex("racking_kode_pc_unique").on(table.kodePc)
  })
);

export const rackingRows = pgTable("racking_row", {
  id: serial("id").primaryKey(),
  rackingId: integer("racking_id")
    .notNull()
    .references(() => racking.id, { onDelete: "cascade" }),
  kodePc: text("kode_pc").notNull(),
  kodeProduksi: text("kode_produksi").notNull(),
  kodeSku: text("kode_sku").notNull(),
  namaProduk: text("nama_produk").notNull(),
  model: text("model").notNull(),
  warna: text("warna").notNull(),
  size: text("size").notNull(),
  qty: integer("qty").default(0).notNull(),
  status: text("status").default("Terscan").notNull(),
  ...timestamps
});

export const planSewing = pgTable(
  "plan_sewing",
  {
    id: serial("id").primaryKey(),
    kodePs: text("kode_ps").notNull(),
    kodePc: text("kode_pc").notNull(),
    noPo: text("no_po").notNull(),
    model: text("model").notNull(),
    tanggal: date("tanggal").notNull(),
    status: processStatusEnum("status").default("selesai").notNull(),
    createdBy: text("created_by").references(() => users.id),
    ...timestamps
  },
  (table) => ({
    kodePsUniqueIdx: uniqueIndex("plan_sewing_kode_ps_unique").on(table.kodePs)
  })
);

export const planSewingRows = pgTable("plan_sewing_row", {
  id: serial("id").primaryKey(),
  planSewingId: integer("plan_sewing_id")
    .notNull()
    .references(() => planSewing.id, { onDelete: "cascade" }),
  kodeSku: text("kode_sku").notNull(),
  noPo: text("no_po").notNull(),
  namaProduk: text("nama_produk").notNull(),
  model: text("model").notNull(),
  size: text("size").notNull(),
  warna: text("warna").notNull(),
  kodePc: text("kode_pc").notNull(),
  qtyPlan: integer("qty_plan").default(0).notNull(),
  qtyCutting: integer("qty_cutting").default(0).notNull(),
  qtyPlanSewing: integer("qty_plan_sewing").default(0).notNull(),
  ...timestamps
});

export const supply = pgTable(
  "supply",
  {
    id: serial("id").primaryKey(),
    kodePs: text("kode_ps").notNull(),
    kodePc: text("kode_pc").notNull(),
    tanggal: date("tanggal"),
    operator: text("operator"),
    totalPlan: integer("total_plan").default(0).notNull(),
    totalActual: integer("total_actual").default(0).notNull(),
    status: processStatusEnum("status").default("proses").notNull(),
    createdBy: text("created_by").references(() => users.id),
    ...timestamps
  },
  (table) => ({
    kodePsUniqueIdx: uniqueIndex("supply_kode_ps_unique").on(table.kodePs)
  })
);

export const supplyRows = pgTable("supply_row", {
  id: serial("id").primaryKey(),
  supplyId: integer("supply_id")
    .notNull()
    .references(() => supply.id, { onDelete: "cascade" }),
  kodeProduksi: text("kode_produksi").notNull(),
  kodeSku: text("kode_sku").notNull(),
  namaProduk: text("nama_produk").notNull(),
  model: text("model").notNull(),
  warna: text("warna").notNull(),
  size: text("size").notNull(),
  qtyPlan: integer("qty_plan").default(0).notNull(),
  qtyActual: integer("qty_actual").default(0).notNull(),
  ...timestamps
});
