#!/usr/bin/env bash
# claude-queue.sh — Execute plans from .claude/plans/ready/ for tasks in pipeline.yaml.
#
# Polls pipeline.yaml for tasks with status == "ready", finds their plan files
# in ready/, executes them via `claude -p`, and updates status to done or failed.
#
# Usage: ./scripts/claude-queue.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# shellcheck source=scripts/lib/common.sh
source "$SCRIPT_DIR/lib/common.sh"

READY_DIR="$PROJECT_ROOT/.claude/plans/ready"
DONE_DIR="$PROJECT_ROOT/.claude/plans/done"
FAILED_DIR="$PROJECT_ROOT/.claude/plans/failed"

# Find the plan file for a task in ready/.
# Prints the path if found, empty string if not.
find_plan_file() {
  local id="$1"
  local phase="$2"
  local slug="$3"

  # Try exact slug match first
  local exact="$READY_DIR/phase-${phase}-${id}-${slug}.md"
  if [[ -f "$exact" ]]; then
    echo "$exact"
    return
  fi

  # Fall back to any file matching phase-{phase}-{id}-*.md
  local found
  found=$(find "$READY_DIR" -maxdepth 1 -name "phase-${phase}-${id}-*.md" -type f 2>/dev/null | head -1)
  echo "$found"
}

run_plan() {
  local id="$1"
  local phase="$2"
  local name="$3"
  local slug="$4"

  local plan_file
  plan_file=$(find_plan_file "$id" "$phase" "$slug")

  if [[ -z "$plan_file" || ! -f "$plan_file" ]]; then
    log "ERROR: No plan file found in ready/ for task #${id} (${name})"
    log "  Expected: phase-${phase}-${id}-${slug}.md (or similar)"
    log "  Skipping — set status back to planned to re-approve"
    return
  fi

  local plan_name
  plan_name="$(basename "$plan_file")"
  local plan_content
  plan_content="$(cat "$plan_file")"

  log "Executing: $plan_name (task #${id}: ${name})"

  run_claude "$plan_content"

  case "$CLAUDE_STATUS" in
    success)
      mv "$plan_file" "$DONE_DIR/$plan_name"
      update_yaml_status "$id" "done"
      log "SUCCESS: task #${id} → done (plan moved to done/)"
      ;;
    *)
      mv "$plan_file" "$FAILED_DIR/$plan_name"
      echo "$CLAUDE_OUTPUT" > "$FAILED_DIR/${plan_name%.md}.log"
      update_yaml_status "$id" "failed"
      log "FAILURE: task #${id} → failed (status=$CLAUDE_STATUS)"
      log "  Plan moved to failed/, log written"
      ;;
  esac
}

log "Claude queue processor started"
log "Project: $PROJECT_ROOT"
log "Poll interval: ${POLL_INTERVAL}s"

while true; do
  ready_tasks=()
  while IFS=$'\t' read -r id phase name slug; do
    [[ -n "$id" ]] || continue
    ready_tasks+=("$id|$phase|$name|$slug")
  done < <(get_ready_tasks)

  if [[ ${#ready_tasks[@]} -eq 0 ]]; then
    log "No tasks in ready status. Polling again in ${POLL_INTERVAL}s..."
    sleep "$POLL_INTERVAL"
    continue
  fi

  for entry in "${ready_tasks[@]}"; do
    IFS='|' read -r id phase name slug <<< "$entry"
    run_plan "$id" "$phase" "$name" "$slug"
  done
done
