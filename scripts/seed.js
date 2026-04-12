import "dotenv/config";
import { eq } from "drizzle-orm";
import {
  cuttingOperators,
  jenisKainRows,
  kodePolaRows,
  rackOperators,
  seriOperators,
  sewingOperators,
  skuRows
} from "../lib/excel-db.generated.js";
import { defaultAuthUsers } from "../lib/default-auth-users.js";
import { auth } from "../lib/auth-server.js";
import { db, pool } from "../db/index.js";
import {
  jenisKainMaster,
  kodePolaMaster,
  operatorMaster,
  profiles,
  skuMaster,
  users
} from "../db/schema.js";

async function upsertAuthUser({ email, password, nama, role }) {
  const [existingUser] = await db.select().from(users).where(eq(users.email, email)).limit(1);

  let userId = existingUser?.id;

  if (!existingUser) {
    const result = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name: nama
      }
    });

    userId = result?.user?.id;
  }

  if (!userId) {
    throw new Error(`Gagal memastikan user untuk ${email}.`);
  }

  await db
    .insert(profiles)
    .values({
      userId,
      email,
      nama,
      role,
      aktif: true
    })
    .onConflictDoUpdate({
      target: profiles.userId,
      set: {
        email,
        nama,
        role,
        aktif: true,
        updatedAt: new Date()
      }
    });
}

async function seedMasterData() {
  await db
    .insert(kodePolaMaster)
    .values(
      kodePolaRows.map((row) => ({
        model: row.model,
        kodePola: row.kodePola
      }))
    )
    .onConflictDoNothing();

  await db
    .insert(jenisKainMaster)
    .values(
      jenisKainRows.map((row) => ({
        model: row.model,
        jenisKain: row.jenisKain
      }))
    )
    .onConflictDoNothing();

  await db
    .insert(skuMaster)
    .values(
      skuRows.map((row) => ({
        kodeSku: row.sku,
        namaProduk: row.produk,
        model: row.model,
        size: row.size,
        warna: row.colour,
        keteranganSize: row.ketSize,
        modelSize: row.modelSize,
        keteranganDistribusiModel: row.ketDistModel,
        jenisProduksi: row.jenisProduksi,
        keteranganDistribusiSku: row.ketDistSku,
        tipeKain: row.type
      }))
    )
    .onConflictDoNothing();

  const operators = [
    ...cuttingOperators.map((nama) => ({
      jenisOperator: "cutting",
      nama
    })),
    ...seriOperators.map((nama) => ({
      jenisOperator: "seri",
      nama
    })),
    ...rackOperators.map((nama) => ({
      jenisOperator: "racking",
      nama
    })),
    ...sewingOperators.map((nama) => ({
      jenisOperator: "sewing",
      nama
    }))
  ];

  for (const operator of operators) {
    await db.insert(operatorMaster).values(operator).onConflictDoNothing();
  }
}

async function main() {
  for (const defaultUser of defaultAuthUsers) {
    await upsertAuthUser(defaultUser);
  }

  await seedMasterData();
  console.log("Seed backend selesai dijalankan.");
  console.log("Akun default:");

  defaultAuthUsers.forEach((user) => {
    console.log(`- ${user.role}: ${user.email} / ${user.password}`);
  });
}

main()
  .catch((error) => {
    console.error("Seed gagal dijalankan.");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
