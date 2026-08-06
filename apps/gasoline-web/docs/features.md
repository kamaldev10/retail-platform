# Dokumentasi Fitur Aplikasi — Gasoline Web

Dokumen ini menjelaskan daftar seluruh fitur yang tersedia pada aplikasi **Gasoline Web** beserta fungsi operasionalnya.

---

## 1. 🏠 Dashboard & Ringkasan Harian (`/`)

- **Ringkasan Finansial Harian**: Menampilkan Total Omset Penjualan (Revenue), Total Modal Pokok (Capital), dan Total Profit Bersih (Net Profit) hari ini.
- **Status Shift Aktif**: Menampilkan indikator status shift kasir (Shift Pagi Aktif / Tutup Shift Malam).
- **Riwayat Rekap Harian**: Daftar kartu riwayat rekap harian dari database PostgreSQL dengan indikator selisih kas, catatan penjelasan, dan rincian penjualan per botol.
- **Filter & Pencarian**: Pencarian riwayat rekap berdasarkan tanggal tertentu.

---

## 2. ⏱️ Manajemen Shift Kasir (`/shift`)

- **Form Opening Shift (Pagi)**:
  - Input Uang Awal (Modal kas fisik laci).
  - Input Stok Awal Botol fisik di rak per varian produk (`p1`, `p2`, `p3`).
  - Penguncian data stok awal ke dalam shift aktif.
- **Form Closing Shift (Malam)**:
  - Input Stok Akhir Botol fisik di rak pada malam hari.
  - Perhitungan otomatis botol terjual (`soldQty`), total omset, modal, dan profit bersih.
  - Perhitungan otomatis Uang Akhir Teoretis vs Uang Akhir Fisik.
  - Deteksi selisih kas laci (surplus / minus) dengan **catatan wajib (`note`)** jika ada selisih.
- **Form Pembelian Bensin (Refill)**:
  - Pencatatan belanja bensin dari distributor dalam satuan Liter.
  - Alokasi otomatis ke stok Jerigen Bulk atau langsung tuang ke Botol Kemasan.
  - Pemutakhiran pengeluaran kas harian secara otomatis.
- **Form Pengemasan Bensin (Pouring)**:
  - Pencatatan pemindahan stok bensin curah dari Jerigen Bulk ke kemasan Botol siap jual.

---

## 3. 📦 Manajemen Stok & Katalog Produk (`/stock`)

- **Katalog Produk & Harga**: Pengaturan varian botol (1 Liter, 1.2 Liter, 1.5 Liter), harga jual (`sellingPrice`), harga beli (`costPrice`), dan margin profit.
- **Stok Realtime Rak Botol**: Menampilkan jumlah stok botol siap jual di rak secara realtime.
- **Stok Jerigen Bulk**: Tracking kuantitas bensin curah di jerigen dalam satuan Liter.

---

## 4. 💰 Laporan Keuangan & Buku Kas (`/finance`)

- **Ringkasan Arus Kas (Cash Flow)**:
  - Uang Masuk (`cashIn`): Total kas aktual dari hasil penjualan & uang awal laci.
  - Uang Keluar (`cashOut`): Total pengeluaran untuk belanja bensin & pembayaran gaji karyawan.
  - Net Finance Flow: Selisih arus kas bersih (`cashIn - cashOut`).
- **Rekonsiliasi Kas Laci**: Visualisasi selisih kas harian (warna hijau untuk surplus `+Xk`, merah untuk minus `-Xk`, abu-abu `-` untuk seimbang).

---

## 5. 👥 Pengelolaan Gaji Karyawan (`/salary`)

- **Form Pembayaran Gaji**: Form pencatatan pengeluaran gaji karyawan dengan label minggu (`weekLabel`), nominal (`amount`), nama penerima (`recipient`), dan catatan tambahan.
- **Riwayat Penggajian**: Tabel & daftar kartu histori pembayaran gaji terintegrasi langsung dengan database PostgreSQL.

---

## 6. 📊 Laporan Agregat Mingguan & Bulanan (`/report`)

- **Laporan Mingguan (ISO Week)**: Agregasi total omset, profit bersih, dan total liter terjual dalam siklus Senin s/d Minggu.
- **Laporan Bulanan**: Agregasi performa penjualan dan keuangan per bulan kalender (`YYYY-MM`).
- **Rata-rata Performa**: Perhitungan statistik rata-rata omset harian dan profitabilitas harian.

---

## 7. 🔐 Autentikasi & Hak Akses Admin (`/login`)

- **Supabase SSR Auth**: Sistem autentikasi berbasis cookie session.
- **Admin Access Control**: Verifikasi server-side `checkAdminAccess()` memverifikasi role `ADMIN` di database PostgreSQL sebelum mengizinkan aksi simpan / update / delete data.
- **Auth Redirect Middleware**: Proteksi rute otomatis mengarahkan user unauthenticated ke halaman `/login`.

---

## 8. 📱 PWA & Desain Ergonomis Mobile

- **Mobile-First UX**: Desain dioptimalkan untuk layar HP dengan `BottomNav` di area jangkauan jempol (thumb zone).
- **Progressive Web App (PWA)**: Dukungan `manifest.json` untuk instalasi langsung ke home screen HP.
- **Format Input Khusus Mobile**: Papan ketik numerik desimal otomatis (`inputmode="decimal"`) untuk mempermudah pengisian liter bensin dan nominal rupiah.
