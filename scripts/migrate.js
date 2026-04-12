import "dotenv/config";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db, pool } from "../db/index.js";

async function main() {
  await migrate(db, {
    migrationsFolder: "./drizzle"
  });

  console.log("Migrasi Drizzle berhasil dijalankan.");
}

main()
  .catch((error) => {
    console.error("Migrasi gagal dijalankan.");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
