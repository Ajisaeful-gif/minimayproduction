import { NextResponse } from "next/server";
import {
  deleteSeriEntryById,
  saveSeriEntry
} from "@/lib/server/process-repository";
import { getRequestUserId } from "@/lib/server/auth-request";

export async function POST(request) {
  try {
    const payload = await request.json();
    const userId = await getRequestUserId();
    const data = await saveSeriEntry(payload.recordHeader, payload.entry, userId);
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(
      { error: String(error?.message ?? error) },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const payload = await request.json();
    await deleteSeriEntryById(payload.kodePc, payload.entryId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: String(error?.message ?? error) },
      { status: 500 }
    );
  }
}
