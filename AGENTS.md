# Project GAIA Agent Rules

This repository is pre-alpha. Keep changes small, typed, and easy to verify.

## Version Control

- This is a JJ project. Use JJ-first workflows for local version control operations.

## Development Environment

- Enter the environment with `nix develop`.
- Use Bun for package management, scripts, and tests.
- Prefer `bun install`, `bun run <script>`, and `bun test`.

## Language and Typing

- Use TypeScript for plugin code.
- Keep strict TypeScript enabled.
- Do not introduce explicit `any`.
- Use `unknown` plus narrowing/validation at dynamic boundaries.

## Testing Approach

- Follow TDD: write/adjust a failing test first, then implement, then refactor.
- For bug reports (stack traces, logs, or repro steps), add a reproducer test first before fixing the bug.
- Use Bun's built-in test runner for this project unless a clear need appears.
- Prefer low-mock, low-orchestration tests with real values.
- Prefer exact assertions over partial-response checks.

## Scope Discipline

- Respect `.gaia/plans/project-gaia-plugin-mvp-cut.md` as the active execution boundary.
- Keep plugin core portable (`tools/opencode-gaia-plugin/`) and host wiring separate.
- Do not break native `plan` and `build` workflows while adding `gaia` mode.

## Validation

- Before finishing a change, run at least:
  - `bun run typecheck`
  - `bun test`
