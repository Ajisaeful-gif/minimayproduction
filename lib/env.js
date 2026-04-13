import { z } from "zod";

function parseBooleanFlag(value, defaultValue = false) {
  if (typeof value !== "string") {
    return defaultValue;
  }

  const normalized = value.trim().toLowerCase();

  if (["1", "true", "yes", "on"].includes(normalized)) {
    return true;
  }

  if (["0", "false", "no", "off"].includes(normalized)) {
    return false;
  }

  return defaultValue;
}

function getBrowserOrigin() {
  if (typeof window === "undefined" || !window.location?.origin) {
    return "";
  }

  return window.location.origin;
}

export const isAuthEnabled = parseBooleanFlag(
  process.env.NEXT_PUBLIC_AUTH_ENABLED,
  false
);

const configuredAppUrl = String(process.env.NEXT_PUBLIC_APP_URL ?? "").trim();
const resolvedPublicAppUrl = configuredAppUrl || getBrowserOrigin();
const configuredApiBaseUrl = String(process.env.NEXT_PUBLIC_API_BASE_URL ?? "").trim();
const resolvedPublicApiBaseUrl =
  configuredApiBaseUrl ||
  (resolvedPublicAppUrl ? `${resolvedPublicAppUrl.replace(/\/$/, "")}/api` : "");
const fallbackBetterAuthUrl =
  process.env.BETTER_AUTH_URL || configuredAppUrl || "http://localhost:3000";
const fallbackBetterAuthSecret =
  process.env.BETTER_AUTH_SECRET || "minimay-local-auth-bypass-secret";
const fallbackDatabaseUrl =
  process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL || "";

const serverEnvSchema = z.object({
  DATABASE_URL: z.string().min(1, "SUPABASE_DATABASE_URL wajib diisi."),
  BETTER_AUTH_SECRET: z
    .string()
    .min(16, "BETTER_AUTH_SECRET default internal harus minimal 16 karakter."),
  BETTER_AUTH_URL: z.string().url("BETTER_AUTH_URL harus berupa URL valid."),
  NEXT_PUBLIC_APP_URL: z.string().url("NEXT_PUBLIC_APP_URL harus berupa URL valid.").optional(),
  NEXT_PUBLIC_API_BASE_URL: z
    .string()
    .url("NEXT_PUBLIC_API_BASE_URL harus berupa URL valid.")
    .optional(),
  NEXT_PUBLIC_AUTH_ENABLED: z.boolean()
});

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("NEXT_PUBLIC_SUPABASE_URL harus berupa URL valid."),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY wajib diisi."),
  NEXT_PUBLIC_APP_URL: z.string().url("NEXT_PUBLIC_APP_URL harus berupa URL valid.").optional(),
  NEXT_PUBLIC_API_BASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_AUTH_ENABLED: z.boolean()
});

export const serverEnv =
  typeof window === "undefined"
    ? serverEnvSchema.parse({
        DATABASE_URL: fallbackDatabaseUrl,
        BETTER_AUTH_SECRET: fallbackBetterAuthSecret,
        BETTER_AUTH_URL: fallbackBetterAuthUrl,
        NEXT_PUBLIC_APP_URL: resolvedPublicAppUrl || undefined,
        NEXT_PUBLIC_API_BASE_URL: resolvedPublicApiBaseUrl || undefined,
        NEXT_PUBLIC_AUTH_ENABLED: isAuthEnabled
      })
    : null;

export const publicEnv = publicEnvSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_APP_URL: resolvedPublicAppUrl || undefined,
  NEXT_PUBLIC_API_BASE_URL: resolvedPublicApiBaseUrl || undefined,
  NEXT_PUBLIC_AUTH_ENABLED: isAuthEnabled
});
