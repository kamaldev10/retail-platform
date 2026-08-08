# Dokumentasi Logika Sistem & Teknis — Gasoline Web

Dokumen ini menjelaskan arsitektur teknis, alur data database-first, struktur state, API endpoints, skema database PostgreSQL, dan validasi form pada aplikasi `gasoline-web`.

---

## 1. Arsitektur Teknis & Tech Stack

| Layer | Teknologi | Keterangan |
| :--- | :--- | :--- |
| **Framework** | Next.js 15 (App Router) | Server-side rendering & API route handlers |
| **UI Runtime** | React 18 (Client Components) | Client components untuk interaksi UI HP |
| **State Management** | Zustand | State terpusat tanpa local storage persistence |
| **Form Validation** | react-hook-form + Zod | Schema-driven validation |
| **Database** | PostgreSQL (Supabase) | Single Source of Truth cloud database |
| **Data Access** | Raw SQL (postgres / pg) | Parameterized Queries & DAOs terpusat di `@retail/database` |
| **Auth** | Supabase Auth (SSR) | Cookie-based session via `@supabase/ssr` |
| **Styling** | Tailwind CSS | Utility-first CSS framework |
| **Monorepo** | Nx + npm workspaces | Packages terpisah (`@retail/database`, `@retail/types`) |

---

## 2. Struktur Folder Aplikasi

```text
apps/gasoline-web/src/
├── app/                          # Next.js App Router pages & API
│   ├── layout.tsx                # Root layout dengan MobileLayout shell
│   ├── globals.css               # Global styles (Tailwind)
│   ├── page.tsx                  # Dashboard utama & Riwayat Rekap Harian
│   ├── shift/page.tsx            # Form Opening/Closing Shift + Pembelian + Pengemasan
│   ├── catalog/page.tsx          # Katalog produk (CRUD harga/varian)
│   ├── report/page.tsx           # Laporan rekap mingguan & bulanan
│   ├── salary/page.tsx           # Pengelolaan & riwayat gaji karyawan
│   ├── finance/page.tsx          # Ringkasan keuangan & arus kas
│   ├── login/page.tsx            # Halaman login (Supabase Auth)
│   └── api/
│       ├── recap/
│       │   ├── route.ts          # GET: Ambil semua rekap dari database PostgreSQL
│       │   └── sync/route.ts     # POST: Upsert rekap langsung ke database PostgreSQL
│       └── salary/
│           └── route.ts          # GET & POST: Pengelolaan gaji karyawan
├── components/common/
│   ├── MobileLayout.tsx          # App shell (header, area scroll, bottom nav)
│   └── BottomNav.tsx             # Navigasi tab bawah (mobile)
├── lib/
│   ├── calculations.ts           # Pure functions: perhitungan rekap, revenue, profit
│   ├── RecapAggregator.ts        # Pure functions: agregasi mingguan (ISO week) & bulanan
│   ├── CurrencyFormatter.ts      # Utilitas format Rupiah, float, dan short cash
│   ├── schemas/gasoline.ts       # Zod schemas untuk validasi form shift & rekap
│   ├── schemas/salary.ts         # Zod schema untuk form pembayaran gaji
│   └── supabaseServer.ts         # Supabase SSR client + checkAdminAccess helper
├── store/
│   └── useGasolineStore.ts       # Zustand store (state & actions terhubung ke API)
└── middleware.ts                  # Auth middleware (redirect /login)
```

---

## 3. Skema Database (Raw SQL DDL)

### Tabel: `gasoline_recaps`
Menyimpan rekap harian per tanggal operasional.

```sql
CREATE TABLE gasoline_recaps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date VARCHAR(10) UNIQUE NOT NULL,
    total_sold_liters DOUBLE PRECISION NOT NULL DEFAULT 0,
    total_revenue DOUBLE PRECISION NOT NULL DEFAULT 0,
    total_capital DOUBLE PRECISION NOT NULL DEFAULT 0,
    total_net_profit DOUBLE PRECISION NOT NULL DEFAULT 0,
    cash_in DOUBLE PRECISION NOT NULL DEFAULT 0,
    cash_out DOUBLE PRECISION NOT NULL DEFAULT 0,
    net_finance_flow DOUBLE PRECISION NOT NULL DEFAULT 0,
    uang_awal DOUBLE PRECISION NOT NULL DEFAULT 0,
    belanja DOUBLE PRECISION NOT NULL DEFAULT 0,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Tabel: `gasoline_product_recaps`
Menyimpan detail per varian produk per hari (relasi child ke `gasoline_recaps`).

```sql
CREATE TABLE gasoline_product_recaps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recap_id UUID NOT NULL REFERENCES gasoline_recaps(id) ON DELETE CASCADE,
    product_id VARCHAR(50) NOT NULL,
    opening_stock DOUBLE PRECISION NOT NULL DEFAULT 0,
    closing_stock DOUBLE PRECISION NOT NULL DEFAULT 0,
    sold_qty DOUBLE PRECISION NOT NULL DEFAULT 0,
    revenue DOUBLE PRECISION NOT NULL DEFAULT 0,
    capital DOUBLE PRECISION NOT NULL DEFAULT 0,
    profit DOUBLE PRECISION NOT NULL DEFAULT 0
);
```

### Tabel: `salary_payments`
Menyimpan riwayat pembayaran gaji karyawan.

```sql
CREATE TABLE salary_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date VARCHAR(10) NOT NULL,
    week_label VARCHAR(100),
    amount DOUBLE PRECISION NOT NULL DEFAULT 0,
    recipient VARCHAR(100),
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 4. State Management (Database-First Zustand Store)

Store utama berada di `store/useGasolineStore.ts`.

### Sifat State (Tanpa Persist LocalStorage)
- PostgreSQL database menjadi **Single Source of Truth**.
- Data diambil langsung dari API Route (`/api/recap`, `/api/salary`) saat komponen di-mount.
- Tidak ada penggabungan data offline (safe merge) atau penyimpanan `localStorage` agar tidak terjadi bentrok data antara browser dan database.

### Property State Utama

| Property | Tipe | Keterangan |
| :--- | :--- | :--- |
| `products` | `ProductDefinition[]` | Katalog produk & penetapan harga |
| `jerigenStock` | `number` | Stok bensin curah di jerigen (Liter) |
| `bottleStock` | `Record<string, number>` | Stok botol fisik di rak per produk |
| `activeDate` | `string` | Tanggal shift aktif (`YYYY-MM-DD`) |
| `activeOpeningStock` | `Record \| null` | Stok awal pagi (`null` jika belum buka shift) |
| `activePushedBottles` | `Record<string, number>` | Botol yang dikemas/ditambahkan hari ini |
| `activeCashIn` | `number` | Modal kas awal pagi |
| `activeCashOut` | `number` | Total belanja bensin harian |
| `dailyRecaps` | `DailyRecapResult[]` | Array riwayat rekap harian dari database |
| `salaryPayments` | `SalaryPayment[]` | Array riwayat pembayaran gaji dari database |

---

## 5. API Endpoints & Transaksi Direct

### `GET /api/recap`
Mengambil seluruh data rekap harian dari database PostgreSQL.
- **Auth**: `checkAdminAccess()` (verifikasi Supabase session + role `ADMIN` di database).
- **Query**: Parameterized Raw SQL `SELECT * FROM gasoline_recaps ORDER BY date DESC` dipadukan dengan JOIN `gasoline_product_recaps`.
- **Response**: Array JSON `DailyRecapResult[]`.

### `POST /api/recap/sync`
Menyimpan/memperbarui rekap harian langsung ke PostgreSQL database.
- **Auth**: `checkAdminAccess()`.
- **Body**: `{ recaps: SyncRecapInput[] }`.
- **Logic**: Menggunakan Raw SQL Transaction (`BEGIN ... COMMIT`):
  - `INSERT INTO gasoline_recaps (...) VALUES (...) ON CONFLICT (date) DO UPDATE SET ...`
  - `DELETE FROM gasoline_product_recaps WHERE recap_id = $1` lalu bulk `INSERT INTO gasoline_product_recaps`.
- **Response**: `{ success: true, syncedCount: N }`.

### `GET & POST /api/salary`
Mengambil dan menambah data transaksi gaji karyawan secara langsung ke PostgreSQL database.

---

## 6. Autentikasi & Otorisasi

### Middleware (`middleware.ts`)
Dijalankan di setiap request browser:
1. Membuka Supabase SSR client dengan cookie access.
2. Memeriksa session via `supabase.auth.getUser()`.
3. Jika belum terautentikasi dan bukan halaman `/login`: redirect ke `/login`.
4. Jika sudah terautentikasi dan membuka `/login`: redirect ke `/`.

### Server-Side Auth (`supabaseServer.ts`)
Fungsi `checkAdminAccess()` memvalidasi role user di database PostgreSQL via Raw SQL query:
`SELECT role FROM users WHERE email = $1`.

---

## 7. Validasi Form (Zod Schemas)

Semua form menggunakan `react-hook-form` resolved dengan schema Zod di `lib/schemas/gasoline.ts` dan `lib/schemas/salary.ts`.

| Schema | Digunakan Di | Validasi Field Utama |
| :--- | :--- | :--- |
| `openingStockSchema` | Form Pagi (Opening Shift) | `date`, `uangAwal` (parseRupiah), `openingStocks` |
| `closingStockSchema` | Form Malam (Closing Shift) | `uangAkhir` (parseRupiah), `note` (wajib jika selisih $\neq 0$), `closingStocks` |
| `purchaseSchema` | Form Pembelian Bensin | `liters` (parseFloat), `cost` (parseRupiah), `target` |
| `pourSchema` | Form Pengemasan | `bottleId`, `quantity` (parseFloat) |
| `salarySchema` | Form Pembayaran Gaji | `date`, `amount` (parseRupiah), `recipient`, `weekLabel` |
| `loginSchema` | Form Login | `email`, `password` |
