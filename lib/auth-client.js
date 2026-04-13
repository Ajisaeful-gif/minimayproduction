"use client";

import { createAuthClient } from "better-auth/react";
import { publicEnv } from "./env";

const resolvedAuthBaseUrl =
  publicEnv.NEXT_PUBLIC_APP_URL ||
  (typeof window !== "undefined" ? window.location.origin : undefined);

export const authClient = createAuthClient({
  ...(resolvedAuthBaseUrl ? { baseURL: resolvedAuthBaseUrl } : {}),
  basePath: "/api/auth"
});
