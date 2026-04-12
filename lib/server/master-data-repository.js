import { asc } from "drizzle-orm";
import { db } from "@/db";
import {
  jenisKainMaster,
  kodePolaMaster,
  operatorMaster,
  profiles,
  skuMaster
} from "@/db/schema";

export async function listMasterData() {
  const [skuRows, kodePolaRows, jenisKainRows, operatorRows] = await Promise.all([
    db.select().from(skuMaster).orderBy(asc(skuMaster.model), asc(skuMaster.size), asc(skuMaster.warna)),
    db.select().from(kodePolaMaster).orderBy(asc(kodePolaMaster.model)),
    db.select().from(jenisKainMaster).orderBy(asc(jenisKainMaster.model)),
    db.select().from(operatorMaster).orderBy(
      asc(operatorMaster.jenisOperator),
      asc(operatorMaster.nama)
    )
  ]);

  return {
    skuRows,
    kodePolaRows,
    jenisKainRows,
    operatorRows
  };
}

export async function listUserProfiles() {
  const rows = await db.select().from(profiles).orderBy(asc(profiles.nama));

  return rows.map((row) => ({
    name: row.nama,
    email: row.email,
    role: row.role,
    status: row.aktif ? "Aktif" : "Nonaktif"
  }));
}
