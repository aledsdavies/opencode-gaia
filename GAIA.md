# GAIA North Star

Project GAIA builds a human-in-the-loop orchestration system.

The core idea is simple: individual specialist agents are useful but flawed. GAIA turns them into
a reliable pantheon by routing work, enforcing contracts, and bringing decisions back to humans at
the right checkpoints.

## Product Intent

- GAIA is not code-only. It should support product discovery, planning, implementation, validation,
  release readiness, and learning capture.
- Operator stays in the loop for direction, approval, and tradeoff decisions.
- Owner remains accountable for final decisions.

## Current Phase Focus

This phase defines the base system:

1. GAIA as the primary orchestrator.
2. `gaia_init` as the project bootstrap memory surface.

Subsystem depth is intentionally limited in this phase. The goal is to make GAIA's behavior and
memory model dependable before scaling to a fuller pantheon.

## Operating Principles

- Prefer explicit checkpoints over hidden autonomy.
- Keep work units small and reviewable.
- Use strict machine-readable contracts between roles.
- Preserve rationale and decisions so future sessions can continue safely.
- Expand capability by adding clear subsystem boundaries, not prompt sprawl.

## Required GAIA Documents

- `GAIA.md`: durable north star and orchestration principles.
- `.gaia/gaia-init.md`: project bootstrap context for active GAIA sessions.
- `.gaia/plans/project-gaia-plugin-mvp-cut.md`: current build boundary.
- `.gaia/plans/gaia-init-spec.md`: required `gaia_init` sections and fields.
