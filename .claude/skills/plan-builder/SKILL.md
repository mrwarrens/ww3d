---
name: plan-builder
description: Explores the codebase and generates an implementation plan. Usage: /plan-builder Phase N - Task name
---

# Plan Builder

Generate an implementation plan for a roadmap task and save it to `.claude/plans/`.

## Arguments

`$ARGUMENTS` — the phase and task name, e.g. `Phase 1 - Establish file organization`

## Instructions

### Step 1: Parse arguments

Parse `$ARGUMENTS` to extract:
- **Phase number** — the integer after "Phase " (e.g. `1`)
- **Task name** — the text after " - " (e.g. `Establish file organization`)
- **Task slug** — lowercase task name with spaces replaced by hyphens (e.g. `establish-file-organization`)
- **Output path** — `.claude/plans/phase-{n}-{task-slug}.md`

### Step 2: Read project context

Read these files to understand conventions and task details:

!`cat roadmap.md`

!`cat CLAUDE.md`

### Step 3: Explore relevant code

Use Glob, Grep, and Read to explore files related to the task:
- Identify which source files are affected
- Understand current patterns and architecture
- Note any dependencies or constraints

### Step 4: Write the plan

Save the plan to `.claude/plans/phase-{n}-{task-slug}.md` using this template:

```markdown
# Plan: {Task Name}

## Context
{Why this change is needed, what problem it solves, relevant background from roadmap.md}

## Implementation Steps

1. **{Step title}**
   - {Detail}
   - {Detail}

2. **{Step title}**
   - {Detail}

...

N. **Write tests**
   - Create `tests/{test-file}.browser.test.ts[x]` (use `.tsx` if React/canvas needed, `.ts` otherwise)
   - Test each new behavior or public API introduced by this task
   - For stores/utilities: test initial state and each action/function
   - For components: test rendered structure and behavior, not implementation details

## Files to Create/Modify

- `{path}` — {what changes}
- `{path}` — {what changes}
- `tests/{test-file}.browser.test.ts[x]` — {what is tested}

## Verification

- `npm test -- --run` — all tests pass (existing and new)
- `npm run build` — production build succeeds
- {Any task-specific checks}

## Completion

- Check off the task in `roadmap.md` (change `[ ]` to `[x]`)
- Commit with message: `<type>: Phase <N> - <Task Name>`
- Push to origin
```

### Step 5: Report

Output a brief summary:
- The plan file path
- A 2–3 sentence summary of the approach
- Number of implementation steps
