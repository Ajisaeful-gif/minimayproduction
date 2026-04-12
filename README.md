# Minimay Frontend

Frontend awal dashboard produksi Minimay dibuat dengan Next.js.

## Jalankan Lokal

```bash
npm install
npm run dev
```

Lalu buka `http://localhost:3000`.

## Struktur Menu

- Produksi
  - Cutting
  - Seri
- PPIC
  - Plan Cutting
  - Racking
  - Plan Sewing
  - Supply
- User
  - User Management

## Deploy Mudah

### Frontend ke Vercel

1. Push project ini ke GitHub.
2. Import repository ke Vercel.
3. Framework akan terbaca sebagai `Next.js`.
4. Jika belum memakai backend, frontend tetap bisa deploy tanpa env tambahan.

### Backend ke Cloudflare

Nanti endpoint API bisa disambungkan lewat env:

- `NEXT_PUBLIC_API_BASE_URL`

Contoh nanti diarahkan ke domain Cloudflare Worker atau Cloudflare Pages Functions.

### Database dan Auth ke Supabase

Saat tahap backend/auth dimulai, isi env berikut di Vercel:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Catatan

- Tahap ini masih frontend only.
- Semua data form masih mock data / state lokal.
- Struktur form mengikuti file `manajemen_produksi.html`, tetapi tampilannya sudah dirapikan untuk dashboard modern.
