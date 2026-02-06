# OpenCode Sandbox Harness

This document describes a clean, reproducible OpenCode harness setup for GAIA development.

## Goals

- Run OpenCode in a sandbox that does not inherit host config.
- Support local smoke testing and agent-driven bug reproduction flows.
- Provide a devcontainer and Docker path for reproducible execution.

## Isolation Model

All harness scripts route OpenCode through `scripts/sandbox/opencode.sh`, which sets:

- `HOME=.sandbox/home`
- `XDG_CONFIG_HOME=.sandbox/home/.config`
- `XDG_CACHE_HOME=.sandbox/home/.cache`
- `XDG_DATA_HOME=.sandbox/home/.local/share`
- `OPENCODE_CONFIG_DIR=.sandbox/opencode`
- `OPENCODE_CONFIG=.sandbox/opencode/opencode.jsonc`
- `OPENCODE_DISABLE_CLAUDE_CODE=1`

This avoids accidental use of host-level OpenCode or Claude config.

## Default Sandbox Config

`scripts/sandbox/bootstrap.sh` creates `.sandbox/opencode/opencode.jsonc` if missing.
It also syncs the GAIA local plugin template into `.sandbox/opencode/plugins/gaia-plugin.ts`
and installs `@opencode-ai/plugin` for local tool registration.

Default profile:

- `model`: `opencode/kimi-k2.5-free`
- `small_model`: `opencode/gpt-5-nano`
- `permission`: ask for `bash`, `edit`, `write`
- `server`: host `0.0.0.0`, port `4096`

## Commands

- Bootstrap sandbox:

```bash
bash scripts/sandbox/bootstrap.sh
```

- Run OpenCode with sandbox env:

```bash
bash scripts/sandbox/opencode.sh
```

- Start web server:

```bash
bash scripts/sandbox/serve-web.sh
```

- Start API server:

```bash
bash scripts/sandbox/serve-api.sh
```

- Run smoke prompt:

```bash
bash scripts/sandbox/run-smoke.sh
```

`run-smoke.sh` defaults to a non-interactive safe permission profile:

- allow: `bash`, `read`
- deny: `edit`, `write`

Override with `OPENCODE_PERMISSION` when needed.

- List currently available free models:

```bash
bash scripts/sandbox/list-free-models.sh
```

- Run bug repro harness with attached report:

```bash
bash scripts/sandbox/run-bug-repro-harness.sh doc/bug-report.example.md
```

`run-bug-repro-harness.sh` defaults to an implementation profile:

- allow: `bash`, `read`, `edit`, `write`

Override with `OPENCODE_PERMISSION` if you want stricter behavior.

- Run GAIA plugin registration smoke test:

```bash
bash scripts/sandbox/run-gaia-init-smoke.sh
```

This confirms local plugin loading and custom tool execution by invoking `gaia_init`
through an agentic run and verifying `.gaia/gaia-init.md` was created.

- Run harness suite modes:

```bash
bash scripts/sandbox/run-harness-suite.sh basic
bash scripts/sandbox/run-harness-suite.sh plugin
bash scripts/sandbox/run-harness-suite.sh bug doc/bug-report.example.md
bash scripts/sandbox/run-harness-suite.sh full doc/bug-report.example.md
```

The bug harness prompt enforces reproducer-first TDD, low-mock tests, and exact assertions.

## Devcontainer

Use `.devcontainer/devcontainer.json`.

- Image base: Node 22
- Installs: Bun and OpenCode CLI (`opencode-ai@1.1.53`)
- Forwards port `4096`
- Post-create: bootstrap sandbox, install plugin deps, run checks

## Docker Compose

Headless, browser-accessible sandbox server:

```bash
docker compose -f docker-compose.sandbox.yml up --build
```

Then open the served OpenCode web UI on port `4096`.

## Notes

- Current harness validates environment and workflows first.
- GAIA tool/plugin integration in OpenCode runtime should be layered on top of this sandbox.

## Growth roadmap

Grow this harness in small stages so confidence increases with each unit:

1. `L0` Environment confidence
   - bootstrap sandbox
   - list free models
   - run smoke prompt
2. `L1` Runtime confidence
   - call `runGaiaWorkUnit` and `runDelegateGaiaTool` in automated tests
   - validate `.gaia/<unit>` artifacts and parse metadata
3. `L2` Plugin loading confidence
   - load GAIA plugin from `.opencode/plugins/`
   - verify custom tool registration in a real OpenCode session (`gaia_init`, `delegate_gaia`)
4. `L3` Agentic workflow confidence
   - run bug-repro harness end-to-end on sample bug reports
   - ensure reproducer-first TDD and exact assertions
5. `L4` Regression confidence
   - maintain a `doc/bug-reports/` corpus
   - replay corpus in CI/nightly container runs
