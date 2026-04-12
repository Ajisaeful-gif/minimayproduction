export const defaultAuthUsers = [
  {
    email: "admin@minimay.com",
    password: "Admin12345!",
    nama: "Admin Minimay",
    role: "admin"
  },
  {
    email: "ppic@minimay.com",
    password: "Ppic12345!",
    nama: "PPIC Minimay",
    role: "ppic"
  },
  {
    email: "produksi@minimay.com",
    password: "Produksi12345!",
    nama: "Produksi Minimay",
    role: "produksi"
  }
];

export function normalizeAuthEmail(email) {
  return String(email ?? "").trim().toLowerCase();
}

export function buildAuthUserId(email) {
  return `user-${normalizeAuthEmail(email).replace(/[^a-z0-9]+/g, "-")}`;
}

export function buildAuthAccountId(userId) {
  return `account-${userId}`;
}
