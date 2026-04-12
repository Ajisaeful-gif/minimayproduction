CREATE TYPE "public"."operator_type" AS ENUM('cutting', 'seri', 'racking', 'sewing');
CREATE TYPE "public"."process_status" AS ENUM('draft', 'proses', 'lengkap', 'selesai');
CREATE TYPE "public"."user_role" AS ENUM('admin', 'ppic', 'produksi');

CREATE TABLE "user" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "email" text NOT NULL,
  "email_verified" boolean DEFAULT false NOT NULL,
  "image" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "session" (
  "id" text PRIMARY KEY NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "token" text NOT NULL,
  "ip_address" text,
  "user_agent" text,
  "user_id" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "account" (
  "id" text PRIMARY KEY NOT NULL,
  "account_id" text NOT NULL,
  "provider_id" text NOT NULL,
  "user_id" text NOT NULL,
  "access_token" text,
  "refresh_token" text,
  "id_token" text,
  "access_token_expires_at" timestamp with time zone,
  "refresh_token_expires_at" timestamp with time zone,
  "scope" text,
  "password" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "verification" (
  "id" text PRIMARY KEY NOT NULL,
  "identifier" text NOT NULL,
  "value" text NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "profile" (
  "user_id" text PRIMARY KEY NOT NULL,
  "email" text NOT NULL,
  "nama" text NOT NULL,
  "role" "user_role" NOT NULL,
  "aktif" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "sku_master" (
  "id" serial PRIMARY KEY NOT NULL,
  "kode_sku" text NOT NULL,
  "nama_produk" text NOT NULL,
  "model" text NOT NULL,
  "size" text NOT NULL,
  "warna" text NOT NULL,
  "keterangan_size" text,
  "model_size" text,
  "keterangan_distribusi_model" text,
  "jenis_produksi" text,
  "keterangan_distribusi_sku" text,
  "tipe_kain" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "kode_pola_master" (
  "id" serial PRIMARY KEY NOT NULL,
  "model" text NOT NULL,
  "kode_pola" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "jenis_kain_master" (
  "id" serial PRIMARY KEY NOT NULL,
  "model" text NOT NULL,
  "jenis_kain" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "operator_master" (
  "id" serial PRIMARY KEY NOT NULL,
  "jenis_operator" "operator_type" NOT NULL,
  "nama" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "plan_cutting" (
  "id" serial PRIMARY KEY NOT NULL,
  "kode_pc" text NOT NULL,
  "no_po" text NOT NULL,
  "model" text NOT NULL,
  "tanggal" date NOT NULL,
  "kode_pola" text,
  "jenis_kain" text,
  "created_by" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "plan_cutting_row" (
  "id" serial PRIMARY KEY NOT NULL,
  "plan_cutting_id" integer NOT NULL,
  "kode_sku" text NOT NULL,
  "nama_produk" text NOT NULL,
  "model" text NOT NULL,
  "size" text NOT NULL,
  "warna" text NOT NULL,
  "qty_plan" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "cutting" (
  "id" serial PRIMARY KEY NOT NULL,
  "kode_pc" text NOT NULL,
  "no_po" text NOT NULL,
  "model" text NOT NULL,
  "kode_pola" text,
  "tanggal" date,
  "pemotong" text,
  "penggelar" text,
  "meja" text,
  "status" "process_status" DEFAULT 'selesai' NOT NULL,
  "created_by" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "cutting_row" (
  "id" serial PRIMARY KEY NOT NULL,
  "cutting_id" integer NOT NULL,
  "kode_sku" text NOT NULL,
  "nama_produk" text NOT NULL,
  "model" text NOT NULL,
  "size" text NOT NULL,
  "warna" text NOT NULL,
  "qty_plan" integer DEFAULT 0 NOT NULL,
  "qty_cutting" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "seri" (
  "id" serial PRIMARY KEY NOT NULL,
  "kode_pc" text NOT NULL,
  "no_po" text NOT NULL,
  "model" text NOT NULL,
  "kode_pola" text,
  "tanggal" date,
  "operator_1" text,
  "operator_2" text,
  "last_sequence" integer DEFAULT 0 NOT NULL,
  "status" "process_status" DEFAULT 'proses' NOT NULL,
  "created_by" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "seri_entry" (
  "id" serial PRIMARY KEY NOT NULL,
  "seri_id" integer NOT NULL,
  "entry_id" text NOT NULL,
  "kode_pc" text NOT NULL,
  "kode_produksi" text NOT NULL,
  "kode_sku" text NOT NULL,
  "nama_produk" text NOT NULL,
  "model" text NOT NULL,
  "size" text NOT NULL,
  "warna" text NOT NULL,
  "qty_ikat" integer DEFAULT 0 NOT NULL,
  "jenis" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "racking" (
  "id" serial PRIMARY KEY NOT NULL,
  "kode_pc" text NOT NULL,
  "no_po" text,
  "tanggal" date,
  "operator" text,
  "total_target" integer DEFAULT 0 NOT NULL,
  "total_scanned" integer DEFAULT 0 NOT NULL,
  "status" "process_status" DEFAULT 'proses' NOT NULL,
  "created_by" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "racking_row" (
  "id" serial PRIMARY KEY NOT NULL,
  "racking_id" integer NOT NULL,
  "kode_pc" text NOT NULL,
  "kode_produksi" text NOT NULL,
  "kode_sku" text NOT NULL,
  "nama_produk" text NOT NULL,
  "model" text NOT NULL,
  "warna" text NOT NULL,
  "size" text NOT NULL,
  "qty" integer DEFAULT 0 NOT NULL,
  "status" text DEFAULT 'Terscan' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "plan_sewing" (
  "id" serial PRIMARY KEY NOT NULL,
  "kode_ps" text NOT NULL,
  "kode_pc" text NOT NULL,
  "no_po" text NOT NULL,
  "model" text NOT NULL,
  "tanggal" date NOT NULL,
  "status" "process_status" DEFAULT 'selesai' NOT NULL,
  "created_by" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "plan_sewing_row" (
  "id" serial PRIMARY KEY NOT NULL,
  "plan_sewing_id" integer NOT NULL,
  "kode_sku" text NOT NULL,
  "no_po" text NOT NULL,
  "nama_produk" text NOT NULL,
  "model" text NOT NULL,
  "size" text NOT NULL,
  "warna" text NOT NULL,
  "kode_pc" text NOT NULL,
  "qty_plan" integer DEFAULT 0 NOT NULL,
  "qty_cutting" integer DEFAULT 0 NOT NULL,
  "qty_plan_sewing" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "supply" (
  "id" serial PRIMARY KEY NOT NULL,
  "kode_ps" text NOT NULL,
  "kode_pc" text NOT NULL,
  "tanggal" date,
  "operator" text,
  "total_plan" integer DEFAULT 0 NOT NULL,
  "total_actual" integer DEFAULT 0 NOT NULL,
  "status" "process_status" DEFAULT 'proses' NOT NULL,
  "created_by" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "supply_row" (
  "id" serial PRIMARY KEY NOT NULL,
  "supply_id" integer NOT NULL,
  "kode_produksi" text NOT NULL,
  "kode_sku" text NOT NULL,
  "nama_produk" text NOT NULL,
  "model" text NOT NULL,
  "warna" text NOT NULL,
  "size" text NOT NULL,
  "qty_plan" integer DEFAULT 0 NOT NULL,
  "qty_actual" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "profile" ADD CONSTRAINT "profile_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "plan_cutting" ADD CONSTRAINT "plan_cutting_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "plan_cutting_row" ADD CONSTRAINT "plan_cutting_row_plan_cutting_id_plan_cutting_id_fk" FOREIGN KEY ("plan_cutting_id") REFERENCES "public"."plan_cutting"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "cutting" ADD CONSTRAINT "cutting_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "cutting_row" ADD CONSTRAINT "cutting_row_cutting_id_cutting_id_fk" FOREIGN KEY ("cutting_id") REFERENCES "public"."cutting"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "seri" ADD CONSTRAINT "seri_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "seri_entry" ADD CONSTRAINT "seri_entry_seri_id_seri_id_fk" FOREIGN KEY ("seri_id") REFERENCES "public"."seri"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "racking" ADD CONSTRAINT "racking_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "racking_row" ADD CONSTRAINT "racking_row_racking_id_racking_id_fk" FOREIGN KEY ("racking_id") REFERENCES "public"."racking"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "plan_sewing" ADD CONSTRAINT "plan_sewing_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "plan_sewing_row" ADD CONSTRAINT "plan_sewing_row_plan_sewing_id_plan_sewing_id_fk" FOREIGN KEY ("plan_sewing_id") REFERENCES "public"."plan_sewing"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "supply" ADD CONSTRAINT "supply_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "supply_row" ADD CONSTRAINT "supply_row_supply_id_supply_id_fk" FOREIGN KEY ("supply_id") REFERENCES "public"."supply"("id") ON DELETE cascade ON UPDATE no action;

CREATE UNIQUE INDEX "user_email_unique" ON "user" USING btree ("email");
CREATE UNIQUE INDEX "session_token_unique" ON "session" USING btree ("token");
CREATE INDEX "session_user_idx" ON "session" USING btree ("user_id");
CREATE UNIQUE INDEX "account_provider_account_unique" ON "account" USING btree ("provider_id","account_id");
CREATE INDEX "account_user_idx" ON "account" USING btree ("user_id");
CREATE UNIQUE INDEX "verification_identifier_value_unique" ON "verification" USING btree ("identifier","value");
CREATE UNIQUE INDEX "profile_email_unique" ON "profile" USING btree ("email");
CREATE UNIQUE INDEX "sku_master_kode_sku_unique" ON "sku_master" USING btree ("kode_sku");
CREATE UNIQUE INDEX "kode_pola_master_model_unique" ON "kode_pola_master" USING btree ("model");
CREATE UNIQUE INDEX "jenis_kain_master_model_unique" ON "jenis_kain_master" USING btree ("model");
CREATE UNIQUE INDEX "plan_cutting_kode_pc_unique" ON "plan_cutting" USING btree ("kode_pc");
CREATE UNIQUE INDEX "cutting_kode_pc_unique" ON "cutting" USING btree ("kode_pc");
CREATE UNIQUE INDEX "seri_kode_pc_unique" ON "seri" USING btree ("kode_pc");
CREATE UNIQUE INDEX "seri_entry_entry_id_unique" ON "seri_entry" USING btree ("entry_id");
CREATE UNIQUE INDEX "seri_entry_kode_produksi_unique" ON "seri_entry" USING btree ("kode_produksi");
CREATE UNIQUE INDEX "racking_kode_pc_unique" ON "racking" USING btree ("kode_pc");
CREATE UNIQUE INDEX "plan_sewing_kode_ps_unique" ON "plan_sewing" USING btree ("kode_ps");
CREATE UNIQUE INDEX "supply_kode_ps_unique" ON "supply" USING btree ("kode_ps");
