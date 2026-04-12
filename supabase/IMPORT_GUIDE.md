# Import Manual ke Supabase

## 1. Buat struktur database
- Buka Supabase SQL Editor.
- Jalankan file `supabase/schema.sql`.
- Pastikan tabel sudah benar-benar terbentuk sebelum upload CSV apa pun.

## 2. Siapkan file CSV dari aplikasi
- Buka aplikasi Minimay.
- Masuk ke menu `User Management`.
- Klik tombol `Export CSV Supabase`.
- Akan terdownload file ZIP berisi CSV per tabel.

## 3. Import CSV ke Supabase
- Jangan pakai alur `Create table from CSV`.
- Buka tabel yang sudah dibuat oleh `schema.sql`, lalu pilih import CSV ke tabel existing tersebut.
- Kolom `id` atau `user_id` dari file export harus tetap dipakai apa adanya.
- Primary key tidak perlu dipilih manual saat upload, karena sudah didefinisikan di schema.

Urutan import yang direkomendasikan:

1. `user.csv`
2. `profile.csv`
3. `account.csv`
4. `session.csv` (boleh dilewati jika kosong)
5. `verification.csv` (boleh dilewati jika kosong)
6. `sku_master.csv`
7. `kode_pola_master.csv`
8. `jenis_kain_master.csv`
9. `operator_master.csv`
10. `plan_cutting.csv`
11. `plan_cutting_row.csv`
12. `cutting.csv`
13. `cutting_row.csv`
14. `seri.csv`
15. `seri_entry.csv`
16. `racking.csv`
17. `racking_row.csv`
18. `plan_sewing.csv`
19. `plan_sewing_row.csv`
20. `supply.csv`
21. `supply_row.csv`

## 4. Sinkronkan sequence serial
- Setelah semua CSV selesai diimport, jalankan file `supabase/reset_sequences.sql` di SQL Editor.

## 5. Catatan penting
- Import header dulu, baru detail row-nya.
- Jangan ubah kolom `id` dan foreign key di CSV, karena relasi antar tabel sudah mengikuti schema backend.
- Jika Anda melihat warning primary key saat upload, biasanya berarti Anda sedang masuk ke alur buat tabel baru, bukan import ke tabel existing.
- Tabel auth pada project ini mengikuti schema Better Auth custom, bukan tabel auth managed bawaan Supabase.
