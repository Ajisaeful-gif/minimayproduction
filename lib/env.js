import { z } from "zod";

const fallbackAppUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const fallbackApiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL || `${fallbackAppUrl.replace(/\/$/, "")}/api`;
const fallbackBetterAuthUrl = process.env.BETTER_AUTH_URL || fallbackAppUrl;
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
  NEXT_PUBLIC_APP_URL: z.string().url("NEXT_PUBLIC_APP_URL harus berupa URL valid."),
  NEXT_PUBLIC_API_BASE_URL: z
    .string()
    .url("NEXT_PUBLIC_API_BASE_URL harus berupa URL valid.")
    .optional()
});

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("NEXT_PUBLIC_SUPABASE_URL harus berupa URL valid."),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY wajib diisi."),
  NEXT_PUBLIC_APP_URL: z.string().url("NEXT_PUBLIC_APP_URL harus berupa URL valid."),
  NEXT_PUBLIC_API_BASE_URL: z.string().url().optional()
});

export const serverEnv =
  typeof window === "undefined"
    ? serverEnvSchema.parse({
        DATABASE_URL: fallbackDatabaseUrl,
        BETTER_AUTH_SECRET: fallbackBetterAuthSecret,
        BETTER_AUTH_URL: fallbackBetterAuthUrl,
        NEXT_PUBLIC_APP_URL: fallbackAppUrl,
        NEXT_PUBLIC_API_BASE_URL: fallbackApiBaseUrl || undefined
      })
    : null;

export const publicEnv = publicEnvSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_APP_URL: fallbackAppUrl,
  NEXT_PUBLIC_API_BASE_URL: fallbackApiBaseUrl || undefined
});
