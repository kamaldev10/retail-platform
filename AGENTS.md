# Development Guidelines & AI Rules — RetailPlatform

This document outlines the technical architecture, development standards, and AI assistance rules for the `retail-platform` repository.

---

## 🏗️ Workspace Architecture

- **Monorepo**: npm workspaces (`apps/`, `packages/`)
- **Frameworks**: Next.js 15+ (App Router), Vite + React 18+
- **Language**: TypeScript — Strict Mode. **DO NOT** use `any`. Use strict interfaces or `unknown`.
- **Styling**: Tailwind CSS & shadcn/ui
- **Database**: PostgreSQL — Raw SQL, parameterized queries via `@retail/database` DAOs only. No ORM.
- **State Management**: Zustand (slice pattern) — Database is Single Source of Truth. No `persist` middleware.
- **Toast / Notifications**: `sonner` — **NEVER** use browser `alert()` or `confirm()`.

---

## 🗄️ Database Architecture (Single Source of Truth)

- **ALL** application state is sourced from PostgreSQL. No localStorage, no IndexedDB, no offline caching of business state.
- Zustand stores are **in-memory only** — hydrated from DB on mount, cleared on unmount/logout.
- Every write action (form submit, stock adjustment) must `POST` to an API route before updating UI state.
- On mount, every page fetches its data from the corresponding API route (e.g. `fetchRecapsFromCloud`, `fetchStockFromCloud`, `fetchSalaryFromCloud`).
- **Schema**: `gasoline.*` tables in PostgreSQL. Migrations in `packages/database/migrations/`.

### Key Tables

| Table                      | Purpose                                  |
| -------------------------- | ---------------------------------------- |
| `gasoline.recaps`          | Daily shift recap records                |
| `gasoline.product_recaps`  | Per-product opname items per recap       |
| `gasoline.salary_payments` | Employee salary payment records          |
| `gasoline.live_stock`      | Live stock adjustment (jerigen + bottle) |

---

## 📁 Project Structure

```
retail-platform/
├── apps/
│   ├── gasoline-web/          # Next.js 15 PWA — retail fuel operator app
│   │   ├── src/
│   │   │   ├── app/           # App Router pages & API routes
│   │   │   │   ├── api/
│   │   │   │   │   ├── recap/    # GET list, DELETE by date
│   │   │   │   │   ├── recap/sync/  # POST upsert recap
│   │   │   │   │   ├── salary/   # GET list, POST new payment
│   │   │   │   │   └── stock/    # GET live stock, POST adjustment
│   │   │   ├── store/         # Zustand store (slice pattern)
│   │   │   │   ├── types.ts       # All store interfaces
│   │   │   │   ├── useGasolineStore.ts  # Compose slices
│   │   │   │   └── slices/
│   │   │   │       ├── catalogSlice.ts
│   │   │   │       ├── shiftSlice.ts
│   │   │   │       ├── recapSlice.ts
│   │   │   │       └── salarySlice.ts
│   │   │   ├── components/
│   │   │   │   └── common/    # MobileLayout, BottomNav, PWAInstallPrompt
│   │   │   └── lib/
│   │   │       ├── calculations.ts
│   │   │       ├── CurrencyFormatter.ts
│   │   │       ├── supabaseServer.ts
│   │   │       └── schemas/   # Zod schemas per domain
│   │   └── docs/              # Architecture & feature docs (Bahasa Indonesia)
│   ├── admin-dashboard/
│   └── pos/
├── packages/
│   ├── database/
│   │   ├── migrations/        # Sequential SQL migration files
│   │   └── src/
│   │       ├── connection.ts
│   │       ├── index.ts       # Export all repositories
│   │       └── repositories/  # One repository per domain
│   └── types/
└── .github/
    └── rules/
        ├── commit-message.md   # Conventional Commits rules
        └── pull-request-template.md
```

---

## 📝 Commit Message Convention

Follow `.github/rules/commit-message.md`. Summary:

```
<type>(<scope>): <imperative summary>
```

**Types**: `feat`, `fix`, `refactor`, `perf`, `docs`, `test`, `chore`, `build`, `ci`, `style`, `revert`  
**Rules**: Imperative mood. ≤50 chars subject. No trailing period. No AI attribution. No emoji unless asked.

### Examples

```bash
feat(gasoline-web): add daily shift closing form
fix(stock): persist live stock adjustment to database
refactor(gasoline-web): split useGasolineStore into modular slices
docs(gasoline-web): update ARCHITECTURE.md to database-first
```

---

## 🔀 Git Workflow & Environment Promotion

Follow `.github/rules/git-workflow.md`. Summary:

```
[ Feature Branch: feat/* ] ──(PR)──► [ staging ] ──(PR after UAT)──► [ main ]
```

1. **Environments**:
   - `main`: **Production** (`gasoline-7saudara.vercel.app` + Production DB)
   - `staging`: **Staging** (`gasoline-staging.vercel.app` + Staging DB)
   - `feat/*`, `fix/*`, `refactor/*`: **Development** (`localhost:3003` + Local/Staging DB)
2. **NEVER** push directly to `main` or `staging`.
3. Create feature branches off `staging`:
   - `feat/<scope>-<description>`
   - `fix/<scope>-<description>`
   - `refactor/<scope>-<description>`
4. Open PR to `staging` for UAT testing.
5. Once approved in Staging, open PR from `staging` to `main` for Production release.

**Dev server**: `npm run start:gasoline` (runs `node ../../node_modules/next/dist/bin/next dev -p 3003`)

---

## 📐 Coding & Architectural Principles

### 1. Domain-Driven Design & Clean Architecture

- Business logic belongs in `lib/calculations.ts` or domain-specific libs — not in components or API routes.
- Repository pattern: DB queries only via `packages/database/src/repositories/*.ts`.
- Avoid generic names (`utils.ts`, `helpers.ts`). Use domain-explicit names (`CurrencyFormatter.ts`, `GasolineRecapRepository.ts`).

### 2. Early Return Pattern

- Prefer early returns over nested `if/else` blocks.

### 3. Component & Store Modularization

- Functions: single-purpose, ≤50 lines.
- Components: ≤80 lines, decompose if larger.
- Zustand: **slice pattern** — one slice per domain (`catalogSlice`, `shiftSlice`, `recapSlice`, `salarySlice`).

### 4. Monorepo Path Mapping

- `@retail/database` → `packages/database`
- `@retail/types` → `packages/types`
- `@/*` → `apps/<app>/src/*`
- **DO NOT** use relative `../../../` paths to cross package boundaries.

### 5. No Unused React Imports

- **DO NOT** include `import React from 'react'` unless explicitly using `React.*` APIs.

---

## 🧪 Form & UI Standards

1. **Forms**: Use `react-hook-form` + `zod` schema from `lib/schemas/`. No manual `useState` validation or `alert()`.
2. **Notifications**: Use `sonner` `toast.success()` / `toast.error()`. `<Toaster>` is registered in `app/layout.tsx`.
3. **Accessibility**: Every input MUST have `<label htmlFor>`, `aria-invalid`, `aria-describedby` bound to error text.
4. **Async Submit Protection**: Disable submit button during `isSubmitting`. Render `Loader2` spinner.
5. **Loading States**: Show loading skeleton or spinner while fetching from DB on mount.

---

## 🚫 Anti-Patterns — Strictly Forbidden

| ❌ Forbidden                                         | ✅ Correct                                        |
| ---------------------------------------------------- | ------------------------------------------------- |
| `alert()` / `confirm()`                              | `toast.error()` / `toast.success()` from sonner   |
| `localStorage` / `sessionStorage` for business state | Fetch from DB via API route                       |
| Zustand `persist` middleware                         | In-memory store only, hydrate from DB on mount    |
| `any` TypeScript type                                | Explicit interface or `unknown`                   |
| Relative paths for cross-package imports             | `@retail/database`, `@retail/types`               |
| Push to `main` directly                              | Feature branch + PR                               |
| Offline-first sync logic                             | Database-first: all reads/writes go to PostgreSQL |
| Browser `alert()` for form validation errors         | `react-hook-form` + `zod` + `sonner` toast        |
