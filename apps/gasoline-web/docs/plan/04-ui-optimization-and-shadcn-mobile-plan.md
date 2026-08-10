# Rencana Optimisasi UI & Mobile-First Design System — Gasoline Web

Dokumen ini berisi perencanaan komprehensif optimisasi antarmuka pengguna (UI) dan pengalaman pengguna (UX) untuk aplikasi `gasoline-web`, dengan mengutamakan pendekatan **Mobile-View First**, integrasi **Shadcn UI + Tailwind CSS**, serta penggunaan **Bahasa Indonesia yang ringan dan mudah dipahami**.

---

## 1. Prinsip Utama Desain UI & UX

1. **Mobile-View First**:
   - Seluruh antarmuka dirancang khusus untuk layar smartphone (maksimal lebar kontainer `max-w-md` / 448px).
   - Mengoptimalkan area jangkauan jempol (_thumb-zone_) pada bagian bawah layar untuk aksi utama.
   - Menyediakan batasan _safe-area-inset_ iOS/Android pada navigasi bawah (`BottomNav`).

2. **Penggunaan Shadcn UI & Tailwind CSS**:
   - Menggunakan komponen primitif Shadcn UI (`Card`, `Button`, `Badge`, `Sheet`, `Dialog`, `Input`, `Table`, `Tabs`) untuk menjaga konsistensi visual dan aksesibilitas.
   - Penggunaan kelas utilitas Tailwind CSS untuk layout responsif, warna tema industrial modern, dan mikro-interaksi.

3. **Bahasa Indonesia Ringan & Komunikatif**:
   - Seluruh teks UI menggunakan bahasa Indonesia yang ramah operator lapangan SPBU retail, tanpa istilah teknis yang membingungkan.
   - Istilah resmi di aplikasi:
     - `Shift` $\rightarrow$ **Shift Kerja**
     - `Rekap Harian` $\rightarrow$ **Laporan Harian**
     - `Jerigen Tank Stock` $\rightarrow$ **Stok Jerigen**
     - `Bottle Stock Ready` $\rightarrow$ **Stok Botol**
     - `Sync Status` $\rightarrow$ **Status Data**

---

## 2. Penghapusan Header & Integrasi SyncStatusBanner

### 2.1 Penghematan Ruang Layar Mobile

Header statis lama (`<header>` di `MobileLayout.tsx`) dihapus untuk menghemat ruang vertikal layar mobile. Ruang teratas kini dikhususkan untuk `SyncStatusBanner` yang mengindikasikan status sinkronisasi database PostgreSQL real-time (Mengambil Data / Menyimpan Data / Gagal Sync / Terhubung).

### 2.2 Relokasi Tombol Logout & Profil Operator

Sesuai keputusan desain, tombol **Keluar (Logout)** dan status **Operator** dipindahkan ke dalam menu **Lainnya** (Sheet Drawer Shadcn) di navigasi bawah (`BottomNav`), sehingga layar utama tetap bersih dan fokus pada operasional.

---

## 3. Fitur Shortcut 2 Baris di Halaman Utama (Dashboard)

Halaman utama (`app/page.tsx`) dilengkapi dengan **Fitur Shortcut 8 Pintasan (2 Baris x 4 Kolom)** tepat di bawah `SyncStatusBanner`.

### Grid Shortcut (2 Baris x 4 Kolom)

| Baris       | Kolom 1                           | Kolom 2                                 | Kolom 3                                | Kolom 4                               |
| :---------- | :-------------------------------- | :-------------------------------------- | :------------------------------------- | :------------------------------------ |
| **Baris 1** | **Tutup Shift**<br>_(Form shift)_ | **Tuang Botol**<br>_(Isi botol bensin)_ | **Stok Jerigen**<br>_(Kelola jerigen)_ | **Input Gaji**<br>_(Bayar gaji)_      |
| **Baris 2** | **Catat Kas**<br>_(Buku kas)_     | **Lihat Rekap**<br>_(Laporan harian)_   | **Katalog Produk**<br>_(Harga & stok)_ | **Refresh Data**<br>_(Segarkan data)_ |

---

## 4. Optimasi Bottom Navigation Bar (Maksimal 5 Ikon 1 Baris)

Sesuai _best practice_ UX mobile, Bottom Navigation disesuaikan menjadi **tepat 5 ikon dalam 1 baris**:

1. **Beranda** (`/`) — Dashboard utama, stok ringkas, & shortcut harian.
2. **Shift** (`/shift`) — Pengisian form shift kerja & penutupan kasir.
3. **Laporan** (`/report`) — Riwayat rekap harian & selisih uang.
4. **Keuangan** (`/finance`) — Pengelolaan kasir, buku kas, & penggajian operator.
5. **Lainnya** (`Sheet Drawer Shadcn`) — Membuka panel samping berisi Katalog Produk, Profil Operator, & Tombol Logout Akun.

---

## 5. Rencana Arsitektur & Komponen Shadcn UI

1. `Card` (`src/components/ui/card.tsx`) — Digunakan untuk ringkasan stok botol, stok jerigen, omset, dan kartu pintasan.
2. `Button` (`src/components/ui/button.tsx`) — Digunakan untuk seluruh aksi utama, submit form, dan tombol shortcut.
3. `Badge` (`src/components/ui/badge.tsx`) — Digunakan untuk indikator status shift, peran operator, dan status sync.
4. `Sheet` (`src/components/ui/sheet.tsx`) — Digunakan untuk menu navigasi tambahan `[Lainnya]` pada `BottomNav`.
5. `Dialog` (`src/components/ui/dialog.tsx`) — Digunakan untuk konfirmasi reset data / hapus rekap.
