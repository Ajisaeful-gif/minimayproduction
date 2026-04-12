import { NextResponse } from "next/server";
import { listSeriRecords } from "@/lib/server/process-repository";

export async function GET() {
  try {
    const data = await listSeriRecords();
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(
      { error: String(error?.message ?? error) },
      { status: 500 }
    );
  }
}
