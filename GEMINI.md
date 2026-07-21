# Gemini & AI Assistant Rules — RetailPlatform

Refer to [AGENTS.md](file:///d:/projects/retail-platform/AGENTS.md) for full project conventions.

## Quick Summary
- **Tech Stack**: Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui, PostgreSQL.
- **Commits**: Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `perf:`, `test:`).
- **Architecture**: Domain-Driven Design, Clean Architecture, early return pattern, domain-specific module names.

## Mandatory Form & UI Rules
1. **Forms**: Use `react-hook-form` + `zod` schema from `lib/schemas/`. Never use uncontrolled inputs with imperative `alert()`.
2. **Accessibility**: Every input MUST have `<label htmlFor>`, `aria-invalid`, and `aria-describedby` bound to error text.
3. **Async State**: Disable submit buttons during `isSubmitting` and render a `Loader2` spinner.
