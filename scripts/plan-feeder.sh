#!/usr/bin/env bash
# plan-feeder.sh — Generate plans for unblocked pending tasks in pipeline.yaml.
#
# For each task where status == "pending" and all deps are "done" or "accepted",
# runs the plan-builder skill and saves the plan to .claude/plans/defined/.
# Updates pipeline.yaml status to "planned" on success.
#
# Plans are written to defined/ for human review. Use approve-plan.sh to move
# them to ready/ for execution by claude-queue.sh.
#
# Usage: ./scripts/plan-feeder.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# shellcheck source=scripts/lib/common.sh
source "$SCRIPT_DIR/lib/common.sh"

DEFINED_DIR="$PROJECT_ROOT/.claude/plans/defined"
SKILL_FILE="$PROJECT_ROOT/.claude/skills/plan-builder/SKILL.md"

# Generate a plan for a task using the plan-builder skill.
generate_plan() {
  local id="$1"
  local phase="$2"
  local name="$3"
  local slug="$4"
  local args="Phase ${phase} - ${id} - ${name}"
  local expected_plan="$DEFINED_DIR/phase-${phase}-${id}-${slug}.md"

  log "Running plan-builder for: $args"

  # Strip YAML frontmatter and substitute $ARGUMENTS in the skill file content
  local prompt
  prompt=$(PLAN_ARGS="$args" python3 -c "
import os, sys, re
content = open(sys.argv[1]).read()
# Strip leading YAML frontmatter (--- ... ---)
content = re.sub(r'^---\n.*?\n---\n', '', content, count=1, flags=re.DOTALL)
print(content.replace('\$ARGUMENTS', os.environ['PLAN_ARGS']))
" "$SKILL_FILE")

  run_claude "$prompt"

  case "$CLAUDE_STATUS" in
    success)
      if [[ -f "$expected_plan" ]]; then
        log "Plan saved: phase-${phase}-${id}-${slug}.md"
        update_yaml_status "$id" "planned"
        log "Updated pipeline.yaml: task #${id} → planned"
      else
        log "WARNING: plan-builder succeeded but $expected_plan was not created"
      fi
      ;;
    *)
      log "ERROR: plan-builder failed for task #${id} (status=$CLAUDE_STATUS)"
      log "Output: $CLAUDE_OUTPUT"
      ;;
  esac
}

log "Plan feeder started"
log "Project: $PROJECT_ROOT"
log "Poll interval: ${POLL_INTERVAL}s"

while true; do
  log "Scanning pipeline.yaml for plannable tasks..."

  found_any=false
  while IFS=$'\t' read -r id phase name slug; do
    [[ -n "$id" ]] || continue

    current_status
    current_status=$(read_yaml_status "$id")

    # Skip if already beyond pending (e.g. planned/ready/done/accepted)
    if [[ "$current_status" != "pending" ]]; then
      log "Task #${id} (${name}) — status=${current_status}, skipping"
      continue
    fi

    # Check if a plan file already exists in defined/ (idempotency guard)
    if find "$DEFINED_DIR" -maxdepth 1 -name "phase-${phase}-${id}-*.md" 2>/dev/null | grep -q .; then
      log "Task #${id} (${name}) — plan file exists in defined/, updating status to planned"
      update_yaml_status "$id" "planned"
      continue
    fi

    found_any=true
    log "Task #${id}: ${name} (Phase ${phase})"
    generate_plan "$id" "$phase" "$name" "$slug"
  done < <(get_plannable_tasks)

  if [[ "$found_any" == "false" ]]; then
    log "No new plans needed. Sleeping ${POLL_INTERVAL}s..."
  fi

  sleep "$POLL_INTERVAL"
done
