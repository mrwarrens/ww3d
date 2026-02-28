#!/usr/bin/env bash
# accept-plan.sh — Move a plan from done/ → accepted/ and update pipeline.yaml status.
#
# Usage:
#   ./scripts/accept-plan.sh          # List tasks in "done" status
#   ./scripts/accept-plan.sh <id>     # Accept by task ID
#   ./scripts/accept-plan.sh <name>   # Accept by partial name match

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# shellcheck source=scripts/lib/common.sh
source "$SCRIPT_DIR/lib/common.sh"

DONE_DIR="$PROJECT_ROOT/.claude/plans/done"
ACCEPTED_DIR="$PROJECT_ROOT/.claude/plans/accepted"

# Get all tasks with status=done
get_done_tasks() {
  python3 - "$PIPELINE_YAML" <<'PYEOF'
import sys, re

with open(sys.argv[1]) as f:
    content = f.read()

blocks = re.split(r'\n  - id:', content)
for block in blocks[1:]:
    lines = block.strip().splitlines()
    try:
        bid = int(lines[0].strip())
    except (ValueError, IndexError):
        continue
    task = {'id': bid, 'phase': None, 'name': '', 'status': 'pending'}
    for line in lines[1:]:
        m = re.match(r'\s*phase:\s*(\d+)', line)
        if m:
            task['phase'] = int(m.group(1))
        m = re.match(r'\s*name:\s*(.+)', line)
        if m:
            task['name'] = m.group(1).strip()
        m = re.match(r'\s*status:\s*(\S+)', line)
        if m:
            task['status'] = m.group(1)
    if task['status'] == 'done':
        slug = re.sub(r'[^a-z0-9]+', '-', task['name'].lower()).strip('-')
        print(f"{task['id']}\t{task['phase']}\t{task['name']}\t{slug}")
PYEOF
}

# Find plan file for task in done/
find_plan_file() {
  local id="$1" phase="$2" slug="$3"
  local exact="$DONE_DIR/phase-${phase}-${id}-${slug}.md"
  if [[ -f "$exact" ]]; then echo "$exact"; return; fi
  find "$DONE_DIR" -maxdepth 1 -name "phase-${phase}-${id}-*.md" -type f 2>/dev/null | head -1
}

# Accept a single task
accept_task() {
  local id="$1" phase="$2" name="$3" slug="$4"
  local plan_file
  plan_file=$(find_plan_file "$id" "$phase" "$slug")

  if [[ -z "$plan_file" || ! -f "$plan_file" ]]; then
    echo "ERROR: No plan file found in done/ for task #${id} (${name})"
    echo "  Expected: phase-${phase}-${id}-${slug}.md (or similar)"
    exit 1
  fi

  local plan_name
  plan_name="$(basename "$plan_file")"

  mv "$plan_file" "$ACCEPTED_DIR/$plan_name"
  update_yaml_status "$id" "accepted"
  echo "Accepted: #${id}. ${name}"
  echo "  Plan moved: done/$plan_name → accepted/$plan_name"
  echo "  pipeline.yaml: done → accepted"
}

# No arguments — list done tasks
if [[ $# -eq 0 ]]; then
  tasks_found=false
  while IFS=$'\t' read -r id phase name slug; do
    [[ -n "$id" ]] || continue
    tasks_found=true
    plan_file=$(find_plan_file "$id" "$phase" "$slug")
    plan_basename=""
    if [[ -n "$plan_file" ]]; then
      plan_basename="  [$(basename "$plan_file")]"
    fi
    echo "  #${id}. ${name} (Phase ${phase})${plan_basename}"
  done < <(get_done_tasks)

  if [[ "$tasks_found" == "false" ]]; then
    echo "No tasks in 'done' status."
  fi
  exit 0
fi

# Match argument to a task
ARG="$1"
matched_id="" matched_phase="" matched_name="" matched_slug=""

while IFS=$'\t' read -r id phase name slug; do
  [[ -n "$id" ]] || continue
  if [[ "$ARG" == "$id" ]] || echo "$name" | grep -qi "$ARG"; then
    matched_id="$id"
    matched_phase="$phase"
    matched_name="$name"
    matched_slug="$slug"
    break
  fi
done < <(get_done_tasks)

if [[ -z "$matched_id" ]]; then
  echo "ERROR: No done task matching '$ARG'"
  echo "Run without arguments to list done tasks."
  exit 1
fi

accept_task "$matched_id" "$matched_phase" "$matched_name" "$matched_slug"
