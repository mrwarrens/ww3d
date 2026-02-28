#!/usr/bin/env bash
# pipeline-status.sh — Display pipeline status from pipeline.yaml.
#
# Usage: ./scripts/pipeline-status.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

PIPELINE_YAML="$PROJECT_ROOT/pipeline.yaml"
DEFINED_DIR="$PROJECT_ROOT/.claude/plans/defined"
READY_DIR="$PROJECT_ROOT/.claude/plans/ready"
DONE_DIR="$PROJECT_ROOT/.claude/plans/done"
ACCEPTED_DIR="$PROJECT_ROOT/.claude/plans/accepted"
FAILED_DIR="$PROJECT_ROOT/.claude/plans/failed"

python3 - "$PIPELINE_YAML" "$DEFINED_DIR" "$READY_DIR" "$DONE_DIR" "$ACCEPTED_DIR" "$FAILED_DIR" <<'PYEOF'
import sys, re, os

yaml_file = sys.argv[1]
defined_dir = sys.argv[2]
ready_dir = sys.argv[3]
done_dir = sys.argv[4]
accepted_dir = sys.argv[5]
failed_dir = sys.argv[6]

with open(yaml_file) as f:
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

def find_plan_file(directory, task):
    phase = task['phase']
    tid = task['id']
    slug = re.sub(r'[^a-z0-9]+', '-', task['name'].lower()).strip('-')
    pattern = re.compile(rf'^phase-{phase}-{tid}-.*\.md$')
    try:
        for f in os.listdir(directory):
            if pattern.match(f):
                return f
    except FileNotFoundError:
        pass
    return None

# Group by status
by_status = {
    'pending': [],
    'planned': [],
    'ready': [],
    'done': [],
    'accepted': [],
    'failed': [],
}

for tid, task in sorted(tasks.items()):
    s = task['status']
    by_status.setdefault(s, []).append(task)

# Get all phases
phases = sorted(set(t['phase'] for t in tasks.values() if t['phase']))

print()
print("PIPELINE STATUS")
print("=" * 60)

for phase in phases:
    phase_tasks = [t for t in tasks.values() if t['phase'] == phase]
    non_accepted = [t for t in phase_tasks if t['status'] != 'accepted']
    if not non_accepted:
        accepted_ids = [str(t['id']) for t in sorted(phase_tasks, key=lambda x: x['id'])]
        print(f"\n  Phase {phase}:  accepted ({', '.join(['#' + i for i in accepted_ids])})")
        continue

    print(f"\n  Phase {phase}:")

    order = ['failed', 'done', 'ready', 'planned', 'pending', 'accepted']
    for status in order:
        status_tasks = [t for t in phase_tasks if t['status'] == status]
        if not status_tasks:
            continue

        if status == 'accepted' and len(status_tasks) > 3:
            ids = ', '.join(['#' + str(t['id']) for t in sorted(status_tasks, key=lambda x: x['id'])])
            print(f"    {status:10s}  ({ids})")
            continue

        for task in sorted(status_tasks, key=lambda x: x['id']):
            info = f"#{task['id']}. {task['name']}"

            # Blocking deps for pending tasks
            if status == 'pending' and task['deps']:
                unmet = [d for d in task['deps'] if tasks.get(d, {}).get('status', '') not in ('done', 'accepted')]
                if unmet:
                    info += f"  [blocked by: {', '.join('#'+str(d) for d in unmet)}]"

            # Plan file location hints
            if status == 'planned':
                f = find_plan_file(defined_dir, task)
                if f:
                    info += f"  [review: defined/{f}]"
            elif status == 'ready':
                f = find_plan_file(ready_dir, task)
                if f:
                    info += f"  [ready: ready/{f}]"
            elif status == 'done':
                f = find_plan_file(done_dir, task)
                if f:
                    info += f"  [test: done/{f}]"
            elif status == 'failed':
                f = find_plan_file(failed_dir, task)
                if f:
                    info += f"  [log: failed/{f[:-3]}.log]"

            print(f"    {status:10s}  {info}")

print()
PYEOF
