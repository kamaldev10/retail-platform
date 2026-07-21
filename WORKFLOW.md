# AI-Assisted Workflow Comparison: Vague vs. Precise Prompting

## Overview
This document evaluates the engineering outcomes of building a user profile settings form twice: first using a single-sentence vague prompt ([`round-1-vague`](https://github.com/kamaldev10/retail-platform/tree/round-1-vague)) and second using a structured, constraint-driven specification ([`round-2-precise`](https://github.com/kamaldev10/retail-platform/tree/round-2-precise)).

---

## 🔍 Specific Code & Architecture Diff

| Metric / Dimension | Round 1 (`round-1-vague`) | Round 2 (`round-2-precise`) |
| :--- | :--- | :--- |
| **Validation Architecture** | Imperative `if (!name) alert(...)` inside `handleSubmit` | Declarative Zod schema (`profileSettingsSchema`) with `@hookform/resolvers/zod` |
| **State Management** | Unstructured `useState` hooks per input | Unified React Hook Form state with typed `ProfileSettingsValues` |
| **Accessibility (a11y)** | ❌ Missing `<label htmlFor>`, `aria-invalid`, and `aria-describedby` | ✅ Full ARIA compliance, modular `FormField` wrapper, `role="alert"`, `aria-live` status |
| **Edge Cases & UX** | ❌ No submission disabling, no loading spinner, no character limit | ✅ Async spinner, submit button disabled while pending, `200` char bio counter |
| **Automated Testing** | ❌ 0 unit tests | ✅ Vitest + React Testing Library suite (`ProfileSettingsForm.test.tsx`) |

---

## 🐛 AI Mistakes Caught in Round 1

During Round 1, the AI produced several production-blocking mistakes due to lack of explicit constraints:

1. **Unlinked Form Controls**: Inputs were rendered inside generic `<div>` wrappers accompanied by `<p>` text tags instead of `<label htmlFor="...">` elements. Consequently, screen readers could not associate field titles with inputs.
2. **Missing Boundary Validation**: The `bio` field permitted unbounded text entry. In a PostgreSQL database schema constrained to `VARCHAR(200)`, submitting long text causes unhandled database truncation exceptions.
3. **Double Submission Vulnerability**: The form submit button remained enabled during async execution, permitting users to repeatedly trigger duplicate network requests.

---

## ⏱️ Review Effort & Efficiency Analysis

While Round 1 generated raw code in ~15 seconds, inspecting the output, adding accessibility attributes, refactoring state to Zod, and writing tests manually required **~25 minutes of remediation effort**. 

In contrast, spending **2 minutes** constructing a precise specification for Round 2 generated production-grade, accessible code complete with unit tests on the initial attempt. This required less than **1 minute of review**. Upfront specification and test verification significantly reduce total lead time.

---

## 📌 Key Lessons
1. Vague prompts shift the burden of system architecture, edge-case coverage, and accessibility compliance onto manual code review.
2. Specifying Zod schemas, ARIA bindings, and verification steps in the initial prompt enables deterministic, production-ready AI outputs.
