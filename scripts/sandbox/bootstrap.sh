#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/env.sh"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"

SANDBOX_PACKAGE_JSON="${OPENCODE_CONFIG_DIR}/package.json"
PLUGIN_TEMPLATE="${ROOT_DIR}/scripts/sandbox/templates/gaia-plugin.ts"
PLUGIN_TARGET="${OPENCODE_CONFIG_DIR}/plugins/gaia-plugin.ts"

if [[ ! -f "${OPENCODE_CONFIG}" ]]; then
  cat <<'EOF' > "${OPENCODE_CONFIG}"
{
  "$schema": "https://opencode.ai/config.json",
  "model": "opencode/kimi-k2.5-free",
  "small_model": "opencode/gpt-5-nano",
  "permission": {
    "bash": "ask",
    "edit": "ask",
    "write": "ask"
  },
  "server": {
    "hostname": "0.0.0.0",
    "port": 4096
  }
}
EOF
fi

if [[ ! -f "${SANDBOX_PACKAGE_JSON}" ]]; then
  cat <<'EOF' > "${SANDBOX_PACKAGE_JSON}"
{
  "name": "opencode-gaia-sandbox-config",
  "private": true,
  "type": "module",
  "dependencies": {
    "@opencode-ai/plugin": "1.1.53"
  }
}
EOF
fi

cp "${PLUGIN_TEMPLATE}" "${PLUGIN_TARGET}"

if [[ ! -d "${OPENCODE_CONFIG_DIR}/node_modules/@opencode-ai/plugin" ]]; then
  bun install --cwd "${OPENCODE_CONFIG_DIR}"
fi
