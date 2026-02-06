#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MODEL="${OPENCODE_SMOKE_MODEL:-opencode/kimi-k2.5-free}"

export OPENCODE_PERMISSION='{"bash":"allow","read":"allow","edit":"allow","write":"allow"}'

bash "${SCRIPT_DIR}/bootstrap.sh"

"${SCRIPT_DIR}/opencode.sh" run --agent build --model "${MODEL}" \
  "Use the gaia_init tool now with refresh=false. Return only whether it succeeded."

INIT_PATH="$(cd "${SCRIPT_DIR}/../.." && pwd)/.gaia/gaia-init.md"

if [[ ! -f "${INIT_PATH}" ]]; then
  printf 'gaia_init smoke failed: %s not found\n' "${INIT_PATH}" >&2
  exit 1
fi

printf 'gaia_init smoke succeeded: %s\n' "${INIT_PATH}"
