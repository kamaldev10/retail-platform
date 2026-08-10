# Plan 02: Sentralisasi & Re-Arsitektur Keuangan Gasoline Web (`gasoline.finances`)

**Lokasi**: `apps/gasoline-web/docs/plan/02-gasoline-finance-centralization-plan.md`  
**Status**: 📋 Disetujui Kustomisasi / Siap Eksekusi  
**Target Module**: `@retail/database` (`packages/database/`) & `@retail/gasoline-web` (`apps/gasoline-web/`)

---

## 1. 📌 Latar Belakang & Masalah Arsitektur Saat Ini

Saat ini data keuangan di modul `gasoline` tersebar di beberapa tabel:

1. **`gasoline.recaps`**:
   - `total_revenue` (omset penjualan)
   - `total_capital` (modal pokok HPP)
   - `total_net_profit` (laba bersih)
   - `cash_in` & `cash_out` & `net_finance_flow`
   - `uang_awal` ❌ (bahasa Indonesia ➔ diganti `initial_cash_balance`)
   - `belanja` ❌ (bahasa Indonesia ➔ diganti `fuel_purchase_cost`)

2. **`gasoline.salary_payments`**:
   - `amount` (biaya pengeluaran gaji pegawai)

3. **`gasoline.shift_transactions`**:
   - `cost` (biaya pengeluaran pembelian bensin per transaksi shift)

---

## 2. 🏛️ Visi Arsitektur Baru: `gasoline.finances` (Single Source of Truth Keuangan)

Tabel `gasoline.finances` menjadi **Buku Kas Utama (Central Financial Ledger)**. Seluruh transaksi arus uang (masuk/keluar) di modul `gasoline` **wajib** memiliki catatan di tabel ini.

### 📐 Skema Tabel Final (`gasoline.finances`)

```sql
CREATE TABLE IF NOT EXISTS gasoline.finances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,

    -- Tipe Arus Kas: IN (Masuk) / OUT (Keluar)
    flow_type VARCHAR(10) NOT NULL CHECK (flow_type IN ('IN', 'OUT')),

    -- Kategori Transaksi Keuangan Ringkas (Bahasa Inggris Explicit)
    category VARCHAR(50) NOT NULL CHECK (category IN (
        'SALES_REVENUE',      -- Pendapatan penjualan bensin botol
        'FUEL_PURCHASE',      -- Biaya pembelian bensin botolan/jerigen
        'SALARY_PAYMENT',     -- Biaya pengeluaran gaji pegawai
        'INITIAL_CASH',       -- Modal / uang awal laci kasir shift
        'CAPITAL_INJECTION',  -- Tambahan modal dari pemilik toko
        'OWNER_WITHDRAWAL',   -- Prive / Pengambilan uang oleh pemilik toko
        'OTHER'               -- Operasional / Penyesuaian kas lainnya
    )),

    amount NUMERIC(15, 2) NOT NULL DEFAULT 0 CHECK (amount >= 0),
    payment_method VARCHAR(20) NOT NULL DEFAULT 'CASH' CHECK (payment_method IN ('CASH', 'TRANSFER', 'QRIS')),

    -- Relasi & Rujukan (Polymorphic Foreign Keys ke Tabel Asal)
    reference_type VARCHAR(30) CHECK (reference_type IN ('RECAP', 'SALARY', 'SHIFT_TRANSACTION', 'MANUAL')),
    reference_id UUID,

    recap_id UUID REFERENCES gasoline.recaps(id) ON DELETE SET NULL,
    salary_id UUID REFERENCES gasoline.salary_payments(id) ON DELETE SET NULL,
    shift_transaction_id UUID REFERENCES gasoline.shift_transactions(id) ON DELETE SET NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'COMPLETED' CHECK (status IN ('COMPLETED', 'PENDING', 'CANCELLED')),
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indeks Kinerja Query Buku Kas
CREATE INDEX IF NOT EXISTS idx_gasoline_finances_date ON gasoline.finances(transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_gasoline_finances_category ON gasoline.finances(category);
CREATE INDEX IF NOT EXISTS idx_gasoline_finances_flow ON gasoline.finances(flow_type);
CREATE INDEX IF NOT EXISTS idx_gasoline_finances_recap ON gasoline.finances(recap_id);
```

---

## 3. 🔄 Logika Shift & Pembelian/Tuang Bensin

### A. Alur Siklus Shift Kasir (Shift Lifecycle)

1. **Buka Shift**:
   - Kasir membuka shift dengan memasukkan `INITIAL_CASH` (uang awal laci kasir).
   - Data tersimpan di `gasoline.active_shift` dan tercatat entry `INITIAL_CASH` (`IN`) di `gasoline.finances`.
2. **Pengoperasian Shift (Pembelian & Tuang Bensin)**:
   - Transaksi **Pembelian Bensin** dan **Tuang Bensin** dicatat di `gasoline.shift_transactions`.
   - Pembelian bensin langsung menambah catatan `FUEL_PURCHASE` (`OUT`) di `gasoline.finances`.
3. **Logika Pergantian Hari vs Tutup Shift**:
   - Shift **TIDAK otomatis berganti tanggal** saat jam 00:00 (tengah malam). Shift tetap aktif sampai operator mengeklik **"Tutup Shift / Simpan Laporan Akhir"**.
   - Ketika Tutup Shift dieksekusi:
     - Dibuatkan record rekap di `gasoline.recaps`.
     - Pendapatan omset di-flush sebagai `SALES_REVENUE` (`IN`) di `gasoline.finances`.
     - State `gasoline.active_shift` dibersihkan.

---

## 4. 🇮🇩 Format Tanggal (Locale `id-ID`)

- **Di Database PostgreSQL**: Tersimpan dalam format ISO `YYYY-MM-DD` atau `TIMESTAMPTZ` untuk menjamin kecepatan _indexing_, _sorting_, dan filter query.
- **Di Antarmuka UI / Form**: Seluruh tanggal ditampilkan menggunakan format **Locale Indonesia (`id-ID`)** (contoh: `"Senin, 10 Agustus 2026"` atau `"10 Agustus 2026"`).
- Dibuatkan helper `DateFormatter.ts` di `apps/gasoline-web/src/lib/DateFormatter.ts`:
  ```typescript
  export function formatDateID(dateString: string): string {
  	const d = new Date(dateString)
  	return new Intl.DateTimeFormat('id-ID', {
  		weekday: 'long',
  		year: 'numeric',
  		month: 'long',
  		day: 'numeric',
  	}).format(d)
  }
  ```

---

## 5. 📊 Diagram Relasi Data (Mermaid ERD)

```mermaid
erDiagram
    gasoline_finances {
        uuid id PK
        date transaction_date
        string flow_type "IN | OUT"
        string category "SALES_REVENUE | FUEL_PURCHASE | SALARY_PAYMENT | INITIAL_CASH | CAPITAL_INJECTION | OWNER_WITHDRAWAL | OTHER"
        numeric amount
        string payment_method "CASH | TRANSFER | QRIS"
        string reference_type "RECAP | SALARY | SHIFT_TRANSACTION | MANUAL"
        uuid recap_id FK
        uuid salary_id FK
        uuid shift_transaction_id FK
        string created_by
        string updated_by
        text description
        timestamp created_at
    }

    gasoline_recaps {
        uuid id PK
        string date UNIQUE
        double total_sold_liters
        double total_revenue
        double total_capital
        double total_net_profit
        double cash_in
        double cash_out
        double net_finance_flow
        double initial_cash_balance
        double fuel_purchase_cost
        text note
    }

    gasoline_salary_payments {
        uuid id PK
        string date
        string week_label
        double amount
        string recipient
        text note
    }

    gasoline_shift_transactions {
        uuid id PK
        string shift_date
        string transaction_date
        string type "purchase | pour"
        double cost
    }

    gasoline_finances }|--o| gasoline_recaps : "references recap"
    gasoline_finances }|--o| gasoline_salary_payments : "references salary payment"
    gasoline_finances }|--o| gasoline_shift_transactions : "references purchase transaction"
```

---

## 6. 🚀 Rencana Pelaksanaan & Tahapan (Implementation Roadmap)

### Tahap 1: Migrasi SQL (`packages/database/migrations/0007_gasoline_finances_ledger.sql`)

- Buat tabel `gasoline.finances` dengan constraint category baru & kolom `created_by`/`updated_by`.
- Query migrasi data historis dari `recaps`, `salary_payments`, dan `shift_transactions` ke `gasoline.finances`.
- Lakukan `RENAME COLUMN` pada `gasoline.recaps`: `uang_awal` ➔ `initial_cash_balance` dan `belanja` ➔ `fuel_purchase_cost`.

### Tahap 2: Repository Data Layer (`packages/database/src/repositories/GasolineFinanceRepository.ts`)

- Buat DAO repository untuk query `gasoline.finances`:
  - `findAllFinances(filters)`
  - `insertFinanceEntry(entry)`
  - `getFinancialSummaryByDateRange(startDate, endDate)`
- Update `GasolineRecapRepository.ts` & `SalaryPaymentRepository.ts` agar menyuntikkan entry ke `gasoline.finances` dalam **Atomic Transaction** (`BEGIN ... COMMIT`).

### Tahap 3: API Route & Helper Formatter (`apps/gasoline-web/src/app/api/finance/route.ts`)

- Buat `DateFormatter.ts` (penanggalan `id-ID`).
- `GET /api/finance`: Mengambil daftar buku kas utama beserta filter tanggal `id-ID`.
- `POST /api/finance`: Menambah transaksi kas keluar/masuk manual (prive, modal owner, operasional).

### Tahap 4: State Management & UI Halaman Keuangan (`financeSlice.ts` & `/finance`)

- Buat `financeSlice.ts` di Zustand store.
- Perbarui halaman `/finance` dengan antarmuka Buku Kas Utama, filter kategori, dan tanggal format `id-ID`.
