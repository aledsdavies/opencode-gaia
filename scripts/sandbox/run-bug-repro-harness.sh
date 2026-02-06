#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MODEL="${OPENCODE_HARNESS_MODEL:-opencode/kimi-k2.5-free}"
PERMISSION_PROFILE='{"bash":"allow","read":"allow","edit":"allow","write":"allow"}'

export OPENCODE_PERMISSION="${OPENCODE_PERMISSION:-${PERMISSION_PROFILE}}"

if [[ $# -lt 1 ]]; then
  printf 'Usage: %s <bug-report-file>\n' "$0" >&2
  exit 1
fi

BUG_REPORT_FILE="$1"

if [[ ! -f "${BUG_REPORT_FILE}" ]]; then
  printf 'Bug report file not found: %s\n' "${BUG_REPORT_FILE}" >&2
  exit 1
fi

PROMPT="You are running a bug reproduction harness. Read the attached bug report and follow this flow exactly: (1) write a failing reproducer test using real values and exact assertions, (2) implement the minimal fix, (3) run tests, (4) summarize why the bug is now covered against regression. Keep tests low-mock and low-orchestration."

exec "${SCRIPT_DIR}/opencode.sh" run --agent build --model "${MODEL}" -f "${BUG_REPORT_FILE}" "${PROMPT}"
