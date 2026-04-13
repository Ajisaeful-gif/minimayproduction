"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import { authClient } from "@/lib/auth-client";
import {
  isActiveProfile,
  resolveLandingPath,
  resolveRoleFromAuth
} from "@/lib/auth";
import { isAuthEnabled } from "@/lib/env";

const AuthContext = createContext(null);

function getFriendlyAuthError(error) {
  const message = String(
    error?.message ?? error?.error?.message ?? ""
  ).trim();
  const normalized = message.toLowerCase();

  if (!message) {
    return "Login gagal. Silakan periksa email dan password Anda.";
  }

  if (
    normalized.includes("invalid email or password") ||
    normalized.includes("invalid password") ||
    normalized.includes("invalid credentials")
  ) {
    return "Email atau password tidak sesuai.";
  }

  return message;
}

async function fetchProfile() {
  const response = await fetch("/api/me", {
    cache: "no-store"
  });

  if (response.status === 401) {
    return {
      session: null,
      user: null,
      profile: null
    };
  }

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(
      payload?.error || "Gagal mengambil profil user dari backend."
    );
  }

  return response.json();
}

function GuestAuthProvider({ children }) {
  const value = useMemo(
    () => ({
      authEnabled: false,
      session: null,
      user: null,
      profile: null,
      role: "admin",
      loading: false,
      authError: "",
      async signIn() {
        return {
          error: new Error("Login sementara dinonaktifkan.")
        };
      },
      async signOut() {
        return {
          ok: true
        };
      }
    }),
    []
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function EnabledAuthProvider({ children }) {
  const sessionState = authClient.useSession();
  const [profile, setProfile] = useState(null);
  const [role, setRole] = useState("");
  const [profileLoading, setProfileLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const sessionPayload = sessionState.data ?? null;
  const session = sessionPayload?.session ?? null;
  const user = sessionPayload?.user ?? null;

  useEffect(() => {
    let mounted = true;

    async function syncProfile() {
      if (sessionState.isPending) {
        return;
      }

      if (!user?.id) {
        if (!mounted) {
          return;
        }

        setProfile(null);
        setRole("");
        setAuthError("");
        setProfileLoading(false);
        return;
      }

      setProfileLoading(true);

      try {
        const payload = await fetchProfile();
        const nextProfile = payload?.profile ?? null;
        const nextUser = payload?.user ?? user;
        const nextRole = resolveRoleFromAuth({
          profile: nextProfile,
          user: nextUser
        });

        if (!isActiveProfile(nextProfile) || !nextRole) {
          await authClient.signOut();

          if (!mounted) {
            return;
          }

          setProfile(null);
          setRole("");
          setAuthError(
            !nextRole
              ? "Akun ini belum memiliki role akses."
              : "Akun ini sudah tidak aktif."
          );
          setProfileLoading(false);
          return;
        }

        if (!mounted) {
          return;
        }

        setProfile(nextProfile);
        setRole(nextRole);
        setAuthError("");
        setProfileLoading(false);
      } catch (error) {
        if (!mounted) {
          return;
        }

        setProfile(null);
        setRole("");
        setAuthError(getFriendlyAuthError(error));
        setProfileLoading(false);
      }
    }

    syncProfile();

    return () => {
      mounted = false;
    };
  }, [sessionState.isPending, user?.id]);

  const value = useMemo(
    () => ({
      authEnabled: true,
      session,
      user,
      profile,
      role,
      loading: sessionState.isPending || profileLoading,
      authError,
      async signIn({ email, password }) {
        setAuthError("");

        const result = await authClient.signIn.email({
          email,
          password
        });

        if (result?.error) {
          const friendlyMessage = getFriendlyAuthError(result.error);
          setAuthError(friendlyMessage);

          return {
            error: new Error(friendlyMessage)
          };
        }

        await sessionState.refetch();

        try {
          const payload = await fetchProfile();
          const nextProfile = payload?.profile ?? null;
          const nextUser = payload?.user ?? result?.data?.user ?? null;
          const nextRole = resolveRoleFromAuth({
            profile: nextProfile,
            user: nextUser
          });

          if (!isActiveProfile(nextProfile) || !nextRole) {
            await authClient.signOut();
            const nextError = !nextRole
              ? "Akun ini belum memiliki role akses."
              : "Akun ini sudah tidak aktif.";
            setAuthError(nextError);

            return {
              error: new Error(nextError)
            };
          }

          setProfile(nextProfile);
          setRole(nextRole);
          setAuthError("");

          return {
            data: {
              session: payload?.session ?? result?.data?.session ?? null,
              profile: nextProfile,
              role: nextRole,
              redirectTo: resolveLandingPath(nextRole)
            }
          };
        } catch (error) {
          const friendlyMessage = getFriendlyAuthError(error);
          setAuthError(friendlyMessage);

          return {
            error: new Error(friendlyMessage)
          };
        }
      },
      async signOut() {
        await authClient.signOut();
        await sessionState.refetch();
        setProfile(null);
        setRole("");
        setAuthError("");
      }
    }),
    [authError, profile, profileLoading, role, session, sessionState, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function AuthProvider({ children }) {
  if (!isAuthEnabled) {
    return <GuestAuthProvider>{children}</GuestAuthProvider>;
  }

  return <EnabledAuthProvider>{children}</EnabledAuthProvider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth harus dipakai di dalam AuthProvider.");
  }

  return context;
}
