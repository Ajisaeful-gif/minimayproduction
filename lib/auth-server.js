import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import * as schema from "../db/schema";
import { db } from "../db/index";
import { serverEnv } from "./env";

export const auth = betterAuth({
  secret: serverEnv.BETTER_AUTH_SECRET,
  baseURL: serverEnv.BETTER_AUTH_URL,
  basePath: "/api/auth",
  database: drizzleAdapter(db, {
    provider: "pg",
    schema
  }),
  emailAndPassword: {
    enabled: true
  },
  trustedOrigins: [serverEnv.NEXT_PUBLIC_APP_URL],
  plugins: [nextCookies()]
});

export async function getSessionFromHeaders(requestHeaders) {
  return auth.api.getSession({
    headers: requestHeaders
  });
}
