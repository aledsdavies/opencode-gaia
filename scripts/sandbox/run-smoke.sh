#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MODEL="${OPENCODE_SMOKE_MODEL:-opencode/kimi-k2.5-free}"
PROMPT="${1:-Verify sandbox setup, list relevant files, and suggest one next coding unit.}"
PERMISSION_PROFILE='{"bash":"allow","read":"allow","edit":"deny","write":"deny"}'

export OPENCODE_PERMISSION="${OPENCODE_PERMISSION:-${PERMISSION_PROFILE}}"

exec "${SCRIPT_DIR}/opencode.sh" run --agent build --model "${MODEL}" "${PROMPT}"
