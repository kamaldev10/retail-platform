---
trigger: always_on
glob: "*"
description: Rule for writing commit messages.
---

# Commit Message Rules

Write commit messages terse, exact, and in Conventional Commits format. Cut noise from commit messages while preserving intent and reasoning.

## Subject Line Rules

- Format: `<type>(<scope>): <imperative summary>` — `<scope>` is optional.
- Types: `feat`, `fix`, `refactor`, `perf`, `docs`, `test`, `chore`, `build`, `ci`, `style`, `revert`
- Imperative mood: Use "add", "fix", "remove" — not "added", "adds", "adding".
- Length: Keep ≤ 50 characters when possible, hard cap at 72 characters.
- Formatting: No trailing period. Match project convention for capitalization after the colon.

## Body Rules (Only if needed)

- Skip the body entirely when the subject is self-explanatory.
- Add body only for: non-obvious _why_, breaking changes, migration notes, or linked issues.
- Wrap lines at 72 characters.
- Use bullets `-` instead of `*`.
- Reference issues/PRs at the end: `Closes #42`, `Refs #17`.

## What NEVER to include

- AI-attribution: Do not include "Generated with Claude Code", "Assisted by Gemini", or any other AI attribution.
- Restating file names (the diff/scope already tells this).
- Self-referential words like "I", "we", "this commit", "now", "currently".
- Connective fluff or pleasantries.
- Emojis (unless explicitly requested).
