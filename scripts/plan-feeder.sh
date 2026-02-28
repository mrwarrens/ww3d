#!/usr/bin/env bash
# plan-feeder.sh — When .claude/plans/ready/ is empty, generate plans for
# unblocked incomplete Phase 2 tasks that don't yet have a plan in defined/.
#
# Plans are written to defined/ for review. Copy them to ready/ manually
# to hand them off to claude-queue.sh for execution.
#
# Usage: ./scripts/plan-feeder.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

READY_DIR="$PROJECT_ROOT/.claude/plans/ready"
DEFINED_DIR="$PROJECT_ROOT/.claude/plans/defined"
DONE_DIR="$PROJECT_ROOT/.claude/plans/done"
ACCEPTED_DIR="$PROJECT_ROOT/.claude/plans/accepted"
ROADMAP="$PROJECT_ROOT/roadmap.md"
SKILL_FILE="$PROJECT_ROOT/.claude/skills/plan-builder/SKILL.md"

POLL_INTERVAL=10
RATE_LIMIT_WAIT=300
MAX_TURNS=30
ALLOWED_TOOLS="Read,Edit,Write,Bash,Glob,Grep,Task,WebSearch,WebFetch"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"
}

# Print tab-separated "num\tname\tslug" for each unblocked incomplete Phase 2 task.
# Reads the roadmap, extracts Phase 2 tasks, resolves dependencies, filters to unblocked.
get_unblocked_tasks() {
  python3 - "$ROADMAP" <<'PYEOF'
import sys, re

with open(sys.argv[1]) as f:
    content = f.read()

# Extract Phase 2 section
m = re.search(r'## Phase 2:.*?(?=\n## |\Z)', content, re.DOTALL)
if not m:
    sys.exit(0)

phase2 = m.group(0)

tasks = {}
for line in phase2.splitlines():
    tm = re.match(r'- \[([ x])\] \*\*(\d+)\. ([^*]+)\*\*', line)
    if not tm:
        continue
    done = tm.group(1) == 'x'
    num = int(tm.group(2))
    name = tm.group(3).strip()
    dep_match = re.search(r'_Depends on: ([^_]+)_', line)
    deps = []
    if dep_match:
        deps = [int(x) for x in re.findall(r'#(\d+)', dep_match.group(1))]
    tasks[num] = {'done': done, 'name': name, 'deps': deps}

for num, task in sorted(tasks.items()):
    if task['done']:
        continue
    # Skip if any dependency is not yet complete
    if not all(tasks.get(d, {}).get('done', False) for d in task['deps']):
        continue
    # Generate slug: lowercase, collapse non-alphanumeric runs to hyphens
    slug = re.sub(r'[^a-z0-9]+', '-', task['name'].lower()).strip('-')
    print(f"{num}\t{task['name']}\t{slug}")
PYEOF
}

# True if task is already in done/ or accepted/ (by task number prefix, any depth)
plan_is_done() {
  local num="$1"
  find "$DONE_DIR" "$ACCEPTED_DIR" -name "phase-2-${num}-*.md" | grep -q . 2>/dev/null
}

# True if a plan for this task already exists in defined/
plan_is_defined() {
  local num="$1"
  find "$DEFINED_DIR" -maxdepth 1 -name "phase-2-${num}-*.md" | grep -q . 2>/dev/null
}

# Run the plan-builder skill via `claude -p` to generate a plan into defined/.
generate_plan() {
  local num="$1"
  local name="$2"
  local slug="$3"
  local args="Phase 2 - ${num} - ${name}"
  local expected_plan="$DEFINED_DIR/phase-2-${num}-${slug}.md"

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

  while true; do
    local output exit_code=0
    output=$(cd "$PROJECT_ROOT" && env -u CLAUDECODE claude -p "$prompt" \
      --output-format json \
      --max-turns "$MAX_TURNS" \
      --allowedTools "$ALLOWED_TOOLS" \
      2>&1) || exit_code=$?

    local is_error result retry_after status
    is_error=$(echo "$output" | jq -r '.is_error // false' 2>/dev/null || echo "parse_error")
    result=$(echo "$output"   | jq -r '.result   // ""'    2>/dev/null || echo "")
    retry_after=$(echo "$output" | jq -r '.retry_after // 0' 2>/dev/null || echo "0")

    if echo "$result" | grep -qi "hit your limit\|you've hit"; then
      status="usage_limit"
    elif echo "$result" | grep -qi "rate.limit\|rate_limit\|429\|too many requests"; then
      status="rate_limit"
    elif [[ "$is_error" == "true" ]]; then
      status="error"
    elif [[ "$is_error" == "parse_error" || "$exit_code" -ne 0 ]]; then
      status="error"
    else
      status="success"
    fi

    case "$status" in
      rate_limit|usage_limit)
        local wait_secs="$RATE_LIMIT_WAIT"
        if [[ "$retry_after" -gt 0 ]]; then
          wait_secs="$retry_after"
        fi
        log "Rate/usage limited generating plan for #${num}. Waiting ${wait_secs}s..."
        sleep "$wait_secs"
        log "Retrying plan-builder for #${num}..."
        continue
        ;;
      success)
        if [[ -f "$expected_plan" ]]; then
          log "Plan saved to defined/: phase-2-${num}-${slug}.md"
        else
          log "WARNING: plan-builder succeeded but $expected_plan was not created"
        fi
        return
        ;;
      *)
        log "ERROR: plan-builder failed for task #${num} (status=$status exit=$exit_code)"
        log "Output: $output"
        return
        ;;
    esac
  done
}

log "Plan feeder started"
log "Project: $PROJECT_ROOT"
log "Poll interval: ${POLL_INTERVAL}s"

while true; do
  ready_count=$(find "$READY_DIR" -maxdepth 1 -name '*.md' -type f | wc -l | tr -d ' ')

  if [[ "$ready_count" -gt 0 ]]; then
    log "ready/ has ${ready_count} plan(s) — waiting for queue to drain..."
    sleep "$POLL_INTERVAL"
    continue
  fi

  log "ready/ is empty — scanning for unblocked Phase 2 tasks..."

  found_any=false
  while IFS=$'\t' read -r num name slug; do
    [[ -n "$num" ]] || continue

    if plan_is_done "$num"; then
      log "Task #${num} (${name}) — already done, skipping"
      continue
    fi

    if plan_is_defined "$num"; then
      log "Task #${num} (${name}) — plan already in defined/, skipping"
      continue
    fi

    found_any=true
    log "Task #${num}: ${name}"
    generate_plan "$num" "$name" "$slug"
  done < <(get_unblocked_tasks)

  if [[ "$found_any" == "false" ]]; then
    log "No new plans needed. All unblocked tasks already have plans in defined/ or are done."
  fi

  sleep "$POLL_INTERVAL"
done
