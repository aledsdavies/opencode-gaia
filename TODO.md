# Project GAIA TODO

This backlog groups active work by delivery horizon.

## MVP Remaining (Current Phase)

- [ ] Finalize HITL supervision progression behavior:
  - `full_review` (approve each material action)
  - `checkpoint` (approve at defined boundaries)
  - `agentic` (minimal interruption with policy gates)
- [ ] Define and implement rejection rationale loop:
  - capture rejection
  - ask why
  - persist rationale
  - re-plan with explicit delta
- [ ] Implement interrupt/re-plan policy when user guidance arrives mid-execution.
- [ ] Add recoverability runtime journal format (`.gaia/runtime/{session}/{work_unit}.ndjson`).
- [ ] Add reducer that reconstructs current orchestration state from runtime journal events.
- [ ] Define DEMETER status report contract for cross-subagent visibility.
- [ ] Integrate SDK v2 surfaces needed for permission/question/session/event flow.
- [ ] Add harness scenarios for rejection, interruption, and recovery/resume.
- [ ] Tune GAIA-to-HEPHAESTUS delegation scope so implementation tasks stay atomic and bounded.
- [ ] Reduce GAIA permission-denied noise by tightening prompt behavior to avoid forbidden write/edit
      attempts.
- [ ] Run sandbox tests in a fresh isolated workspace for each run to keep evaluations reproducible.
- [ ] Add lean orchestration quality harness track:
  - deterministic lean subagent wiring smoke (`gaia` + hidden specialists)
  - repeatable prompt-quality checks for GAIA delegation decisions
  - lightweight regression corpus for GAIA orchestration outcomes
- [ ] Finalize operation profile behavior for agent selection:
  - keep `lean` default (GAIA + ATHENA + HEPHAESTUS + DEMETER)
  - keep `full` mode for full roster orchestration
  - add user-defined custom agent combinations where GAIA remains mandatory
  - validate custom profile inputs and fallback behavior
  - keep specialist visibility hidden by default and project-configurable
- [ ] Enforce opt-in orchestration behavior end-to-end:
  - GAIA mode must activate only when explicitly selected
  - native OpenCode `plan` and `build` flows stay unchanged by default
  - when GAIA is not selected, plugin behavior should be effectively out of the way

## Post-MVP (Near-Term)

- [ ] Add stronger collaboration profile controls (`/profile`, cadence, review depth).
- [ ] Add richer policy controls for checkpoint thresholds and escalation.
- [ ] Add model preset strategy (budget/balanced/premium) based on observed usage.
- [ ] Expand DEMETER summaries with compact trend and risk snapshots.

## Later Revisions

- [ ] Expand from lean to fuller pantheon coverage.
- [ ] Support pantheon expansion with additional Greek gods where role boundaries remain clear and
      testable.
- [ ] Add user-defined named specialist agents beyond built-in roster while keeping GAIA mandatory
      as the orchestrator.
- [ ] Add advanced parallel orchestration manager.
- [ ] Add deeper replay/debug tooling over runtime journals.
- [ ] Add evaluation benchmarks for orchestration quality and HITL outcomes.

## Guardrails and Architecture Notes

- [ ] Keep plugin core portable and host-agnostic.
- [ ] Keep project-specific docs in `doc/` and operational artifacts in `.gaia/`.
- [ ] Keep plugin defaults project-agnostic. Do not hardcode this repository's
      specification path as a plugin default.
- [ ] Keep plugin self-contained: no required dependency on repository-local docs for core behavior.
