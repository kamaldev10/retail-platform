# RetailPlatform 🛒

> A modern, high-performance, modular e-commerce & retail platform built with Next.js, TypeScript/ORM, PostgreSQL, Shadcn UI and Tailwind CSS.

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 📌 Overview

**RetailPlatform** is a full-stack capstone project designed to deliver a seamless shopping experience for consumers while offering robust inventory, order processing, and administrative analytics for retail managers.

Engineered with **Next.js App Router**, **TypeScript**, and **Clean Architecture / Domain-Driven Design (DDD)** principles, the platform emphasizes type safety, scalable database interactions, and responsive UI components.

---

## 🏛️ System Architecture

```mermaid
graph TD
    subgraph Client Layer
        Web[Storefront & Admin Web App]
    end

    subgraph Application Layer - Next.js
        RSC[React Server Components]
        API[API Routes / Server Actions]
        Auth[Auth Handler - NextAuth/Clerk]
    end

    subgraph Data & Storage Layer
        ORM[ORM - Prisma / Drizzle]
        DB[(PostgreSQL Database)]
        Cache[(Redis Cache - Sessions/Cart)]
    end

    subgraph External Services
        Stripe[Stripe Payment Gateway]
        CDN[Media CDN - S3/Cloudinary]
    end

    Web --> RSC
    Web --> API
    API --> Auth
    API --> ORM
    ORM --> DB
    API --> Cache
    API --> Stripe
    RSC --> CDN
```

---

## ✨ Features

### 🛍️ Customer Experience

- **Product Catalog & Search**: Fast multi-faceted product discovery with category filtering and keyword search.
- **Dynamic Shopping Cart**: Real-time cart state management with persistent sessions.
- **Streamlined Checkout**: Secure order processing workflow with address validation and payment gateway integration.
- **User Accounts & Order History**: Order tracking, profile management, and saved preferences.

### 📊 Retail Management (Admin Dashboard)

- **Inventory Control**: Real-time stock tracking, low-stock alerts, and variant management.
- **Order Fulfillment**: Status tracking (`Pending`, `Processing`, `Shipped`, `Delivered`, `Cancelled`).
- **Analytics & Reporting**: Sales summaries, revenue trends, and popular product insights.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router, Server Components)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) & [shadcn/ui](https://ui.shadcn.com/)
- **Database**: [PostgreSQL](https://www.postgresql.org/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Authentication**: NextAuth.js / Clerk

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: `v18.x` or later
- **npm** / **pnpm** / **yarn**
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
   Create a `.env.local` file in the root directory:

   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/retail_db?schema=public"
   NEXTAUTH_SECRET="your-secret-key"
   NEXTAUTH_URL="http://localhost:3000"
   ```

4. **Run database migrations**:

   ```bash
   npx prisma db push
   ```

5. **Start the development server**:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

---

## 🧪 Scripts

- `npm run dev`: Start local development server.
- `npm run build`: Build production bundle.
- `npm run start`: Run production build server.
- `npm run lint`: Run ESLint and check for formatting issues.
- `npm run test`: Run unit and integration tests.

---

## 📄 License

Distributed under the MIT License. See [`LICENSE`](file:///d:/projects/retail-platform/LICENSE) for details.
