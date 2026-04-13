import { headers } from "next/headers";
import { isAuthEnabled } from "@/lib/env";

export async function getRequestUserId() {
  if (!isAuthEnabled) {
    return null;
  }

  try {
    const requestHeaders = await headers();
    const { getSessionFromHeaders } = await import("@/lib/auth-server");
    const session = await getSessionFromHeaders(requestHeaders);

    return session?.user?.id ?? null;
  } catch {
    return null;
  }
}
