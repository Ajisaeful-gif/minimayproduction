import { NextResponse } from "next/server";
import { listUserProfiles } from "@/lib/server/master-data-repository";

export async function GET() {
  try {
    const data = await listUserProfiles();
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(
      { error: String(error?.message ?? error) },
      { status: 500 }
    );
  }
}
