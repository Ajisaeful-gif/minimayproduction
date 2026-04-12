export const ROLE_LANDING_PATHS = {
  admin: "/dashboard",
  ppic: "/ppic/plan-cutting",
  produksi: "/produksi/cutting"
};

export function normalizeRole(roleValue) {
  const normalized = String(roleValue ?? "").trim().toLowerCase();

  if (normalized === "admin" || normalized === "ppic" || normalized === "produksi") {
    return normalized;
  }

  return "";
}

export function resolveLandingPath(roleValue) {
  const role = normalizeRole(roleValue);

  return ROLE_LANDING_PATHS[role] ?? "/dashboard";
}

export function canAccessPath(roleValue, pathname) {
  const role = normalizeRole(roleValue);

  if (!pathname) {
    return false;
  }

  if (role === "admin") {
    return (
      pathname === "/dashboard" ||
      pathname.startsWith("/ppic/") ||
      pathname.startsWith("/produksi/") ||
      pathname.startsWith("/user/")
    );
  }

  if (role === "ppic") {
    return pathname.startsWith("/ppic/");
  }

  if (role === "produksi") {
    return pathname.startsWith("/produksi/");
  }

  return false;
}

export function resolveRoleFromAuth({ profile, user }) {
  const profileRole = normalizeRole(profile?.role);

  if (profileRole) {
    return profileRole;
  }

  const appRole = normalizeRole(user?.app_metadata?.role);

  if (appRole) {
    return appRole;
  }

  return normalizeRole(user?.user_metadata?.role);
}

export function isActiveProfile(profile) {
  if (!profile) {
    return true;
  }

  return profile.aktif !== false;
}
