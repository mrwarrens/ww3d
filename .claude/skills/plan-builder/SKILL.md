---
name: plan-builder
description: Explores the codebase and generates an implementation plan. Usage: /plan-builder Phase N - GlobalTaskId - Task name
---

# Plan Builder

Generate an implementation plan for a roadmap task and save it to `.claude/plans/defined/`.

## Arguments

`$ARGUMENTS` — the phase, global task ID, and task name, e.g. `Phase 3 - 23 - Assembly/group data model`

## Instructions

### Step 1: Parse arguments

Parse `$ARGUMENTS` to extract:
- **Phase number** — the integer after "Phase " (e.g. `3`)
- **Task ID** — the global integer after the second " - " (e.g. `23`)
- **Task name** — the text after the third " - " (e.g. `Assembly/group data model`)
- **Task slug** — lowercase task name with non-alphanumeric runs collapsed to hyphens (e.g. `assembly-group-data-model`)
- **Output path** — `.claude/plans/defined/phase-{n}-{task-id}-{task-slug}.md` (relative to project root)

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

Save the plan to `.claude/plans/defined/phase-{n}-{task-id}-{task-slug}.md` (relative to project root) using this template:

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

N+1. **Verify, commit, and push**
   - Run `npm test -- --run` — all tests must pass
   - Run `npm run build` — production build must succeed
   - {Any task-specific manual checks}
   - Edit `roadmap.md`: change `[ ]` to `[x]` for this task
   - Update `pipeline.yaml` is handled automatically by claude-queue.sh — do not edit it manually
   - Commit: `<type>: Phase <N> - <Task Name>`
   - Push to origin

## Files to Create/Modify

- `{path}` — {what changes}
- `{path}` — {what changes}
- `tests/{test-file}.browser.test.ts[x]` — {what is tested}
```

### Step 5: Trim unnecessary complexity

Before finalizing, review every item in the plan against the roadmap. For each of the following, ask: **which specific roadmap task reads or uses this?** If you cannot name one, remove it from the plan.

Check:
- Every field in a new data model or interface
- Every type alias or union type
- Every exported function beyond what the task description explicitly asks for
- Every store action beyond what a UI component or test in this phase will call

Apply CLAUDE.md's rule: "Don't design for hypothetical future requirements. The right amount of complexity is the minimum needed for the current task."

Update the plan file to remove anything that doesn't pass this check.

### Step 6: Report

Output a brief summary:
- The plan file path
- A 2–3 sentence summary of the approach
- Number of implementation steps
