# Dokumentasi Logika Bisnis & Keuangan — Gasoline Web

Dokumen ini merangkum seluruh logika bisnis, rumus keuangan, alur kerja operasional kasir, perhitungan inventaris, serta aturan format tampilan yang diimplementasikan di aplikasi `gasoline-web`.

---

## 1. Siklus Shift & Alur Kerja Kasir

Operasional kasir berjalan dalam siklus harian dua fase: **Shift Pagi (Pembukaan)** dan **Shift Malam (Penutupan)**.

### A. Shift Pagi (Opening Shift)

- **Input Fisik**: Operator menghitung dan menginput **Uang Awal (Uang fisik di laci kasir)** serta **Stok Awal Botol** fisik di rak.
- **State Shift Aktif**: Data terkunci di memori shift aktif:
  - `activeDate`: Tanggal operasional (`YYYY-MM-DD`).
  - `activeOpeningStock`: Stok awal botol fisik per varian produk (`p1`, `p2`, `p3`).
  - `activeCashIn`: Modal kas awal fisik di laci pagi hari.
  - `activeCashOut`: Total belanja bensin harian (diinisialisasi `0`).
  - `activePushedBottles`: Total botol yang dikemas/ditambahkan hari ini (diinisialisasi `0`).

### B. Shift Malam (Closing Shift)

- **Input Fisik**: Operator menghitung dan menginput sisa **Stok Akhir Botol** fisik di rak pada malam hari.
- **Uang Akhir Teoretis**: Sistem menghitung uang akhir ideal berdasarkan rumus:
  $$\text{Uang Akhir Teoretis} = \text{Uang Awal} + \text{Total Omset Penjualan} - \text{Total Belanja Bensin}$$
  $$\text{Uang Akhir Teoretis} = \text{activeCashIn} + \text{totalRevenue} - \text{activeCashOut}$$
- **Uang Akhir Fisik (Uang Masuk)**: Operator dapat mengubah nilai ini jika uang fisik di laci berbeda dengan hitungan teoretis sistem.
- **Proses Penutupan Hari**:
  1. Menghitung jumlah botol terjual (`soldQty`) per produk.
  2. Menghitung omset, modal pokok, dan profit bersih per produk.
  3. Mendeteksi selisih kas laci (fisik vs teoretis).
  4. Jika terdapat selisih kas ($\text{Selisih} \neq 0$), operator **wajib** mengisikan catatan penjelasan (`note`).
  5. Rekap harian disimpan langsung ke PostgreSQL database.
  6. State active shift di-reset untuk persiapakan shift hari berikutnya.

---

## 2. Perhitungan Inventaris & Stok Bensin

Aplikasi mengelola dua jenis media penyimpanan bensin: bensin curah (**Jerigen Bulk**) dan bensin siap jual (**Botol Kemasan**).

### A. Pembelian Bensin (Refill / Belanja)

Operator mencatat pembelian bensin dari distributor dalam satuan **Volume (Liter)** dengan dua opsi alokasi:

1. **Alokasi ke Jerigen Bulk**:
   - Menambah stok jerigen:
     $$\text{jerigenStock} = \text{jerigenStock} + \text{Volume}$$
   - Menambah pengeluaran kas berdasarkan modal beli per liter:
     $$\text{activeCashOut} = \text{activeCashOut} + (\text{Volume} \times \text{costPerLiter})$$

2. **Alokasi Langsung Tuang ke Botol (P1/P2/P3)**:
   - Menghitung jumlah botol terisi otomatis:
     $$\text{Jumlah Botol} = \frac{\text{Volume}}{\text{Volume Produk}}$$
   - Menambah stok botol kemasan hari ini:
     $$\text{activePushedBottles[productId]} = \text{activePushedBottles[productId]} + \text{Jumlah Botol}$$
   - Menambah pengeluaran kas:
     $$\text{activeCashOut} = \text{activeCashOut} + (\text{Volume} \times \text{costPerLiter})$$

### B. Pengemasan Bensin (Pouring Bulk)

Memindahkan stok bensin curah dari Jerigen ke kemasan Botol siap jual:

- Mengurangi stok jerigen:
  $$\text{jerigenStock} = \text{jerigenStock} - (\text{Jumlah Botol} \times \text{Volume Produk})$$
- Menambah stok botol kemasan hari ini:
  $$\text{activePushedBottles[productId]} = \text{activePushedBottles[productId]} + \text{Jumlah Botol}$$

### C. Menghitung Penjualan Botol (Terjual / Laku)

Jumlah botol yang terjual (`soldQty`) dihitung otomatis saat penutupan shift malam:
$$\text{soldQty} = \text{Stok Awal} + \text{Botol Kemasan Hari Ini} - \text{Stok Akhir}$$
$$\text{soldQty} = \text{activeOpeningStock} + \text{activePushedBottles} - \text{closingStock}$$

---

## 3. Rumus Keuangan & Buku Kas

### A. Omset, Modal, & Profit Bersih

- **Omset Penjualan (Revenue)** per produk:
  $$\text{Revenue} = \text{soldQty} \times \text{sellingPrice}$$
- **Modal Pokok (Capital)** per produk:
  $$\text{Capital} = \text{soldQty} \times \text{costPrice}$$
- **Profit Bersih** per produk:
  $$\text{Profit} = \text{soldQty} \times (\text{sellingPrice} - \text{costPrice})$$

### B. Rekonsiliasi Kas & Selisih Laci (Cash Variance)

$$\text{Selisih Kas} = \text{Uang Akhir Fisik (Kas Laci)} - \text{Uang Akhir Teoretis}$$

- **Selisih = 0**: Kas seimbang (ditampilkan `-`).
- **Selisih > 0**: Kas surplus / lebih (ditampilkan warna hijau `+Xk`).
- **Selisih < 0**: Kas minus / kurang (ditampilkan warna merah `-Xk`).
- **Catatan Wajib**: Jika selisih kas $\neq 0$, operator wajib mengisi alasan (misal: sisa kembalian, minyak di motor kasir, titipan uang). Catatan disimpan pada kolom `note` di database.

### C. Pengeluaran Gaji Karyawan

- Gaji karyawan dibayarkan berkala dari uang kas Laci Kasir.
- Menambah total uang keluar:
  $$\text{Total Uang Keluar} = \text{Belanja Bensin} + \text{Pembayaran Gaji}$$
  $$\text{Net Cash Flow} = \text{Uang Masuk} - \text{Total Uang Keluar}$$

---

## 4. Agregasi Laporan Periode (Mingguan & Bulanan)

- **Mingguan (ISO Week)**: Siklus perhitungan **Senin s/d Minggu**.
- **Bulanan**: Siklus bulan kalender (`YYYY-MM`).
- **Formula Agregasi**:
  $$\text{Total Omset Periode} = \sum \text{totalRevenue}_{\text{harian}}$$
  $$\text{Total Profit Periode} = \sum \text{totalNetProfit}_{\text{harian}}$$
  $$\text{Total Liter Periode} = \sum \text{totalSoldLiters}_{\text{harian}}$$
  $$\text{Rata-rata Omset Harian} = \frac{\text{Total Omset Periode}}{\text{Jumlah Hari Operasional}}$$

---

## 5. Logika Format Tampilan (Formatting)

### A. Format Uang Ringkas (Short Cash)

Di layar mobile, nominal disingkat dengan akhiran `k` (kilo/ribu) tanpa simbol `Rp`:

- `100000` $\rightarrow$ `100k`
- `100500` $\rightarrow$ `100.5k`
- `0` $\rightarrow$ `0`
- `-5000` $\rightarrow$ `-5k`

### B. Format Desimal Liter (Float Comma)

Kuantitas liter diformat dengan koma desimal Indonesia:

- `8.5` $\rightarrow$ `"8,50"`
- **Desimal Bulat**: Jika bagian desimal `.00`, desimal dihilangkan otomatis (contoh: `12.00` $\rightarrow$ `"12"`).

---

## 6. Ringkasan Istilah Operasional

1. **Stok Awal Botol (`p1, p2, p3`)**: Jumlah fisik botol di rak saat buka shift pagi.
2. **Stok Akhir Botol (`p1, p2, p3`)**: Jumlah fisik botol di rak saat tutup shift malam.
3. **Jerigen Bulk**: Tempat penyimpanan bensin curah tambahan.
4. **Belanja Bensin**: Aktivitas membeli bensin curah/kemasan dari distributor.
5. **Pengemasan Bensin**: Aktivitas memindahkan bensin curah dari Jerigen ke kemasan Botol.
6. **Uang Awal (`uangAwal`)**: Modal kas fisik di laci kasir saat buka shift pagi.
7. **Uang Akhir (`uangAkhir`)**: Uang fisik di laci kasir saat tutup shift malam.
8. **Selisih Kas**: Beda uang fisik laci dengan hitungan teoretis sistem.
