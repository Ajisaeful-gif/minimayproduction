"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { canAccessPath, resolveLandingPath } from "@/lib/auth";
import { useAuth } from "@/components/auth-provider";

export default function AuthGuard({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { authEnabled, authError, loading, role, session } = useAuth();

  useEffect(() => {
    if (!authEnabled || loading) {
      return;
    }

    if (!session) {
      const nextParam = pathname ? `?next=${encodeURIComponent(pathname)}` : "";
      router.replace(`/login${nextParam}`);
      return;
    }

    if (role && !canAccessPath(role, pathname)) {
      router.replace(resolveLandingPath(role));
    }
  }, [authEnabled, loading, pathname, role, router, session]);

  if (!authEnabled) {
    return children;
  }

  if (loading) {
    return (
      <div className="auth-state-shell">
        <div className="auth-state-card">
          <p className="section-title">Memuat Session</p>
          <h1 className="page-title" style={{ marginTop: "8px" }}>
            Menyiapkan akses dashboard
          </h1>
          <p className="page-description">
            Session sedang diperiksa agar halaman yang tampil sesuai role user.
          </p>
        </div>
      </div>
    );
  }

  if (!session || (role && !canAccessPath(role, pathname))) {
    return null;
  }

  if (!role) {
    return (
      <div className="auth-state-shell">
        <div className="auth-state-card">
          <p className="section-title">Akses Belum Siap</p>
          <h1 className="page-title" style={{ marginTop: "8px" }}>
            Role akun belum tersedia
          </h1>
          <p className="page-description">
            {authError || "Hubungi admin agar role akun Anda diaktifkan."}
          </p>
        </div>
      </div>
    );
  }

  return children;
}
