# Development Guidelines & AI Rules — RetailPlatform

This document outlines the technical architecture, development standards, and AI assistance rules for the `retail-platform` repository.

---

## 🏗️ Technical Stack

- **Framework**: Next.js 15+ (App Router, React Server Components)
- **Language**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS & shadcn/ui
- **Database**: PostgreSQL with Prisma / Drizzle ORM
- **State Management**: Zustand / React Query

---

## 📝 Commit Message Conventions

All commits in this repository MUST follow the **Conventional Commits** standard format:

`<type>(<optional scope>): <short description>`

### Allowed Types:

- `feat`: A new feature for the application or system.
- `fix`: A bug fix.
- `docs`: Documentation changes only.
- `style`: Formatting, missing semi-colons, white-space changes (no functional changes).
- `refactor`: Code change that neither fixes a bug nor adds a feature.
- `perf`: Performance improvements.
- `test`: Adding missing tests or correcting existing tests.
- `chore`: Maintenance tasks, dependencies, build configuration, tooling.

### Examples:

```bash
feat(cart): implement persistent guest cart with local storage sync
fix(checkout): address stripe payment intent race condition
chore(deps): upgrade tailwindcss to v3.4
```

---

## 📐 Coding & Architectural Principles

### 1. Domain-Driven Design & Clean Architecture

- Keep business domain logic strictly separated from UI components and framework boilerplate.
- Avoid generic utility filenames (`utils.ts`, `helpers.ts`, `common.ts`). Use domain-explicit module names like `OrderCalculator.ts`, `InventoryTracker.ts`, `PaymentValidator.ts`.

### 2. Early Return Pattern

- Prefer early returns over deeply nested `if/else` logic blocks to maintain high readability.

### 3. Component & Function Modularization

- Keep functions single-purpose and under 50 lines of code.
- Decompose UI components exceeding 80 lines into smaller subcomponents.
- Keep files focused and under 200 lines where practical.

### 4. Library-First Mentality

- Evaluate existing established solutions (e.g. `shadcn/ui`, `zod`, `zustand`, `cockatiel`) before writing custom utilities or complex home-grown state solutions.
