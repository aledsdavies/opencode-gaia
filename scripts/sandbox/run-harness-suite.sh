#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MODE="${1:-basic}"

case "${MODE}" in
  basic)
    bash "${SCRIPT_DIR}/bootstrap.sh"
    bash "${SCRIPT_DIR}/list-free-models.sh"
    bash "${SCRIPT_DIR}/run-smoke.sh" "Agentic smoke test: confirm sandbox context and list exactly 3 repository files."
    ;;
  plugin)
    bash "${SCRIPT_DIR}/bootstrap.sh"
    bash "${SCRIPT_DIR}/run-gaia-init-smoke.sh"
    ;;
  bug)
    bash "${SCRIPT_DIR}/bootstrap.sh"
    bash "${SCRIPT_DIR}/run-bug-repro-harness.sh" "${2:-doc/bug-report.example.md}"
    ;;
  full)
    bash "${SCRIPT_DIR}/bootstrap.sh"
    bash "${SCRIPT_DIR}/list-free-models.sh"
    bash "${SCRIPT_DIR}/run-smoke.sh" "Agentic smoke test: confirm sandbox context and list exactly 3 repository files."
    bash "${SCRIPT_DIR}/run-gaia-init-smoke.sh"
    bash "${SCRIPT_DIR}/run-bug-repro-harness.sh" "${2:-doc/bug-report.example.md}"
    ;;
  *)
    printf 'Unknown harness mode: %s\n' "${MODE}" >&2
    printf 'Usage: %s [basic|plugin|bug|full] [bug-report-file]\n' "$0" >&2
    exit 1
    ;;
esac
