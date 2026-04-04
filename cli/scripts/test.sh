#!/usr/bin/env bash
# Run each test file in its own bun process to prevent module state pollution.
# bun's mock.module() permanently modifies the shared module registry, causing
# mock leaks between test files (bun issue #12823). Per-process isolation is
# the only reliable workaround until bun adds native file-level mock scoping.
#
# Uses xargs -P for parallel execution (8 workers by default).
set -euo pipefail

cd "$(dirname "$0")/.."

PARALLEL="${BUN_TEST_PARALLEL:-8}"
FAIL_DIR=$(mktemp -d)
trap 'rm -rf "$FAIL_DIR"' EXIT

# Collect test files
files=()
for f in src/__tests__/*.test.ts src/pipeline-machine/__tests__/*.test.ts; do
  [ -f "$f" ] && files+=("$f")
done
total=${#files[@]}

# Run each file in its own bun process, up to $PARALLEL at a time.
# On failure, touch a marker file so we can count failures after.
run_one() {
  local f="$1"
  if ! bun test "$f" 2>&1; then
    touch "$FAIL_DIR/$(basename "$f")"
  fi
}
export -f run_one
export FAIL_DIR

printf '%s\0' "${files[@]}" | xargs -0 -n1 -P"$PARALLEL" bash -c 'run_one "$1"' _

failed=$(find "$FAIL_DIR" -type f | wc -l | tr -d ' ')

echo ""
if [ "$failed" -gt 0 ]; then
  echo "FAILED: $failed/$total test files had failures:"
  for marker in "$FAIL_DIR"/*; do
    [ -f "$marker" ] && echo "  - $(basename "$marker")"
  done
  exit 1
else
  echo "ALL $total test files passed"
fi
