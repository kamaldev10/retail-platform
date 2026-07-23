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

## 4. Headless API Design & Data Sync

Gasoline Web uses Next.js Route Handlers to synchronize daily stock recaps from offline operator browser clients to the centralized PostgreSQL cloud database.

### Database Models Specification (packages/database/prisma/schema.prisma)

```prisma
model GasolineRecap {
  id              String                @id @default(uuid())
  date            String                @unique // YYYY-MM-DD
  totalSoldLiters Float
  totalRevenue    Float
  totalCapital    Float
  totalNetProfit  Float
  cashIn          Float
  cashOut         Float
  netFinanceFlow  Float
  items           GasolineProductRecap[]
  createdAt       DateTime              @default(now())
  updatedAt       DateTime              @updatedAt
}

model GasolineProductRecap {
  id           String        @id @default(uuid())
  recapId      String
  recap        GasolineRecap @relation(fields: [recapId], references: [id], onDelete: Cascade)
  productId    String
  openingStock Float
  closingStock Float
  soldQty      Float
  revenue      Float
  capital      Float
  profit       Float
}
```

### Endpoints Specification

#### 1. `GET /api/recap`
Fetches all daily recaps from the database, sorted chronologically descending.

* **Response (200 OK):**
  ```json
  [
    {
      "id": "recap-uuid",
      "date": "2026-07-23",
      "totalSoldLiters": 12.5,
      "totalRevenue": 150000,
      "totalCapital": 120000,
      "totalNetProfit": 30000,
      "cashSummary": {
        "cashIn": 150000,
        "cashOut": 20000,
        "netFinanceFlow": 130000
      },
      "items": [
        {
          "productId": "p1",
          "openingStock": 10,
          "closingStock": 5,
          "soldQty": 5,
          "revenue": 60000,
          "capital": 50000,
          "profit": 10000
        }
      ]
    }
  ]
  ```

#### 2. `POST /api/recap/sync`
Receives a batch of local recaps that were recorded while offline, upserting them to the PostgreSQL database safely.

* **Request Body:**
  ```json
  {
    "recaps": [
      {
        "id": "recap-local-id",
        "date": "2026-07-23",
        "totalSoldLiters": 12.5,
        "totalRevenue": 150000,
        "totalCapital": 120000,
        "totalNetProfit": 30000,
        "cashSummary": {
          "cashIn": 150000,
          "cashOut": 20000,
          "netFinanceFlow": 130000
        },
        "items": [
          {
            "productId": "p1",
            "openingStock": 10,
            "closingStock": 5
          }
        ]
      }
    ]
  }
  ```
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "syncedCount": 1
  }
  ```
