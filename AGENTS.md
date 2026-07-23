# Development Guidelines & AI Rules — RetailPlatform

This document outlines the technical architecture, development standards, and AI assistance rules for the `retail-platform` repository.

---

- **Workspace Architecture**: Nx Monorepo using npm workspaces (`apps/`, `packages/`)
- **Frameworks**: Next.js 15+ (App Router), Vite + React 18+
- **Language**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS & shadcn/ui
- **Database & ORM**: PostgreSQL with Prisma ORM
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

## 🔀 Git Workflow & Branch Protection

- **DO NOT** commit or push changes directly to the `main` branch under any circumstances.
- **ALWAYS** create a descriptive feature/fix branch (e.g. `feat/checkout-flow`, `fix/login-session`, `chore/dependency-bump`) and push to the remote branch.
- The user will perform the code review and execute the merge of all Pull Requests.

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

### 5. Monorepo Path Mapping & Imports

- **DO NOT** use relative paths to import shared packages. Always use path mappings:
  - `@retail/database` for database models/Prisma client.
  - `@retail/types` for TypeScript model definitions.
- **DO NOT** include unused `import React from 'react'` in TSX files. This causes compiler errors in strict configurations (like Vite + React).

---

## 🧪 Project Rules & Form Standards (Learned from FE Drills)

1. **Form Validation Standard**: All user input forms MUST use `react-hook-form` resolved with a Zod schema stored in `lib/schemas/`. Uncontrolled inputs relying on imperative `alert()` or manual `useState` checks are forbidden.
2. **Accessibility (a11y) Binding Rule**: Form controls MUST feature explicit `<label htmlFor="...">` bindings, `aria-invalid={!!error}`, and `aria-describedby` linking directly to error element IDs (`${fieldId}-error`).
3. **Async Form Submit Protection**: All submit buttons MUST be disabled during `isSubmitting` states and display an animated spinner component (`Loader2`) to prevent duplicate submissions.
