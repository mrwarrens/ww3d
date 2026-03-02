---
name: audit
description: Audits documentation for accuracy and reviews the codebase architecture for improvements. Usage: /audit
---

# Audit

Read-only audit of documentation and architecture. Makes no code changes.

## Instructions

### Part 1 — Documentation sync

For each document in `CLAUDE.md` and any files in `docs/`:
1. Read the document and all source files it references
2. Identify discrepancies: completed items not checked off, missing new modules, stale file paths, outdated architecture descriptions, wrong technology references
3. Update the document in place
4. Record every change made (file, line, what changed and why)

### Part 2 — Architecture review

Read the full source tree (`src/`, `tests/`). For each of the following, identify specific issues with file and line references — do not flag things that are working correctly:

- **Component responsibilities** — is any component doing too much? Should anything be split or merged?
- **State management** — is Zustand being used consistently? Is any state living in the wrong place (too high, too low, duplicated)?
- **R3F patterns** — are Three.js objects being created/disposed correctly? Any missing `useEffect` cleanup or stale refs?
- **TypeScript** — any `any` types, missing types, or places where stricter types would catch real bugs?
- **Test coverage** — any user-facing behaviors that have no test? Any tests that only test implementation details?
- **Performance** — any obvious unnecessary re-renders, expensive operations in render, or missing `useMemo`/`useCallback`?

### Output

Produce two sections:

**1. Doc changelog** — bulleted list of every document change: file, what was wrong, what was updated.

**2. Architecture findings** — bulleted list of specific issues, each with: `file:line`, problem description, suggested fix. Mark each as `[minor]`, `[moderate]`, or `[significant]`. Do not include findings you are uncertain about.

Do not make any code changes — this is a read and report task only.
