# Plan 03: Standarisasi Pagination, Limit, Indeks & Database Optimization

**Lokasi**: `apps/gasoline-web/docs/plan/03-pagination-limit-and-database-performance-rules.md`  
**Status**: 📌 Aturan Wajib Sistem (Mandatory System Rule)  
**Target Scope**: Seluruh API Routes, Database Repositories (`@retail/database`), dan UI Data Fetching.

---

## 1. 📌 Latar Belakang & Aturan Wajib (Mandatory Rules)

Untuk menjamin performa aplikasi yang tinggi, mencegah kehabisan memori server (_Out of Memory_), dan memastikan query database PostgreSQL tetap cepat seiring berjalannya waktu, ditetapkan 3 aturan wajib:

1. **Wajib Pagination & Limit**: Setiap pengambil data koleksi/daftar (_list data_) di API Route & Database Repository **WAJIB** menerapkan parameter `page` dan `limit`. Dilarang keras melakukan `SELECT * FROM table` tanpa klausul `LIMIT` dan `OFFSET`.
2. **Standardisasi Indeks Database**: Setiap kolom _Foreign Key_, kolom penyaringan (_filter_ seperti `date`, `status`, `category`), dan kolom pengurutan (_sorting_) **WAJIB** memiliki indeks B-Tree eksplisit.
3. **Presisi Tipe Data Keuangan**: Tipe data nilai finansial wajib menggunakan `NUMERIC(15, 2)` dan takaran volume liter menggunakan `NUMERIC(12, 3)`. Dilarang menggunakan `DOUBLE PRECISION` untuk transaksi akuntansi.

---

## 2. 📐 Spesifikasi Kontrak Pagination API Route

### A. Parameter Input Query URL (`Request Query Params`)

Setiap API handler `GET` yang mengembalikan koleksi data wajib membaca query parameter berikut:

| Parameter | Tipe     | Default | Ketentuan                                |
| --------- | -------- | ------- | ---------------------------------------- |
| `page`    | `number` | `1`     | Nomor halaman (dimulai dari 1)           |
| `limit`   | `number` | `20`    | Jumlah item per halaman (Maksimal `100`) |

Contoh Endpoint:
`GET /api/finance?page=1&limit=20&category=SALES_REVENUE`

### B. Rumus Kalkulasi DB Offset

```typescript
const page = Math.max(1, Number(searchParams.get('page')) || 1)
const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit')) || 20))
const offset = (page - 1) * limit
```

### C. Struktur Response JSON Standardized

```json
{
	"data": [
		{
			"id": "58cbdd61-e9a4-4f53-8661-4e2daa7d7614",
			"transactionDate": "2026-08-10",
			"flowType": "IN",
			"category": "SALES_REVENUE",
			"amount": 250000.0,
			"paymentMethod": "CASH"
		}
	],
	"pagination": {
		"page": 1,
		"limit": 20,
		"totalItems": 150,
		"totalPages": 8,
		"hasNextPage": true,
		"hasPrevPage": false
	}
}
```

---

## 3. 🗄️ Standardisasi Query PostgreSQL Repository Layer

Setiap DAO Repository wajib menjalankan dua query secara paralel via `Promise.all()`:

1. Query penghitung total baris matching (`SELECT COUNT(*)`).
2. Query pengambil item terpaginasi (`LIMIT $1 OFFSET $2`).

### Contoh Implemetasi Repository Pattern:

```typescript
export interface PaginatedResult<T> {
	data: T[]
	pagination: {
		page: number
		limit: number
		totalItems: number
		totalPages: number
		hasNextPage: boolean
		hasPrevPage: boolean
	}
}

export async function findPaginatedRecords(
	page = 1,
	limit = 20,
	filters?: Record<string, any>,
): Promise<PaginatedResult<FinanceRow>> {
	const validPage = Math.max(1, page)
	const validLimit = Math.min(100, Math.max(1, limit))
	const offset = (validPage - 1) * validLimit

	const [countRes, dataRes] = await Promise.all([
		query(`SELECT COUNT(*) FROM gasoline.finances ${whereClause}`, countParams),
		query(
			`SELECT * FROM gasoline.finances ${whereClause} ORDER BY transaction_date DESC LIMIT $1 OFFSET $2`,
			[...dataParams, validLimit, offset],
		),
	])

	const totalItems = Number(countRes.rows[0].count)
	const totalPages = Math.ceil(totalItems / validLimit)

	return {
		data: dataRes.rows,
		pagination: {
			page: validPage,
			limit: validLimit,
			totalItems,
			totalPages,
			hasNextPage: validPage < totalPages,
			hasPrevPage: validPage > 1,
		},
	}
}
```

---

## 4. ⚡ Panduan Indeks & Optimasi Database

### A. Aturan Wajib Indeks (Indexing Standard)

1. **Foreign Keys**: Seluruh kolom rujukan foreign key (`recap_id`, `salary_id`, `product_id`, `order_id`) wajib memiliki indeks.
2. **Filter & Sort Columns**: Kolom yang sering dipakai di klausul `WHERE` dan `ORDER BY` (`transaction_date`, `created_at`, `category`, `status`, `flow_type`) wajib diindeks secara eksplisit.
3. **Partial Indexes**: Gunakan partial index untuk kolom opsional / nullable:
   ```sql
   CREATE INDEX idx_gasoline_finances_recap_id ON gasoline.finances(recap_id) WHERE recap_id IS NOT NULL;
   ```

### B. Evaluasi Query Plan (`EXPLAIN ANALYZE`)

Sebelum merilis query baru ke produksi, pastikan query tersebut tidak menghasilkan _Sequential Scan_ pada tabel berukuran besar:

```sql
EXPLAIN ANALYZE
SELECT * FROM gasoline.finances
WHERE transaction_date >= '2026-08-01'
ORDER BY transaction_date DESC
LIMIT 20 OFFSET 0;
```

---

## 5. 🚫 Hal yang Dilarang (Forbidden Practices)

1. ❌ **Dilarang**: Mengambil seluruh baris data tanpa `LIMIT` (`SELECT * FROM table`).
2. ❌ **Dilarang**: Menggunakan client-side slicing (`array.slice(0, 20)`) untuk data berukuran besar yang diambil dari database.
3. ❌ **Dilarang**: Melakukan query pada kolom yang tidak diindeks di dalam `WHERE` clause atau `JOIN`.
4. ❌ **Dilarang**: Menggunakan tipe data `DOUBLE PRECISION` atau `FLOAT` untuk mencatat nilai Rupiah atau finansial.
