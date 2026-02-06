# opencode-gaia-plugin Agent Notes

This package is pre-alpha and portability-first.

## Rules

- Keep code in strict TypeScript.
- Do not introduce explicit `any`.
- Validate unknown/dynamic input at boundaries.
- Follow TDD with Bun test.
- Keep core runtime free of host-specific imports.

## Validation

- `bun run typecheck`
- `bun test`
