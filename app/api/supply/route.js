import { NextResponse } from "next/server";
import { listSupplyRecords, saveSupplyRecord } from "@/lib/server/process-repository";
import { getRequestUserId } from "@/lib/server/auth-request";

export async function GET() {
  try {
    const data = await listSupplyRecords();
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(
      { error: String(error?.message ?? error) },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const payload = await request.json();
    const userId = await getRequestUserId();
    await saveSupplyRecord(payload, userId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: String(error?.message ?? error) },
      { status: 500 }
    );
  }
}
