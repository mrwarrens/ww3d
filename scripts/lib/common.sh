#!/usr/bin/env bash
# scripts/lib/common.sh — Shared functions for plan-feeder.sh and claude-queue.sh
#
# Source this file: source "$(dirname "${BASH_SOURCE[0]}")/lib/common.sh"

# ---------------------------------------------------------------------------
# Config (can be overridden by sourcing script before sourcing this file)
# ---------------------------------------------------------------------------
POLL_INTERVAL="${POLL_INTERVAL:-10}"
RATE_LIMIT_WAIT="${RATE_LIMIT_WAIT:-300}"
MAX_TURNS="${MAX_TURNS:-30}"
ALLOWED_TOOLS="${ALLOWED_TOOLS:-Read,Edit,Write,Bash,Glob,Grep,Task,WebSearch,WebFetch}"

PIPELINE_YAML="${PROJECT_ROOT}/pipeline.yaml"
LOCK_FILE="${PROJECT_ROOT}/.claude/pipeline.lock"

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"
}

# ---------------------------------------------------------------------------
# Lock file (prevents two scripts from modifying pipeline.yaml simultaneously)
# ---------------------------------------------------------------------------
acquire_lock() {
  local max_wait="${1:-30}"
  local waited=0
  while ! mkdir "$LOCK_FILE" 2>/dev/null; do
    if [[ "$waited" -ge "$max_wait" ]]; then
      log "ERROR: Could not acquire lock after ${max_wait}s. Stale lock at $LOCK_FILE?"
      return 1
    fi
    sleep 1
    waited=$((waited + 1))
  done
}

release_lock() {
  rmdir "$LOCK_FILE" 2>/dev/null || true
}

# ---------------------------------------------------------------------------
# YAML helpers (Python-based — no yq dependency required)
# ---------------------------------------------------------------------------

# read_yaml_status <id>
# Prints the status field for the task with the given id, or "not_found".
read_yaml_status() {
  local id="$1"
  python3 - "$PIPELINE_YAML" "$id" <<'PYEOF'
import sys, re

yaml_file = sys.argv[1]
task_id = int(sys.argv[2])

with open(yaml_file) as f:
    content = f.read()

# Split into task blocks (each starting with "  - id:")
blocks = re.split(r'\n  - id:', content)
for block in blocks[1:]:
    lines = block.strip().splitlines()
    try:
        bid = int(lines[0].strip())
    except (ValueError, IndexError):
        continue
    if bid == task_id:
        for line in lines[1:]:
            m = re.match(r'\s*status:\s*(\S+)', line)
            if m:
                print(m.group(1))
                sys.exit(0)
        print("no_status")
        sys.exit(0)

print("not_found")
PYEOF
}

# update_yaml_status <id> <new_status>
# Updates the status field for the task with the given id in pipeline.yaml.
# Uses a lock to prevent concurrent writes.
update_yaml_status() {
  local id="$1"
  local new_status="$2"

  acquire_lock 30 || return 1

  python3 - "$PIPELINE_YAML" "$id" "$new_status" <<'PYEOF'
import sys, re

yaml_file = sys.argv[1]
task_id = int(sys.argv[2])
new_status = sys.argv[3]

with open(yaml_file) as f:
    content = f.read()

# Split into task blocks
blocks = re.split(r'\n  - id:', content)
if len(blocks) < 2:
    print(f"ERROR: no tasks found in {yaml_file}", file=sys.stderr)
    sys.exit(1)

result_blocks = [blocks[0]]
found = False
for block in blocks[1:]:
    lines = block.splitlines()
    try:
        bid = int(lines[0].strip())
    except (ValueError, IndexError):
        result_blocks.append(block)
        continue
    if bid == task_id:
        found = True
        # Replace or insert the status line
        new_lines = []
        replaced = False
        for line in lines:
            if re.match(r'\s*status:\s*', line):
                # preserve leading whitespace
                indent = len(line) - len(line.lstrip())
                new_lines.append(' ' * indent + f'status: {new_status}')
                replaced = True
            else:
                new_lines.append(line)
        if not replaced:
            new_lines.append(f'    status: {new_status}')
        result_blocks.append('\n'.join(new_lines))
    else:
        result_blocks.append(block)

if not found:
    print(f"ERROR: task id {task_id} not found in {yaml_file}", file=sys.stderr)
    sys.exit(1)

new_content = '\n  - id:'.join(result_blocks)
with open(yaml_file, 'w') as f:
    f.write(new_content)
PYEOF
  local exit_code=$?
  release_lock
  return $exit_code
}

# get_plannable_tasks
# Prints tab-separated "id\tphase\tname\tslug" for each task that is pending
# AND all its deps are done or accepted.
get_plannable_tasks() {
  python3 - "$PIPELINE_YAML" <<'PYEOF'
import sys, re

with open(sys.argv[1]) as f:
    content = f.read()

# Parse all tasks
tasks = {}
blocks = re.split(r'\n  - id:', content)
for block in blocks[1:]:
    lines = block.strip().splitlines()
    try:
        bid = int(lines[0].strip())
    except (ValueError, IndexError):
        continue
    task = {'id': bid, 'phase': None, 'name': '', 'status': 'pending', 'deps': []}
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
        m = re.match(r'\s*deps:\s*\[([^\]]*)\]', line)
        if m:
            dep_str = m.group(1)
            task['deps'] = [int(x.strip()) for x in dep_str.split(',') if x.strip()]
    tasks[bid] = task

TERMINAL = {'done', 'accepted'}

for tid, task in sorted(tasks.items()):
    if task['status'] != 'pending':
        continue
    # Check all deps are done or accepted
    if not all(tasks.get(d, {}).get('status', '') in TERMINAL for d in task['deps']):
        continue
    slug = re.sub(r'[^a-z0-9]+', '-', task['name'].lower()).strip('-')
    print(f"{task['id']}\t{task['phase']}\t{task['name']}\t{slug}")
PYEOF
}

# get_ready_tasks
# Prints tab-separated "id\tphase\tname\tslug" for each task with status=ready.
get_ready_tasks() {
  python3 - "$PIPELINE_YAML" <<'PYEOF'
import sys, re

with open(sys.argv[1]) as f:
    content = f.read()

tasks = {}
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
    tasks[bid] = task

for tid, task in sorted(tasks.items()):
    if task['status'] != 'ready':
        continue
    slug = re.sub(r'[^a-z0-9]+', '-', task['name'].lower()).strip('-')
    print(f"{task['id']}\t{task['phase']}\t{task['name']}\t{slug}")
PYEOF
}

# ---------------------------------------------------------------------------
# Claude execution
# ---------------------------------------------------------------------------

# classify_output <json_output> <exit_code>
# Sets global variable CLAUDE_STATUS to: success | rate_limit | usage_limit | error
classify_output() {
  local output="$1"
  local exit_code="${2:-0}"

  local is_error result retry_after
  is_error=$(echo "$output" | jq -r '.is_error // false' 2>/dev/null || echo "parse_error")
  result=$(echo "$output"   | jq -r '.result   // ""'    2>/dev/null || echo "")
  CLAUDE_RETRY_AFTER=$(echo "$output" | jq -r '.retry_after // 0' 2>/dev/null || echo "0")

  if echo "$result" | grep -qi "hit your limit\|you've hit"; then
    CLAUDE_STATUS="usage_limit"
  elif echo "$result" | grep -qi "rate.limit\|rate_limit\|429\|too many requests"; then
    CLAUDE_STATUS="rate_limit"
  elif [[ "$is_error" == "true" ]]; then
    CLAUDE_STATUS="error"
  elif [[ "$is_error" == "parse_error" || "$exit_code" -ne 0 ]]; then
    CLAUDE_STATUS="error"
  else
    CLAUDE_STATUS="success"
  fi
}

# run_claude <prompt>
# Runs claude -p with the given prompt. On rate/usage limit, waits and retries.
# On success or terminal failure, sets CLAUDE_STATUS and CLAUDE_OUTPUT and returns.
run_claude() {
  local prompt="$1"

  while true; do
    local output exit_code=0
    output=$(cd "$PROJECT_ROOT" && env -u CLAUDECODE claude -p "$prompt" \
      --output-format json \
      --max-turns "$MAX_TURNS" \
      --allowedTools "$ALLOWED_TOOLS" \
      2>&1) || exit_code=$?

    CLAUDE_OUTPUT="$output"
    classify_output "$output" "$exit_code"

    case "$CLAUDE_STATUS" in
      rate_limit|usage_limit)
        local wait_secs="$RATE_LIMIT_WAIT"
        if [[ "$CLAUDE_RETRY_AFTER" -gt 0 ]]; then
          wait_secs="$CLAUDE_RETRY_AFTER"
        fi
        log "Rate/usage limited. Waiting ${wait_secs}s..."
        sleep "$wait_secs"
        log "Retrying..."
        continue
        ;;
      *)
        return
        ;;
    esac
  done
}
