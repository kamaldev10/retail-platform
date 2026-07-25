# Dokumentasi Logika Sistem — Gasoline Web

Dokumen ini menjelaskan arsitektur teknis, alur data, struktur state, API endpoint, skema database, dan mekanisme sinkronisasi yang digunakan oleh aplikasi `gasoline-web`.

> **Catatan**: Untuk logika bisnis, rumus keuangan, dan alur kerja operasional kasir, lihat [business-logic.md](./business-logic.md).

---

## 1. Arsitektur & Tech Stack

| Layer                | Teknologi                    | Keterangan                                            |
| -------------------- | ---------------------------- | ----------------------------------------------------- |
| **Framework**        | Next.js 15 (App Router)      | Server-side rendering & API routes                    |
| **UI Runtime**       | React 18 (Client Components) | `"use client"` untuk halaman interaktif               |
| **State Management** | Zustand + Persist middleware | Offline-first localStorage                            |
| **Form Validation**  | react-hook-form + Zod        | Schema-driven validation                              |
| **Database**         | PostgreSQL (Supabase)        | Cloud relational database                             |
| **Data Access**      | Raw SQL (postgres / pg)      | Type-safe DAOs & Parameterized Queries                |
| **Auth**             | Supabase Auth (SSR)          | Cookie-based session via `@supabase/ssr`              |
| **Styling**          | Tailwind CSS                 | Utility-first CSS framework                           |
| **Icons**            | lucide-react                 | SVG icon library                                      |
| **Monorepo**         | Nx + npm workspaces          | Shared packages (`@retail/database`, `@retail/types`) |

---

## 2. Struktur Folder Aplikasi

```
apps/gasoline-web/src/
├── app/                          # Next.js App Router pages & API
│   ├── layout.tsx                # Root layout dengan MobileLayout shell
│   ├── globals.css               # Global styles (Tailwind)
│   ├── page.tsx                  # Dashboard utama + Riwayat Rekap Harian
│   ├── shift/page.tsx            # Form Opening/Closing Shift + Pembelian + Pengemasan
│   ├── stock/page.tsx            # Manajemen stok & katalog produk
│   ├── report/page.tsx           # Laporan rekap mingguan & bulanan
│   ├── salary/page.tsx           # Pengelolaan & riwayat gaji karyawan
│   ├── finance/page.tsx          # Ringkasan keuangan & arus kas
│   ├── login/page.tsx            # Halaman login (Supabase Auth)
│   └── api/
│       ├── recap/
│       │   ├── route.ts          # GET: Ambil semua rekap dari database
│       │   └── sync/route.ts     # POST: Upsert rekap ke database
│       └── salary/
│           └── route.ts          # GET & POST: Pengelolaan gaji karyawan
├── components/common/
│   ├── MobileLayout.tsx          # App shell (header, scrollable content, bottom nav)
│   ├── BottomNav.tsx             # Navigasi tab bawah (mobile)
│   └── OfflineBanner.tsx         # Banner status koneksi offline/online
├── lib/
│   ├── calculations.ts           # Pure functions: perhitungan rekap, revenue, profit
│   ├── RecapAggregator.ts        # Pure functions: agregasi mingguan (ISO week) & bulanan
│   ├── CurrencyFormatter.ts      # Utilitas format Rupiah, float, dan input number
│   ├── schemas/gasoline.ts       # Zod schemas untuk validasi form
│   ├── schemas/salary.ts         # Zod schema untuk form pembayaran gaji
│   └── supabaseServer.ts         # Supabase SSR client + checkAdminAccess helper
├── store/
│   └── useGasolineStore.ts       # Zustand store (state, actions, persist, sync)
└── middleware.ts                  # Auth middleware (redirect ke /login jika belum login)
```

---

## 3. Skema Database (Raw SQL DDL)

### Tabel: `gasoline_recaps`

Menyimpan rekap harian per tanggal (1 record = 1 hari operasional).

| Kolom               | Tipe                   | Keterangan                               |
| ------------------- | ---------------------- | ---------------------------------------- |
| `id`                | `UUID (PRIMARY KEY)`   | ID unik laporan                          |
| `date`              | `VARCHAR(10) (UNIQUE)` | Tanggal format `YYYY-MM-DD`              |
| `total_sold_liters` | `DOUBLE PRECISION`     | Total liter terjual hari itu             |
| `total_revenue`     | `DOUBLE PRECISION`     | Total omset penjualan                    |
| `total_capital`     | `DOUBLE PRECISION`     | Total modal pokok                        |
| `total_net_profit`  | `DOUBLE PRECISION`     | Total profit bersih                      |
| `cash_in`           | `DOUBLE PRECISION`     | Uang masuk (= Uang Akhir fisik)          |
| `cash_out`          | `DOUBLE PRECISION`     | Uang keluar (= Uang Awal + Belanja)      |
| `net_finance_flow`  | `DOUBLE PRECISION`     | `cash_in - cash_out`                     |
| `uang_awal`         | `DOUBLE PRECISION`     | Uang awal kas pagi (default: 0)          |
| `belanja`           | `DOUBLE PRECISION`     | Total belanja bensin harian (default: 0) |
| `note`              | `TEXT`                 | Catatan selisih kas (nullable)           |
| `created_at`        | `TIMESTAMPTZ`          | Timestamp pembuatan                      |
| `updated_at`        | `TIMESTAMPTZ`          | Timestamp update terakhir                |

### Tabel: `gasoline_product_recaps`

Menyimpan detail penjualan per produk per hari (child dari `gasoline_recaps`).

| Kolom           | Tipe                 | Keterangan                                         |
| --------------- | -------------------- | -------------------------------------------------- |
| `id`            | `UUID (PRIMARY KEY)` | ID unik item                                       |
| `recap_id`      | `UUID (FOREIGN KEY)` | Relasi ke `gasoline_recaps.id` (ON DELETE CASCADE) |
| `product_id`    | `VARCHAR(50)`        | ID produk (`p1`, `p2`, `p3`)                       |
| `opening_stock` | `DOUBLE PRECISION`   | Stok awal (termasuk poured)                        |
| `closing_stock` | `DOUBLE PRECISION`   | Stok akhir malam                                   |
| `sold_qty`      | `DOUBLE PRECISION`   | Jumlah terjual                                     |
| `revenue`       | `DOUBLE PRECISION`   | Omset produk ini                                   |
| `capital`       | `DOUBLE PRECISION`   | Modal pokok produk ini                             |
| `profit`        | `DOUBLE PRECISION`   | Profit bersih produk ini                           |

### Tabel: `salary_payments`

Menyimpan riwayat pembayaran gaji karyawan.

| Kolom        | Tipe                 | Keterangan                          |
| ------------ | -------------------- | ----------------------------------- |
| `id`         | `UUID (PRIMARY KEY)` | ID unik transaksi                   |
| `date`       | `VARCHAR(10)`        | Tanggal pembayaran (`YYYY-MM-DD`)   |
| `week_label` | `VARCHAR(100)`       | Label minggu (misal: "Minggu ke-4") |
| `amount`     | `DOUBLE PRECISION`   | Nominal gaji yang dibayarkan        |
| `recipient`  | `VARCHAR(100)`       | Nama penerima gaji                  |
| `note`       | `TEXT`               | Catatan tambahan                    |
| `created_at` | `TIMESTAMPTZ`        | Timestamp pembuatan                 |
| `updated_at` | `TIMESTAMPTZ`        | Timestamp update terakhir           |

---

## 4. State Management (Zustand Store)

Store utama: `useGasolineStore` di `store/useGasolineStore.ts`.

### State Properties

| Property              | Tipe                                          | Keterangan                                |
| --------------------- | --------------------------------------------- | ----------------------------------------- |
| `isOnline`            | `boolean`                                     | Status koneksi jaringan                   |
| `syncStatus`          | `"idle" \| "syncing" \| "success" \| "error"` | Status sinkronisasi cloud                 |
| `products`            | `ProductDefinition[]`                         | Katalog produk (CRUD)                     |
| `jerigenStock`        | `number`                                      | Stok bensin curah jerigen (Liter)         |
| `bottleStock`         | `Record<string, number>`                      | Stok botol siap jual di rak per produk    |
| `activeDate`          | `string`                                      | Tanggal shift aktif (YYYY-MM-DD)          |
| `activeOpeningStock`  | `Record \| null`                              | Stok awal pagi (null = belum buka shift)  |
| `activePushedBottles` | `Record<string, number>`                      | Botol yang dikemas/ditambahkan hari ini   |
| `activeCashIn`        | `number`                                      | Uang awal kas pagi                        |
| `activeCashOut`       | `number`                                      | Total pengeluaran belanja bensin hari ini |
| `dailyRecaps`         | `DailyRecapResult[]`                          | Array riwayat rekap harian                |

### Persistence

Store menggunakan **Zustand Persist middleware** dengan konfigurasi:

- **Storage**: `localStorage` (browser)
- **Key**: `gasoline-store`
- **Behavior**: State disimpan otomatis setiap kali ada perubahan dan di-rehydrate saat browser dibuka kembali.

### Alur State: Opening → Active → Closing

```
[null activeOpeningStock]     ← Shift belum dibuka
        │ setOpeningStock()
        ▼
[activeOpeningStock filled]   ← Shift aktif (siang hari)
        │ submitPurchase() / pourFuelToBottles()
        │   (update jerigenStock, bottleStock, activePushedBottles, activeCashOut)
        ▼
[submitClosingStock()]        ← Tutup shift malam
        │ 1. Hitung soldQty per produk
        │ 2. Hitung revenue, capital, profit
        │ 3. Buat DailyRecapResult baru
        │ 4. Push ke dailyRecaps[]
        │ 5. Reset active shift state
        │ 6. Trigger syncWithCloud()
        ▼
[null activeOpeningStock]     ← Siap untuk shift berikutnya
```

---

## 5. API Endpoints

### `GET /api/recap`

Mengambil semua rekap harian dari database PostgreSQL via Raw SQL DAO.

- **Auth**: `checkAdminAccess()` — memverifikasi session Supabase + role `ADMIN` di tabel `users`.
- **Query**: `SELECT * FROM gasoline_recaps ORDER BY date DESC` dipadukan dengan JOIN/subquery ke `gasoline_product_recaps`.
- **Response**: Array JSON dari `DailyRecapResult` (termasuk `uangAwal`, `belanja`, `note`, dan nested `items`).

### `POST /api/recap/sync`

Menerima array rekap dari client dan meng-upsert ke database secara atomik.

- **Auth**: `checkAdminAccess()`.
- **Body**: `{ recaps: SyncRecapInput[] }`.
- **Logic**: Menggunakan Raw SQL Transaction (`BEGIN ... COMMIT` / `db.transaction()`):
  - Execute `INSERT INTO gasoline_recaps (...) VALUES (...) ON CONFLICT (date) DO UPDATE SET ...`
  - Execute `DELETE FROM gasoline_product_recaps WHERE recap_id = $1` lalu bulk `INSERT INTO gasoline_product_recaps`.
- **Response**: `{ success: true, syncedCount: N }`.

---

## 6. Autentikasi & Otorisasi

### Middleware (`middleware.ts`)

Dijalankan pada setiap request (kecuali static assets):

1. Membuat Supabase SSR client dengan akses cookie.
2. Memanggil `supabase.auth.getUser()` untuk memeriksa session.
3. **Jika tidak terautentikasi** dan bukan halaman `/login` atau `/api`: redirect ke `/login`.
4. **Jika sudah terautentikasi** dan mengakses `/login`: redirect ke `/`.

### Server-Side Auth (`supabaseServer.ts`)

Fungsi `checkAdminAccess()` digunakan oleh API routes:

1. Membuat Supabase SSR client dari cookies.
2. Mendapatkan user dari session (`supabase.auth.getUser()`).
3. Mencari user di tabel `users` PostgreSQL via Parameterized Raw SQL query (`SELECT role FROM users WHERE email = $1`).
4. Memverifikasi `role === 'ADMIN'`.
5. Mengembalikan `{ authorized: true/false, user, dbUser }`.

---

## 7. Sinkronisasi Offline-First

### A. Upload: `syncWithCloud()`

Dipanggil otomatis setelah `submitClosingStock()` dan `submitDailyReport()`.

```
Client (Zustand)                    Server (API)
     │                                   │
     │  POST /api/recap/sync             │
     │  body: { recaps: dailyRecaps[] }  │
     │ ────────────────────────────────▶  │
     │                                   │  $transaction: upsert per date
     │                                   │  (delete + recreate items)
     │  { success: true, syncedCount }   │
     │ ◀────────────────────────────────  │
     │                                   │
     │  set({ syncStatus: "success" })   │
```

### B. Download: `fetchRecapsFromCloud()`

Dipanggil saat halaman Dashboard dimount (`useEffect`).

```
Client (Zustand)                    Server (API)
     │                                   │
     │  GET /api/recap                   │
     │ ────────────────────────────────▶  │
     │                                   │  findMany + include items
     │  cloudRecaps[]                    │
     │ ◀────────────────────────────────  │
     │                                   │
     │  localRecaps = get().dailyRecaps  │
     │  cloudDates = Set(cloud dates)    │
     │  unsyncedLocal = local.filter(    │
     │    r => !cloudDates.has(r.date))  │
     │  merged = [...cloud, ...unsynced] │
     │  sorted = merged.sort(by date)    │
     │  set({ dailyRecaps: sorted })     │
```

**Safe Merge Logic**: Data lokal yang tanggalnya belum ada di cloud database **tidak akan ditimpa**, melainkan digabungkan dan dipertahankan di state.

---

## 8. Form Validation (Zod Schemas)

Semua form menggunakan `react-hook-form` dengan `zodResolver`. Schema definisi ada di `lib/schemas/gasoline.ts`.

| Schema               | Digunakan di         | Field                                                                           |
| -------------------- | -------------------- | ------------------------------------------------------------------------------- |
| `openingStockSchema` | Form Pagi (Opening)  | `date`, `uangAwal` (string→number), `openingStocks` (record)                    |
| `closingStockSchema` | Form Malam (Closing) | `uangAkhir` (string→number), `note` (optional string), `closingStocks` (record) |
| `purchaseSchema`     | Form Pembelian       | `liters` (string→float), `cost` (string→number), `target` (string)              |
| `pourSchema`         | Form Pengemasan      | `bottleId` (string), `quantity` (string→float)                                  |
| `loginSchema`        | Form Login           | `email`, `password`                                                             |
| `dailyReportSchema`  | Laporan Manual       | `date`, `uangAwal`, `openingStocks`, `uangAkhir`, `note`, `closingStocks`       |

**Transform & Parse**: Semua input numerik disimpan sebagai `string` di form (agar mendukung format Indonesia seperti `100.000`) dan di-transform ke `number` oleh Zod saat submit (`parseRupiah()` atau `parseFloat()`).

---

## 9. Utilitas Format (`CurrencyFormatter.ts`)

| Fungsi                                 | Input              | Output   | Contoh                            |
| -------------------------------------- | ------------------ | -------- | --------------------------------- |
| `formatRupiah(value)`                  | `number`           | `string` | `100000` → `Rp100.000`            |
| `parseRupiah(value)`                   | `string \| number` | `number` | `"100.000"` → `100000`            |
| `formatInputNumber(value)`             | `string \| number` | `string` | `"1000000"` → `"1.000.000"`       |
| `formatFloatComma(value, decimals)`    | `number`           | `string` | `8.5` → `"8,50"`, `12.0` → `"12"` |
| `formatFloatDot(value, decimals)`      | `number`           | `string` | `8.5` → `"8.50"`                  |
| `formatFloat(value, format, decimals)` | `number`           | `string` | Dispatcher ke comma/dot           |

**Aturan Desimal Bulat**: Jika bagian desimal hanya bernilai `00` (contoh: `12,00`), maka desimal dihilangkan secara otomatis → `12`.

---

## 10. Komponen UI Bersama

### `MobileLayout`

App shell utama: menampilkan header dengan judul halaman, area konten scrollable, dan `BottomNav`.

### `BottomNav`

Navigasi tab bawah dengan 4 menu:

- 🏠 Dashboard (`/`)
- ⏱️ Shift (`/shift`)
- 📦 Stok (`/stock`)
- 💰 Keuangan (`/finance`)

### `OfflineBanner`

Banner yang muncul di bagian atas saat browser terdeteksi offline. Menggunakan `navigator.onLine` dan event listener `online`/`offline`.

---

## 11. Koneksi Database & Environment

### Environment Variables

| Variable                        | Keterangan                                        |
| ------------------------------- | ------------------------------------------------- |
| `DATABASE_URL`                  | Connection string PostgreSQL (port `5432` direct) |
| `DIRECT_URL`                    | Direct connection URL (bypass pooler)             |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase project URL                              |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key                          |

### Catatan Penting

- **Port `5432` (Direct / Transaction Pooler)**: Digunakan untuk koneksi langsung ke PostgreSQL database via driver Raw SQL (`postgres.js` / `node-postgres`).
- **Parameterized Queries**: Selalu gunakan parameterized queries (`$1`, `$2` atau SQL template string) pada setiap DAO di `@retail/database` untuk mencegah kerentanan SQL Injection.
- **Migration Engine**: Migrasi skema database dikelola menggunakan file DDL SQL (`packages/database/migrations/*.sql`) yang dijalankan via runner migrasi ringan.
