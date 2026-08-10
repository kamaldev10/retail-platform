---
trigger: always_on
glob: '*'
description: Rule for Git workflow, branch strategy, environment promotion, and collaboration best practices.
---

# Git Workflow & Environment Promotion Rules

This document outlines the strict Git branching model, environment mapping, promotion workflow, and collaboration best practices for the `retail-platform` monorepo.

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
       │ (1. Rebase on staging + PR)
       ▼
  [ Branch: staging ] ─────────► Deploys to Staging (UAT & Testing)
       │
       │ (2. Pull Request to main after UAT approval)
       ▼
   [ Branch: main ]    ─────────► Deploys to Production (Live Operations)
```

### 1. Feature to Staging (`feat/*` ➔ `staging`)

- All new work MUST be branched off `staging`.
- Always rebase feature branch onto latest `origin/staging` before opening PR.
- Push topic branch to GitHub and create a Pull Request targeting `staging` using `.github/rules/pull-request-template.md`.
- Vercel automatically deploys a Preview/Staging build connected to the Staging Database.
- Perform UAT (User Acceptance Testing) and regression checks on the Staging URL.

### 2. Staging to Production (`staging` ➔ `main`)

- **NEVER** push directly to `main` or `staging`.
- **NEVER** merge feature branches directly into `main` without testing on `staging` first.
- When `staging` is validated and approved for release, create a Pull Request from `staging` targeting `main`.
- Merging to `main` triggers Vercel Production deployment and applies PostgreSQL schema migrations on Production DB.

---

## 🤝 Best Practices for Git Collaboration & Rebase Rules

To maintain a clean, linear commit history and eliminate merge conflicts across team members, the following collaboration standards are **MANDATORY**:

### 1. Mandatory Rebase Before Push (`git pull --rebase`)

Before pushing any feature/topic branch to GitHub or creating a Pull Request, developers **MUST** synchronize their branch with `staging` using rebase:

```bash
# 1. Fetch latest changes from remote staging
git fetch origin staging

# 2. Rebase feature branch on top of latest origin/staging
git rebase origin/staging
# OR
git pull --rebase origin staging

# 3. Resolve conflicts locally if any, then push
git push origin <branch-name> --force-with-lease
```

**Why Rebase?**

- Eliminates ugly `Merge branch 'staging' into feat/...` merge commits.
- Keeps git history linear and easy to audit or bisect.
- Ensures feature code is tested against the latest target state before merging.

### 2. Mandatory Rebase & Squash Merging

- All Pull Requests merged into `staging` or `main` **MUST** use **Squash & Merge** or **Rebase & Merge**.
- Every merged feature should result in a single atomic, meaningful commit on `staging`.

### 3. Conventional Commits Adherence

- All commit messages MUST follow Conventional Commits (`feat`, `fix`, `refactor`, `chore`, `docs`).
- Subject line must be ≤50 chars in imperative mood (e.g. `feat(gasoline-web): add central finances ledger`).

### 4. Clean Working Tree & No Build Noise

- Never commit `.env.local`, build artifacts (`.next/`, `dist/`), or scratch files.
- Always run `npx tsc --noEmit` and `npx prettier --write .` before committing.

---

## 🚫 Forbidden Actions

1. **Direct Pushes to Protected Branches**: NEVER push code directly to `main` or `staging`. Always use topic branches and Pull Requests.
2. **Pushing Without Rebasing**: NEVER push a topic branch that is out of sync with `staging` without running `git rebase origin/staging` first.
3. **Bypassing Staging**: NEVER merge feature branches directly into `main` without testing on `staging` first.
4. **Destructive Production Schema Changes**: NEVER run untested raw SQL migrations directly on Production without verifying on Staging first.
