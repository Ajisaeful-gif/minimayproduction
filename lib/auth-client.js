"use client";

import { createAuthClient } from "better-auth/react";
import { publicEnv } from "./env";

export const authClient = createAuthClient({
  baseURL: publicEnv.NEXT_PUBLIC_APP_URL,
  basePath: "/api/auth"
});
