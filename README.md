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

The harness is a small Bun CLI (`tools/opencode-gaia-harness/`) that runs OpenCode in an
isolated `.sandbox/` environment. It lets developers evaluate GAIA behavior without inheriting
host-level OpenCode config.

Recommended dev flow:

1. Bootstrap isolated config and plugin wiring.
2. Run basic smoke checks.
3. Verify plugin tool path (`gaia_init`) and locked-mode guard.

```bash
bun run --cwd tools/opencode-gaia-harness cli bootstrap
bun run --cwd tools/opencode-gaia-harness cli suite basic
bun run --cwd tools/opencode-gaia-harness cli suite plugin
bun run --cwd tools/opencode-gaia-harness cli suite locked
```

Start a served OpenCode instance from the sandbox:

```bash
bun run --cwd tools/opencode-gaia-harness cli serve-web
```

Run the agent-driven bug reproduction harness:

```bash
bun run --cwd tools/opencode-gaia-harness cli bug doc/bug-report.example.md
```

Run all harness stages in one command:

```bash
bun run --cwd tools/opencode-gaia-harness cli suite full doc/bug-report.example.md
```

For containerized use:

- Devcontainer: `.devcontainer/devcontainer.json`
- Docker compose: `docker compose -f docker-compose.sandbox.yml up --build`

See `doc/Sandbox_Harness.md` for details.

Harness commands include built-in timeouts; tune with env vars such as
`OPENCODE_SMOKE_TIMEOUT_MS`, `OPENCODE_SMOKE_IDLE_TIMEOUT_MS`,
`OPENCODE_GAIA_INIT_TIMEOUT_MS`, and `OPENCODE_BUG_TIMEOUT_MS`.

Idle timeout vars are optional and default to disabled.

Commands print heartbeat progress lines while running (default every 10s). Override with
`OPENCODE_HEARTBEAT_MS` or command-specific heartbeat env vars.

## Current focus

- Define and ship the MVP cut in `.gaia/plans/project-gaia-plugin-mvp-cut.md`
- Build the portable core plugin under `tools/opencode-gaia-plugin/`
- Keep host-specific wiring separate from core runtime logic
- Validate both supervised and agentic execution paths in a practical way

## Planning documents

- `.gaia/plans/project-gaia-plugin.md`
- `.gaia/plans/project-gaia-plugin-implementation-companion.md`
- `.gaia/plans/project-gaia-plugin-mvp-cut.md`
