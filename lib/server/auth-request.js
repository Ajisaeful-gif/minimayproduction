import { headers } from "next/headers";
import { getSessionFromHeaders } from "@/lib/auth-server";

export async function getRequestUserId() {
  try {
    const requestHeaders = await headers();
    const session = await getSessionFromHeaders(requestHeaders);

    return session?.user?.id ?? null;
  } catch {
    return null;
  }
}
