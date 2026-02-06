# Project GAIA

Project GAIA is an OpenCode orchestration plugin project.

It introduces an optional `gaia` mode that coordinates specialist agents for recon,
implementation, and project memory while keeping native `plan` and `build` workflows available.

The project is built to explore both ends of collaboration:

- Human-in-the-loop workflows where you can review and steer execution.
- Agentic workflows where you can let the system run with fewer interruptions.

## Status

Pre-alpha.

This project is in early development. Interfaces, file layout, and behavior can change quickly
and may break between updates.

## Development

```bash
nix develop
bun install
bun run check
```

The plugin package lives at `tools/opencode-gaia-plugin/`.

## Sandbox testing

Use the sandbox wrappers to avoid leaking host OpenCode configuration:

```bash
bash scripts/sandbox/bootstrap.sh
bash scripts/sandbox/list-free-models.sh
bash scripts/sandbox/run-smoke.sh
bash scripts/sandbox/run-gaia-init-smoke.sh
bash scripts/sandbox/run-harness-suite.sh basic
```

Start a served OpenCode instance from the sandbox:

```bash
bash scripts/sandbox/serve-web.sh
```

Run the agent-driven bug reproduction harness:

```bash
bash scripts/sandbox/run-bug-repro-harness.sh doc/bug-report.example.md
```

Run all harness stages in one command:

```bash
bash scripts/sandbox/run-harness-suite.sh full doc/bug-report.example.md
```

Use the plugin-only stage to validate local tool registration:

```bash
bash scripts/sandbox/run-harness-suite.sh plugin
```

For containerized use:

- Devcontainer: `.devcontainer/devcontainer.json`
- Docker compose: `docker compose -f docker-compose.sandbox.yml up --build`

See `doc/Sandbox_Harness.md` for details.

## Current focus

- Define and ship the MVP cut in `.gaia/plans/project-gaia-plugin-mvp-cut.md`
- Build the portable core plugin under `tools/opencode-gaia-plugin/`
- Keep host-specific wiring separate from core runtime logic
- Validate both supervised and agentic execution paths in a practical way

## Planning documents

- `.gaia/plans/project-gaia-plugin.md`
- `.gaia/plans/project-gaia-plugin-implementation-companion.md`
- `.gaia/plans/project-gaia-plugin-mvp-cut.md`
