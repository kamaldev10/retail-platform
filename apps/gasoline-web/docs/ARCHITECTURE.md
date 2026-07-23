# Architecture Document: Gasoline Web

## 1. System Overview

Gasoline Web is a mobile-first Progressive Web App (PWA) designed for retail gasoline (minipump / eceran) operators to manage daily stock opname, calculate sales revenue, track margins, and monitor daily cash flows.

## 2. Monorepo Structure

The application resides in a modern monorepo setup using Turborepo/Nx and pnpm:

```text
apps/gasoline-web/
├── public/
│   ├── manifest.json          # PWA Manifest (icons, standalone display)
│   └── sw.js                  # Service Worker for offline-first caching
├── src/
│   ├── app/                   # Next.js App Router (layout, pages)
│   │   ├── layout.tsx         # Root layout with mobile container & PWA meta
│   │   ├── page.tsx           # Dashboard / Daily Summary View
│   │   ├── stock/             # Stock opname and Jerigen tracking
│   │   └── finance/           # Daily cash-in and cash-out management
│   ├── components/            # Feature-based mobile UI components
│   │   ├── common/            # MobileLayout, BottomNav, OfflineBanner, Header
│   │   ├── dashboard/         # Summary cards (revenue, modal, net profit)
│   │   ├── daily/             # Daily recap form & stock calculations
│   │   └── finance/           # Cash flow input forms
│   ├── hooks/                 # Custom React hooks (IndexedDB/LocalStorage sync)
│   ├── lib/                   # Core business logic (pricing, margin calculation)
│   └── store/                 # Zustand state management with offline persistence
```

## 3. Core Data & Business Logic

- **Products & Pricing Structure:**
  - 1 Liter: Sell Rp12.000 | Cost Rp10.000 | Margin Rp2.000
  - 1.2 Liter: Sell Rp15.000 | Cost Rp12.000 | Margin Rp3.000
  - 1.5 Liter: Sell Rp20.000 | Cost Rp15.000 | Margin Rp5.000
  - Jerigen Stock: Dynamic liter tracking.
- **Daily Recap Workflow:**
  - Instead of item-by-item POS transactions, operators input opening stock vs. closing physical stock (opname) daily.
  - System automatically computes units sold, total revenue, total capital, and net profit.
- **Offline-First Storage:**
  - State is persisted locally via IndexedDB/LocalStorage, allowing seamless operation without internet connectivity.
