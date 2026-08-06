# Plan 01: Migrasi dari Offline-First ke Database Single Source of Truth (SoT)

**Lokasi**: `apps/gasoline-web/docs/plan/01-migration-from-offline-first-to-database-single-source-of-truth.md`  
**Status**: Completed (Selesai — Executed on 2026-08-07)  
**Target Aplikasi**: `@retail/gasoline-web` (`apps/gasoline-web/`)

---

## 1. Latar Belakang & Masalah

Sebelumnya `gasoline-web` menggunakan arsitektur hybrid **offline-first** dengan Zustand `persist` middleware (`localStorage`) dan mekanisme penggabungan data (`syncWithCloud`, `fetchRecapsFromCloud` safe merge).

### Masalah yang Telah Diselesaikan:
1. **Divergensi State**: Menghilangkan perbedaan data antara cache browser lokal kasir dan database cloud PostgreSQL.
2. **Bentrokan Data (Sync Conflict)**: Menghilangkan rehydration lokal yang menimpa data terhapus/terupdate dari cloud.
3. **Kompleksitas State**: Menghapus seluruh logika periksa status offline (`syncStatus`, `isOnline`, `OfflineBanner`).

---

## 2. Sasaran Migrasi (Tercapai)

1. PostgreSQL database menjadi satu-satunya **Single Source of Truth (SoT)**.
2. Seluruh dependensi `localStorage` / IndexedDB caching pada state bisnis telah dihapus.
3. Seluruh alur submit form (Shift Pagi, Shift Malam, Belanja, Pengemasan, Gaji) kini menggunakan transaksi jaringan langsung (direct network API calls).

---

## 3. Hasil Eksekusi Migrasi (Migration Execution Log)

### Fase 1: Refaktorisasi State Management (`src/store/useGasolineStore.ts`) — [x] Selesai
- [x] Bungkus middleware `persist` pada `useGasolineStore` telah dihapus.
- [x] State property offline (`isOnline`, `syncStatus`) telah dihapus.
- [x] Action method `setSyncStatus` dan `syncWithCloud` telah dihapus.
- [x] `fetchRecapsFromCloud()` diperbaiki: Mengabaikan array lokal, data dari PostgreSQL langsung menimpa state secara bersih.
- [x] `fetchSalaryFromCloud()` diperbaiki: Mengabaikan array lokal temporary `temp-`, data gaji dari PostgreSQL menimpa state secara bersih.
- [x] Action submit (`submitClosingStock`, `submitDailyReport`, `addSalaryPayment`, `updateRecap`, `deleteRecap`) diperbaiki: Mengirim request langsung ke API Route dan menampilkan pesan gagal jika server error.

### Fase 2: Pembersihan Komponen UI Offline — [x] Selesai
- [x] File `src/components/common/OfflineBanner.tsx` telah dihapus (`rm`).
- [x] `src/components/common/MobileLayout.tsx` diperbarui: Impor dan render `<OfflineBanner />` telah dibersihkan.
- [x] `src/components/common/BottomNav.tsx` diperbarui: Indikator badge `pendingCount` / `syncStatus` telah dibersihkan.
- [x] `src/components/common/PWAInstallPrompt.tsx` diperbarui: Pembacaan & penulisan `localStorage` serta teks offline telah dibersihkan.

### Fase 3: Direct API Data Hydration & Error Handling — [x] Selesai
- [x] `src/app/page.tsx` (Dashboard): `fetchRecapsFromCloud()` dipanggil saat mount.
- [x] `src/app/salary/page.tsx`: `fetchSalaryFromCloud()` dipanggil saat mount.
- [x] Handling error API direct di UI dengan pesan indikator yang jelas.

### Fase 4: Pengujian, Perbaikan Server & Verifikasi — [x] Selesai
- [x] Perbaikan script `start:gasoline` di root `package.json` untuk membypass bug `exit-handler.js` pada system npm:
  `"start:gasoline": "cd apps/gasoline-web && node ../../node_modules/next/dist/bin/next dev -p 3003"`
- [x] Jalankan Type Check: `npx tsc --noEmit` (0 Error).
- [x] Verifikasi Server: `npm run start:gasoline` berjalan di `http://localhost:3003`.

---

## 4. Hasil Akhir & Catatan Arsitektur

Aplikasi `@retail/gasoline-web` sekarang sepenuhnya berbasis **Database-First**. Seluruh transaksi langsung tersimpan ke database PostgreSQL cloud via API Route handlers (`/api/recap`, `/api/salary`), menjamin tidak ada perbedaan data antara client browser dan database server.
