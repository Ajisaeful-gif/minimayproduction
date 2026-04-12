import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { getSessionFromHeaders } from "@/lib/auth-server";

export async function GET() {
  const requestHeaders = await headers();
  const session = await getSessionFromHeaders(requestHeaders);

  if (!session?.session || !session?.user) {
    return NextResponse.json(
      {
        error: "Unauthorized"
      },
      {
        status: 401
      }
    );
  }

  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, session.user.id))
    .limit(1);

  return NextResponse.json({
    session: session.session,
    user: session.user,
    profile: profile ?? null
  });
}
