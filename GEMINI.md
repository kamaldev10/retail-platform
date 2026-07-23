# Gemini & AI Assistant Rules — RetailPlatform

Refer to [AGENTS.md](file:///d:/projects/retail-platform/AGENTS.md) for full project conventions.

## Quick Summary
- **Workspace Architecture**: Nx Monorepo (apps/ and packages/).
- **Tech Stack**: Next.js 15+ (App Router), Vite + React 18+, TypeScript, Tailwind CSS, PostgreSQL, Prisma.
- **Commits**: Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `perf:`, `test:`).
- **Architecture**: Domain-Driven Design, Clean Architecture, early return pattern, path aliases (`@retail/database`, `@retail/types`).

## Mandatory Form & UI Rules
1. **Forms**: Use `react-hook-form` + `zod` schema from `lib/schemas/`. Never use uncontrolled inputs with imperative `alert()`.
2. **Accessibility**: Every input MUST have `<label htmlFor>`, `aria-invalid`, and `aria-describedby` bound to error text.
3. **Async State**: Disable submit buttons during `isSubmitting` and render a `Loader2` spinner.

## Git Workflow Rule
- **NEVER push directly to `main`**. Commit your changes on a feature branch, push the branch, and let the user merge the PR.

