import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";
import { serverEnv } from "../lib/env";

export const pool = new Pool({
  connectionString: serverEnv.DATABASE_URL,
  max: 10
});

export const db = drizzle(pool, { schema });
