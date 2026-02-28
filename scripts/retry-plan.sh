#!/usr/bin/env bash
# retry-plan.sh — Move a plan from failed/ → ready/ and update pipeline.yaml status.
#
# Usage:
#   ./scripts/retry-plan.sh          # List tasks in "failed" status
#   ./scripts/retry-plan.sh <id>     # Retry by task ID
#   ./scripts/retry-plan.sh <name>   # Retry by partial name match

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# shellcheck source=scripts/lib/common.sh
source "$SCRIPT_DIR/lib/common.sh"

FAILED_DIR="$PROJECT_ROOT/.claude/plans/failed"
READY_DIR="$PROJECT_ROOT/.claude/plans/ready"

# Get all tasks with status=failed
get_failed_tasks() {
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
    if task['status'] == 'failed':
        slug = re.sub(r'[^a-z0-9]+', '-', task['name'].lower()).strip('-')
        print(f"{task['id']}\t{task['phase']}\t{task['name']}\t{slug}")
PYEOF
}

# Find plan file for task in failed/
find_plan_file() {
  local id="$1" phase="$2" slug="$3"
  local exact="$FAILED_DIR/phase-${phase}-${id}-${slug}.md"
  if [[ -f "$exact" ]]; then echo "$exact"; return; fi
  find "$FAILED_DIR" -maxdepth 1 -name "phase-${phase}-${id}-*.md" -type f 2>/dev/null | head -1
}

# Retry a single task
retry_task() {
  local id="$1" phase="$2" name="$3" slug="$4"
  local plan_file
  plan_file=$(find_plan_file "$id" "$phase" "$slug")

  if [[ -z "$plan_file" || ! -f "$plan_file" ]]; then
    echo "ERROR: No plan file found in failed/ for task #${id} (${name})"
    echo "  Expected: phase-${phase}-${id}-${slug}.md (or similar)"
    exit 1
  fi

  local plan_name
  plan_name="$(basename "$plan_file")"

  mv "$plan_file" "$READY_DIR/$plan_name"
  # Remove log file if present
  local log_file="$FAILED_DIR/${plan_name%.md}.log"
  [[ -f "$log_file" ]] && rm "$log_file"

  update_yaml_status "$id" "ready"
  echo "Retrying: #${id}. ${name}"
  echo "  Plan moved: failed/$plan_name → ready/$plan_name"
  echo "  pipeline.yaml: failed → ready"
}

# No arguments — list failed tasks
if [[ $# -eq 0 ]]; then
  tasks_found=false
  while IFS=$'\t' read -r id phase name slug; do
    [[ -n "$id" ]] || continue
    tasks_found=true
    plan_file=$(find_plan_file "$id" "$phase" "$slug")
    log_file=""
    if [[ -n "$plan_file" ]]; then
      plan_name="$(basename "$plan_file")"
      log_candidate="$FAILED_DIR/${plan_name%.md}.log"
      if [[ -f "$log_candidate" ]]; then
        log_file="  [log: failed/${plan_name%.md}.log]"
      fi
    fi
    echo "  #${id}. ${name} (Phase ${phase})${log_file}"
  done < <(get_failed_tasks)

  if [[ "$tasks_found" == "false" ]]; then
    echo "No tasks in 'failed' status."
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
done < <(get_failed_tasks)

if [[ -z "$matched_id" ]]; then
  echo "ERROR: No failed task matching '$ARG'"
  echo "Run without arguments to list failed tasks."
  exit 1
fi

retry_task "$matched_id" "$matched_phase" "$matched_name" "$matched_slug"
