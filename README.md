# RetailPlatform 🛒

> A modern, high-performance, modular e-commerce & retail platform organized as an **Nx Monorepo** using **npm workspaces**.

[![Nx](https://img.shields.io/badge/Nx-Workspace-blue?style=flat-square&logo=nx)](https://nx.dev/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![Vite](https://img.shields.io/badge/Vite-Vite_5-646CFF?style=flat-square&logo=vite)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 📌 Overview

**RetailPlatform** is a full-stack e-commerce and point-of-sale platform structured as a monorepo. It contains several client-facing applications and shared modules to provide in-store operations (POS), customer-facing purchases, and manager operations.

The repository follows **Clean Architecture & Domain-Driven Design (DDD)** principles to separate business models from presentation layers.

---

## 🏛️ Monorepo Structure

```
├── apps/
│   ├── admin-dashboard/       # Vite + React administrative dashboard (Port: 3001)
│   ├── pos/                   # Next.js Point of Sale terminal interface (Port: 3002)
│   └── gasoline-web/          # Next.js customer portal storefront (Port: 3003)
├── packages/
│   ├── database/              # Shared database layer, PostgreSQL schema, and Prisma Client
│   └── types/                 # Centralized TypeScript model interfaces (User, Product, Order)
├── nx.json                    # Nx tasks runner configuration
└── tsconfig.base.json         # Base tsconfig with project path mappings (@retail/*)
```

---

## 🏛️ System Architecture

```mermaid
graph TD
    subgraph Clients [Client Layer - apps/]
        ViteAdmin[Admin Dashboard - Vite + React]
        NextPOS[POS Terminal - Next.js]
        NextWeb[Gasoline Web - Next.js]
    end

    subgraph Core [Shared Packages - packages/]
        Types[@retail/types - TypeScript interfaces]
        DBPkg[@retail/database - Prisma Client]
    end

    subgraph Data [Data & Infrastructure]
        PG[(PostgreSQL Database)]
    end

    ViteAdmin -.-> Types
    NextPOS -.-> Types
    NextWeb -.-> Types

    ViteAdmin --> DBPkg
    NextPOS --> DBPkg
    NextWeb --> DBPkg

    DBPkg --> PG
```

---

## 🛠️ Tech Stack

- **Monorepo Orchestrator**: [Nx](https://nx.dev/) with `npm workspaces`
- **Applications**:
  - **Admin Dashboard**: [Vite](https://vitejs.dev/) + [React](https://react.dev/) + [Tailwind CSS](https://tailwindcss.com/)
  - **POS & Gasoline Web**: [Next.js](https://nextjs.org/) (App Router, Server Components)
- **Data & Infrastructure**:
  - **Database**: [PostgreSQL](https://www.postgresql.org/)
  - **ORM**: [Prisma](https://www.prisma.io/)

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: `v20.x` or later
- **npm**: `v10.x` or later
- **PostgreSQL**: Local instance or cloud database

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/retail-platform.git
   cd retail-platform
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/retail_db?schema=public"
   ```

4. **Generate Prisma Client**:
   ```bash
   npm run db:generate --workspace=packages/database
   ```

5. **Start Development Servers**:
   Run all projects in parallel:
   ```bash
   npm run dev
   ```
   Or start a specific application (e.g., POS):
   ```bash
   npx nx dev @retail/pos
   ```

---

## 🧪 Scripts & Commands

All workspace commands are managed dynamically through **Nx**:

- `npm run dev` or `npx nx run-many --target=dev --all`: Start development servers for all apps.
- `npm run build` or `npx nx run-many --target=build --all`: Compile production builds.
- `npm run lint` or `npx nx run-many --target=lint --all`: Run syntax checking.
- `npm run test` or `npx nx run-many --target=test --all`: Run unit test suites.

---

## 📄 License

Distributed under the MIT License. See [`LICENSE`](file:///d:/projects/retail-platform/LICENSE) for details.
