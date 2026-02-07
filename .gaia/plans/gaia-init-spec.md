# GAIA Init Specification (Phase Baseline)

> Status: Draft
> Scope: Base GAIA + `gaia_init` (before full subsystem rollout)

## Purpose

`gaia_init` captures the minimum durable context GAIA needs to orchestrate work well across product
and engineering tasks.

It is not a replacement for `AGENTS.md`.

## Required Sections

## 1) Mission
- One-sentence mission for the current project phase.
- The primary outcome this phase must deliver.

## 2) Product Context
- Target users or operators.
- Problem being solved.
- Success signals (what "better" means).

## 3) Constraints
- Hard constraints (technical, legal, timeline, or platform).
- Guardrails that GAIA must not break.

## 4) Non-Goals
- Explicitly out-of-scope items for this phase.

## 5) Risk Tolerance
- One of: `low`, `medium`, `high`.
- Notes on what requires explicit human checkpoint approval.

## 6) Decision Model
- Operator responsibilities (interactive steering and approvals).
- Owner responsibilities (final accountability and scope decisions).
- Required handoff shape for decisions:
  - Context
  - Options
  - Recommendation
  - Action needed

## 7) Quality Bar
- Verification baseline for this phase.
- Test policy expectations (for code-related work).
- Evidence format expected in status updates.

## 8) Communication Contract
- Required work-unit fields for handoff between GAIA and specialists:
  - `work_unit`
  - `objective`
  - `inputs`
  - `constraints`
  - `done_when`
  - `open_questions`
- Required result fields:
  - `status`
  - `summary`
  - `evidence`
  - `risks`
  - `next_actions`

## 9) Project Notes
- Repo-specific conventions.
- Domain vocabulary.
- Known sharp edges and historical pitfalls.

## Usage Rules

- `gaia_init` may create or refresh sections, but must not silently overwrite explicit human edits.
- Additive updates are preferred over destructive rewrites.
- If required fields are missing, GAIA should ask targeted questions before deep execution.
