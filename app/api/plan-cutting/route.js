import { NextResponse } from "next/server";
import { savePlanCuttingRecord, listPlanCuttingRecords } from "@/lib/server/process-repository";
import { getRequestUserId } from "@/lib/server/auth-request";

export async function GET() {
  try {
    const data = await listPlanCuttingRecords();
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
    await savePlanCuttingRecord(payload, userId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: String(error?.message ?? error) },
      { status: 500 }
    );
  }
}
