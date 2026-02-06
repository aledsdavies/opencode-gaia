# opencode-gaia-plugin Agent Notes

This package is pre-alpha and portability-first.

## Rules

- Keep code in strict TypeScript.
- Do not introduce explicit `any`.
- Validate unknown/dynamic input at boundaries.
- Follow TDD with Bun test.
- For bug reports (stack traces, logs, or repro steps), start with a reproducer test.
- Keep tests low-mock, low-orchestration, and based on real values.
- Prefer exact assertions over partial-response checks.
- Keep core runtime free of host-specific imports.

## Validation

- `bun run typecheck`
- `bun test`
