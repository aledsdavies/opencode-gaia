#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PORT="${OPENCODE_PORT:-4096}"

exec "${SCRIPT_DIR}/opencode.sh" web --hostname 0.0.0.0 --port "${PORT}"
