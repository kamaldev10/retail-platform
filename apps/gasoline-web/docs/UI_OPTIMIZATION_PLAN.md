# Perencanaan Optimisasi UI — Gasoline Web (Mobile-First & Shadcn UI)

Dokumen ini berisi spesifikasi akhir dan perencanaan optimisasi antarmuka pengguna (UI/UX) untuk aplikasi `gasoline-web`.

---

## 📌 Ringkasan Keputusan & Kebijakan UI/UX

1. **Mobile-View First**: Seluruh halaman diatur dalam bingkai mobile `max-w-md` (448px) yang responsif dan dioptimalkan untuk pengoperasian satu tangan (_thumb-zone_).
2. **Shadcn UI & Tailwind CSS**: Penggunaan komponen standar Shadcn UI (`Card`, `Button`, `Badge`, `Sheet`, `Dialog`, `Tabs`) dan Tailwind CSS.
3. **Bahasa Indonesia Ringan & Komunikatif**: Seluruh teks UI menggunakan Bahasa Indonesia sehari-hari yang mudah dipahami oleh operator lapangan SPBU retail.
4. **Penghapusan Header Lama & Integrasi SyncStatusBanner**:
   - Elemen `<header>` lama yang memakan ruang vertikal dihapus sepenuhnya.
   - Posisi paling atas diisi oleh `SyncStatusBanner` sebagai indikator status sinkronisasi database PostgreSQL real-time.
5. **Bottom Navigation (Maksimal 5 Ikon 1 Baris)**:
   - `[Beranda]` (`/`)
   - `[Shift]` (`/shift`)
   - `[Laporan]` (`/report`)
   - `[Keuangan]` (`/finance`)
   - `[Lainnya]` (Membuka Sheet Drawer Shadcn untuk Katalog Produk, Profil Operator, dan Logout).
6. **Fitur Shortcut 2 Baris di Dashboard (Halaman Utama)**:
   - Terletak tepat di bawah `SyncStatusBanner` pada `app/page.tsx`.
   - Grid 2 baris x 4 kolom (total 8 tombol pintasan):
     - **Baris 1**: Tutup Shift | Tuang Botol | Stok Jerigen | Input Gaji
     - **Baris 2**: Catat Kas | Lihat Rekap | Katalog Produk | Refresh Data

---

## 🛠️ Rincian Implementasi Komponen

### 1. MobileLayout & Top Banner (`MobileLayout.tsx`)

- Menghapus header lama.
- Menjadikan `SyncStatusBanner` sebagai elemen teratas sticky.
- Memindahkan tombol Keluar (Logout) dan label Operator ke dalam Sheet Drawer `[Lainnya]` pada `BottomNav`.

### 2. Bottom Navigation (`BottomNav.tsx`)

- Menyederhanakan navigasi dari 6 ikon menjadi 5 ikon presisi.
- Menggunakan `Sheet` Shadcn UI untuk menu `[Lainnya]`.
- Menu `[Lainnya]` berisi:
  - Katalog Produk (`/catalog`)
  - Status Peran Operator
  - Tombol Keluar (Logout Akun)

### 3. Grid Fitur Shortcut 8 Pintasan (`app/page.tsx`)

- Komponen visual berbasis Shadcn Card / Button.
- Responsif, ukuran sentuh minimal 48px, dan Bahasa Indonesia yang jelas.

---

## 📑 Dokumen Terkait

- [`04-ui-optimization-and-shadcn-mobile-plan.md`](file:///home/ali-musthafa-kamal/projects/retail-platform/apps/gasoline-web/docs/plan/04-ui-optimization-and-shadcn-mobile-plan.md)
