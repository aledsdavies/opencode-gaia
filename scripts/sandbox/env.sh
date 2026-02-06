#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SANDBOX_DIR="${ROOT_DIR}/.sandbox"

export HOME="${SANDBOX_DIR}/home"
export XDG_CONFIG_HOME="${HOME}/.config"
export XDG_CACHE_HOME="${HOME}/.cache"
export XDG_DATA_HOME="${HOME}/.local/share"

export OPENCODE_CONFIG_DIR="${SANDBOX_DIR}/opencode"
export OPENCODE_CONFIG="${OPENCODE_CONFIG_DIR}/opencode.jsonc"

export OPENCODE_DISABLE_CLAUDE_CODE=1
export OPENCODE_DISABLE_CLAUDE_CODE_PROMPT=1
export OPENCODE_DISABLE_CLAUDE_CODE_SKILLS=1

mkdir -p "${HOME}" "${XDG_CONFIG_HOME}" "${XDG_CACHE_HOME}" "${XDG_DATA_HOME}"
mkdir -p "${OPENCODE_CONFIG_DIR}" "${OPENCODE_CONFIG_DIR}/plugins"
