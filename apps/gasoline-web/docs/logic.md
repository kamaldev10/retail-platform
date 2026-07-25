# Dokumentasi Logika Bisnis & Keuangan — Gasoline Web

Dokumen ini merangkum semua logika perhitungan, alur kerja kasir, sinkronisasi data offline-first, dan rumus rekonsiliasi yang diimplementasikan di aplikasi `gasoline-web`.

---

## 1. Alur Kerja Kasir & Siklus Shift

Kasir bekerja dalam siklus harian dua fase: **Pagi (Pembukaan)** dan **Malam (Penutupan)**.

### A. Fase Pagi (Opening Shift)
- Operator menginput **Uang Awal (Uang Aktual di Laci)** dan menghitung fisik **Stok Awal Botol** di rak.
- Data ini dikunci dalam state active shift:
  - `activeDate`: Tanggal laporan (YYYY-MM-DD).
  - `activeOpeningStock`: Jumlah fisik botol pagi per tipe produk.
  - `activeCashIn`: Uang awal fisik di laci.
  - `activeCashOut`: Pengeluaran belanja bensin harian (diinisialisasi ke `0`).
  - `activePushedBottles`: Jumlah botol yang baru ditambahkan/dikemas hari ini (diinisialisasi ke `0`).

### B. Fase Malam (Closing Shift)
- Operator menginput **Uang Akhir (Uang Aktual di Laci malam hari)** dan sisa fisik **Stok Akhir Botol** di rak.
- Sistem memproses penutupan hari dengan:
  1. Menghitung jumlah botol terjual (`soldQty`) per tipe produk.
  2. Menyimpan rekap harian ke data riwayat.
  3. Mengosongkan data active shift untuk hari berikutnya.
  4. Memicu sinkronisasi cloud (`syncWithCloud`).

---

## 2. Rumus & Logika Perhitungan Inventaris

Aplikasi mengelola dua jenis penyimpanan: bensin curah (**Jerigen**) dan bensin siap jual (**Botol**).

### A. Pembelian Bensin (Refill / Purchase)
Operator mencatat pembelian bensin curah dari distributor. Input berupa **Volume (Liter)** dan dialokasikan ke salah satu tujuan:

1. **Alokasi ke Jerigen Bulk (Penyimpanan)**:
   - Menambahkan stok jerigen:
     $$\text{jerigenStock} = \text{jerigenStock} + \text{Volume}$$
   - Pengeluaran kas bertambah otomatis berdasarkan harga beli (cost price) per liter produk katalog pertama:
     $$\text{activeCashOut} = \text{activeCashOut} + (\text{Volume} \times \text{costPerLiter})$$

2. **Alokasi Langsung Tuang ke Botol (P1/P2/P3)**:
   - Menghitung jumlah botol yang terisi otomatis:
     $$\text{Jumlah Botol} = \frac{\text{Volume}}{\text{Volume Produk}}$$
   - Menambahkan ke botol terisi hari ini:
     $$\text{activePushedBottles[productId]} = \text{activePushedBottles[productId]} + \text{Jumlah Botol}$$
   - Pengeluaran kas bertambah otomatis berdasarkan harga beli produk:
     $$\text{activeCashOut} = \text{activeCashOut} + (\text{Volume} \times \text{costPerLiter})$$

### B. Pengemasan Bensin (Pouring Bulk)
Memindahkan bensin curah dari Jerigen ke kemasan Botol siap jual.
- Mengurangi stok jerigen:
  $$\text{jerigenStock} = \text{jerigenStock} - (\text{Jumlah Botol} \times \text{Volume Produk})$$
- Menambahkan ke stok botol kemasan hari ini:
  $$\text{activePushedBottles[productId]} = \text{activePushedBottles[productId]} + \text{Jumlah Botol}$$

### C. Perhitungan Penjualan Botol (Laku)
Jumlah botol yang terjual (`soldQty`) dihitung secara otomatis saat tutup shift malam hari:
$$\text{Terjual (Laku)} = \text{Stok Awal} + \text{Botol Kemasan Hari Ini} - \text{Stok Akhir}$$
$$\text{soldQty} = \text{activeOpeningStock} + \text{activePushedBottles} - \text{closingStock}$$

---

## 3. Rumus Keuangan & Buku Kas

### A. Pendapatan, Modal, & Profit Bersih
- **Omset Penjualan (Revenue)** per produk:
  $$\text{Revenue} = \text{soldQty} \times \text{sellingPrice}$$
- **Modal Pokok (Capital)** per produk:
  $$\text{Capital} = \text{soldQty} \times \text{costPrice}$$
- **Profit Bersih** per produk:
  $$\text{Profit} = \text{soldQty} \times (\text{sellingPrice} - \text{costPrice})$$

### B. Rekonsiliasi Kas & Selisih Kas (Cash Variance)
Untuk menyelesaikan perbedaan antara catatan kas fisik di laci dengan hitungan sistem:
1. **Sistem (Uang Teoretis Akhir Hari)**:
   $$\text{Sistem} = \text{Uang Awal} + \text{Total Omset Penjualan} - \text{Total Belanja Bensin}$$
   $$\text{Sistem} = \text{activeCashIn} + \text{totalRevenue} - \text{activeCashOut}$$
2. **Selisih Kas**:
   $$\text{Selisih} = \text{Uang Akhir (Fisik)} - \text{Sistem (Teoretis)}$$
   - **Selisih = 0**: Kas seimbang (ditampilkan `-`).
   - **Selisih > 0**: Kas surplus / lebih (ditampilkan hijau `+Xk`).
   - **Selisih < 0**: Kas minus / kurang (ditampilkan merah `-Xk`).

---

## 4. Logika Sinkronisasi Offline-First

Aplikasi menggunakan penyimpanan lokal browser (localStorage) via **Zustand Persist** sebagai pertahanan pertama dan mensinkronisasikannya ke cloud database PostgreSQL.

### A. Siklus Pengiriman Data (Sync)
- Setiap kali operator melakukan Tutup Hari (`submitClosingStock` / `submitDailyReport`), data rekap disimpan secara lokal dan memicu `syncWithCloud()` secara otomatis ke endpoint `POST /api/recap/sync`.
- Jika perangkat sedang offline atau koneksi database Supabase terputus, data tetap aman tersimpan di browser kasir secara offline.

### B. Siklus Pengambilan Data (Safe Merge Fetching)
Ketika kasir membuka dashboard, aplikasi memicu `fetchRecapsFromCloud()` dari `GET /api/recap`.
Untuk mencegah data lokal yang belum sempat tersinkronisasi terhapus oleh data cloud yang usang:
1. Ambil data rekap dari cloud database.
2. Ambil data rekap dari localStorage.
3. Saring laporan lokal yang tanggalnya belum terdaftar di database cloud (data offline/belum tersinkron).
4. Gabungkan keduanya:
   $$\text{Merged Recaps} = [\text{Cloud Recaps}] + [\text{Unsynced Local Recaps}]$$
5. Urutkan berdasarkan tanggal terbaru.

---

## 5. Logika Format Tampilan (Formatting)

### A. Penyingkatan Nominal Uang (Short Cash)
Untuk menjaga keterbacaan di layar HP kecil, nominal uang kas disingkat menggunakan simbol `k` (kilo/ribu) tanpa simbol rupiah (`Rp`):
- `100000` $\rightarrow$ `100k`
- `100500` $\rightarrow$ `100.5k`
- `0` $\rightarrow$ `0`
- `-5000` $\rightarrow$ `-5k`

### B. Format Desimal Kuantitas Bensin (Float Comma)
Untuk mendukung kuantitas liter yang bisa berupa bilangan desimal:
- Bilangan diformat menggunakan koma Indonesia (misal: `8.5` $\rightarrow$ `8,50`).
- **Desimal Bulat**: Jika di belakang koma hanya bernilai nol (seperti `.00`), bagian desimal dihilangkan secara otomatis untuk menghemat ruang (misal: `12.00` $\rightarrow$ `12`).
