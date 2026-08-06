# Architecture Plan: Refactoring Gasoline Web to Database-First Architecture

## Executive Summary

Gasoline Web currently uses a hybrid offline-first pattern with Zustand `persist` middleware (browser `localStorage`) and cloud sync logic (`syncWithCloud`, `fetchRecapsFromCloud`).
This causes state divergence and sync conflicts between browser storage and the PostgreSQL cloud database.

This refactoring plan removes offline persistence, offline banners, and local state merge fallbacks, converting `apps/gasoline-web` to a pure **Database-First (Direct API)** architecture.

---

## 1. Objectives

1. **Eliminate Browser State Divergence**: PostgreSQL database becomes the single source of truth.
2. **Remove Offline Sync Code**: Remove `syncWithCloud`, `fetchRecapsFromCloud` fallback merges, `OfflineBanner`, and local offline fallback responses.
3. **Remove `localStorage` Persistence**: Strip Zustand `persist` middleware from `useGasolineStore`.
4. **Direct API Actions**: Every shift opening, shift closing, purchase, and salary entry fires directly to `/api/*` endpoints. Failure alerts the user immediately instead of silently storing locally.

---

## 2. Refactoring Tasks & File Targets

### A. Store & State Management (`src/store/useGasolineStore.ts`)

- **Remove `persist` middleware wrapper**: Export standard `create<GasolineStore>()((set, get) => ...)` without `persist` middleware.
- **Remove local fallback merges**:
  - `fetchRecapsFromCloud()`: Replace merge logic (`[...cloudRecaps, ...unsyncedRecaps]`) with direct replacement `set({ dailyRecaps: cloudRecaps })`.
  - `fetchSalaryFromCloud()`: Replace merge logic with direct replacement `set({ salaryPayments: cloudSalaries })`.
- **Remove `syncStatus` & `isOnline` offline fields**: Remove offline status tracking properties and UI indicators.
- **Enforce direct API calls**: `submitClosingStock`, `addSalaryPayment`, `updateRecap`, `deleteRecap` must fail gracefully with error messages if API fails, without falling back to local store array mutations.

### B. Common Components

- **`src/components/common/OfflineBanner.tsx`**: Delete file or replace with empty component.
- **`src/components/common/MobileLayout.tsx`**: Remove `<OfflineBanner />` import and rendering.
- **`src/components/common/BottomNav.tsx`**: Remove `syncStatus` pending count indicator.
- **`src/components/common/PWAInstallPrompt.tsx`**: Replace `localStorage` dismissal check with memory state or remove.

### C. Pages & UI Handlers

- **`src/app/page.tsx` (Dashboard)**:
  - On mount, trigger `fetchRecapsFromCloud()` to pull clean state directly from PostgreSQL database.
- **`src/app/salary/page.tsx`**:
  - On mount, trigger `fetchSalaryFromCloud()` to pull clean salary records from database.
- **`src/app/shift/page.tsx`**:
  - Direct submission to API routes.

---

## 3. Data Flow Diagram (Database-First)

```
[User Action in App UI]
        │
        ▼
[Zustand Action / API Call]
        │
        ▼
[Next.js API Route Handlers (/api/recap, /api/salary)]
        │
        ▼
[Raw SQL DAOs / Connection Pool (@retail/database)]
        │
        ▼
[PostgreSQL Cloud Database (Single Source of Truth)]
```

---

## 4. Documentation Updates Completed

- Updated `docs/ARCHITECTURE.md` (Section 3 & 4) to specify Database-First Architecture.
- Updated `docs/system-logic.md` (Section 7) to specify direct database data flow and removal of local storage merge logic.
