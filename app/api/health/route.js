import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";

export async function GET() {
  try {
    await db.execute(sql`select 1`);

    return NextResponse.json({
      ok: true,
      database: "connected"
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        database: "disconnected",
        error: String(error?.message ?? error)
      },
      {
        status: 500
      }
    );
  }
}
