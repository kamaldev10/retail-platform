---
trigger: always_on
glob: '*'
description: Rule for Git workflow, branch strategy, and environment promotion.
---

# Git Workflow & Environment Promotion Rules

This document outlines the strict Git branching model, environment mapping, and promotion workflow for the `retail-platform` monorepo.

---

## 🔀 Branch Strategy & Environment Mapping

| Environment     | Branch Name                                | Target URL / Scope             | Database Target        |
| --------------- | ------------------------------------------ | ------------------------------ | ---------------------- |
| **Production**  | `main`                                     | `gasoline-7saudara.vercel.app` | Supabase Production DB |
| **Staging**     | `staging`                                  | `gasoline-staging.vercel.app`  | Supabase Staging DB    |
| **Development** | `feat/*`, `fix/*`, `refactor/*`, `chore/*` | `localhost:3003`               | Local / Staging DB     |

---

## 📋 Branch Naming Conventions

All topic and feature branches created from `staging` MUST follow these prefix conventions:

- `feat/<scope>-<description>` — New features or functional enhancements
- `fix/<scope>-<description>` — Bug fixes
- `refactor/<scope>-<description>` — Code restructuring without functional changes
- `chore/<scope>-<description>` — Maintenance, tooling, or dependency updates
- `docs/<scope>-<description>` — Documentation changes only

_Examples_: `feat/gasoline-shift-transactions`, `fix/stock-persistence`, `refactor/store-slices`

---

## 🔄 Promotion & Merge Workflow

```
[ Feature Branch: feat/* ]
       │
       │ (1. Pull Request to staging)
       ▼
  [ Branch: staging ] ─────────► Deploys to Staging (UAT & Testing)
       │
       │ (2. Pull Request to main after UAT approval)
       ▼
   [ Branch: main ]    ─────────► Deploys to Production (Live Operations)
```

### 1. Feature to Staging (`feat/*` ➔ `staging`)

- All new work MUST be branched off `staging`.
- Push topic branch to GitHub and create a Pull Request targeting `staging` using `.github/rules/pull-request-template.md`.
- Vercel automatically deploys a Preview/Staging build connected to the Staging Database.
- Perform UAT (User Acceptance Testing) and regression checks on the Staging URL.

### 2. Staging to Production (`staging` ➔ `main`)

- **NEVER** push directly to `main` or `staging`.
- **NEVER** merge feature branches directly into `main` without testing on `staging` first.
- When `staging` is validated and approved for release, create a Pull Request from `staging` targeting `main`.
- Merging to `main` triggers Vercel Production deployment and applies PostgreSQL schema migrations on Production DB.

---

## 🚫 Forbidden Actions

1. **Direct Pushes to Protected Branches**: NEVER push code directly to `main` or `staging`. Always use topic branches and Pull Requests.
2. **Bypassing Staging**: NEVER merge feature branches directly into `main` without testing on `staging` first.
3. **Destructive Production Schema Changes**: NEVER run untested raw SQL migrations directly on Production without verifying on Staging first.
