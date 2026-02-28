#!/usr/bin/env bash
# claude-queue.sh — Process plan files from .claude/plans/ready/
#
# Usage: ./scripts/claude-queue.sh
#
# Polls .claude/plans/ready/*.md, runs each plan via `claude -p`,
# handles rate limits with automatic retry, and moves files to
# done/ or failed/ based on outcome.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

READY_DIR="$PROJECT_ROOT/.claude/plans/ready"
DONE_DIR="$PROJECT_ROOT/.claude/plans/done"
FAILED_DIR="$PROJECT_ROOT/.claude/plans/failed"

POLL_INTERVAL=10
RATE_LIMIT_WAIT=300
MAX_TURNS=30

ALLOWED_TOOLS="Read,Edit,Write,Bash,Glob,Grep,Task,WebSearch,WebFetch"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"
}

run_plan() {
  local plan_file="$1"
  local plan_name
  plan_name="$(basename "$plan_file")"
  local plan_content
  plan_content="$(cat "$plan_file")"

  log "Processing: $plan_name"

  while true; do
    local output
    local exit_code=0

    output=$(cd "$PROJECT_ROOT" && claude -p "$plan_content" \
      --output-format json \
      --max-turns "$MAX_TURNS" \
      --allowedTools "$ALLOWED_TOOLS" \
      2>&1) || exit_code=$?

    # Parse JSON result using jq to classify outcome
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
    elif [[ "$is_error" == "parse_error" ]]; then
      status="parse_error"
    else
      status="success"
    fi

    case "$status" in
      rate_limit)
        local wait_secs="$RATE_LIMIT_WAIT"
        if [[ "$retry_after" -gt 0 ]]; then
          wait_secs="$retry_after"
        fi
        log "Rate limited on $plan_name. Waiting ${wait_secs}s before retry..."
        sleep "$wait_secs"
        log "Retrying $plan_name..."
        continue
        ;;
      usage_limit)
        log "Daily usage limit hit on $plan_name. Waiting ${RATE_LIMIT_WAIT}s before retry..."
        sleep "$RATE_LIMIT_WAIT"
        log "Retrying $plan_name..."
        continue
        ;;
      success)
        if [[ "$exit_code" -ne 0 ]]; then
          log "FAILURE: $plan_name exited with code $exit_code"
          mv "$plan_file" "$FAILED_DIR/$plan_name"
          echo "$output" > "$FAILED_DIR/${plan_name%.md}.log"
          log "Moved to failed/: $plan_name"
        else
          log "SUCCESS: $plan_name completed"
          mv "$plan_file" "$DONE_DIR/$plan_name"
          log "Moved to done/: $plan_name"
        fi
        return
        ;;
      error|parse_error|*)
        log "FAILURE: $plan_name — status=$status exit_code=$exit_code"
        mv "$plan_file" "$FAILED_DIR/$plan_name"
        echo "$output" > "$FAILED_DIR/${plan_name%.md}.log"
        log "Moved to failed/: $plan_name"
        return
        ;;
    esac
  done
}

log "Claude queue processor started"
log "Watching: $READY_DIR"
log "Poll interval: ${POLL_INTERVAL}s"

while true; do
  # Collect ready plan files, sorted alphabetically (bash 3.2 compatible)
  plan_files=()
  while IFS= read -r f; do
    plan_files+=("$f")
  done < <(find "$READY_DIR" -maxdepth 1 -name '*.md' -type f | sort)

  if [[ ${#plan_files[@]} -eq 0 ]]; then
    log "No plans found. Polling again in ${POLL_INTERVAL}s..."
    sleep "$POLL_INTERVAL"
    continue
  fi

  for plan_file in "${plan_files[@]}"; do
    # Skip if file was removed between listing and processing
    [[ -f "$plan_file" ]] || continue
    run_plan "$plan_file"
  done
done
