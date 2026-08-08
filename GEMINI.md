# Gemini & AI Assistant Rules — RetailPlatform

Refer to [AGENTS.md](./AGENTS.md) for full project conventions, architecture, and anti-patterns.

---

## Quick Reference

| Topic             | Rule                                                                         |
| ----------------- | ---------------------------------------------------------------------------- |
| **Architecture**  | npm Workspaces Monorepo (`apps/`, `packages/`)                               |
| **Stack**         | Next.js 15 App Router · TypeScript Strict · PostgreSQL Raw SQL               |
| **State**         | Zustand slice pattern — **in-memory only**, hydrate from DB on mount         |
| **Data Source**   | PostgreSQL is **Single Source of Truth** — no localStorage/offline caching   |
| **Notifications** | `sonner` toast — `alert()` is **forbidden**                                  |
| **Forms**         | `react-hook-form` + `zod` schemas in `lib/schemas/`                          |
| **TypeScript**    | No `any` — strict interfaces or `unknown`                                    |
| **Imports**       | `@retail/database`, `@retail/types`, `@/*` — no relative cross-package paths |
| **Dev Server**    | `npm run start:gasoline` → port 3003                                         |

## Mandatory Rules

1. **NEVER push to `main` or `staging` directly** — feature branch ➔ PR to `staging` ➔ PR to `main` (per `.github/rules/git-workflow.md`).
2. **NEVER use `alert()`** — use `toast.error()` / `toast.success()` from `sonner`.
3. **NEVER use `localStorage`** for business state — fetch from DB via API route.
4. **NEVER use Zustand `persist`** middleware — DB is the source of truth.
5. **ALWAYS** run `npx tsc --noEmit` before committing to verify 0 type errors.
6. **ALWAYS** run `npx prettier --write .` before committing to format code.
7. **ALWAYS** ask before add, commit or push.
8. **Commits**: Conventional Commits format per `.github/rules/commit-message.md`.
9. **PRs**: Use `.github/rules/pull-request-template.md` as PR body template.
10. **Git Workflow**: Follow branch strategy rules in `.github/rules/git-workflow.md`.

## Gasoline-Web Store Slice Map

| Slice          | Responsibility                                                                                     |
| -------------- | -------------------------------------------------------------------------------------------------- |
| `catalogSlice` | Product catalog CRUD, `jerigenStock`, `bottleStock`, `fetchStockFromCloud`, `updateStocksDirectly` |
| `shiftSlice`   | Active shift state, `submitPurchase`, `pourFuelToBottles`, `submitClosingStock`                    |
| `recapSlice`   | `dailyRecaps`, `fetchRecapsFromCloud`, `updateRecap`, `deleteRecap`                                |
| `salarySlice`  | `salaryPayments`, `addSalaryPayment`, `fetchSalaryFromCloud`                                       |

## API Routes (gasoline-web)

| Route             | Methods     | Purpose                               |
| ----------------- | ----------- | ------------------------------------- |
| `/api/recap`      | GET, DELETE | Fetch all recaps / delete by date     |
| `/api/recap/sync` | POST        | Upsert recap to DB                    |
| `/api/salary`     | GET, POST   | Fetch / add salary payment            |
| `/api/stock`      | GET, POST   | Fetch / persist live stock adjustment |
