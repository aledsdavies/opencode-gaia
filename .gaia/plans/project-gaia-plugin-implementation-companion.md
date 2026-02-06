# Implementation Companion: Project GAIA Plugin

> **Status**: Skeleton draft (living document)
> **Created**: 2026-02-06
> **Paired plan**: `.gaia/plans/project-gaia-plugin.md`
> **MVP cut**: `.gaia/plans/project-gaia-plugin-mvp-cut.md`

---

## Purpose

This document captures implementation details that are intentionally too low-level for the main
plan. The two documents are maintained together:

1. `project-gaia-plugin.md` = what and why.
2. `project-gaia-plugin-implementation-companion.md` = how.

Planning is not complete unless both are updated.

Execution starts from the MVP cut document and this companion should reflect implementation
mechanics for that cut before wider P2/P3 expansion.

## Canonical References (Main Plan)

This companion does not redefine canonical schemas. Use the main plan as source of truth for:

- `### Agent Contracts` (envelope + per-agent data)
- `#### src/tools/delegate.ts — The Delegation Tool` (args + return metadata)
- `### Collaboration Knobs (Canonical)` (profile/mode/visibility/cadence/review)
- `### Instruction Layering (AGENTS + GAIA + Skills)` (instruction precedence)

---

## Guardrails

- Keep native OpenCode `plan` and `build` behavior intact.
- GAIA orchestration is opt-in, not forced.
- Keep plugin core VCS-agnostic (no personal JJ-only assumptions in defaults).
- Use BYO skills/tools: suggest when useful, never hard-require named packages.
- Keep prompts lean; enforce behavior with hooks/tools/state instead of prompt bloat.

## Extractability boundary:
- Core plugin code must remain portable and repository-agnostic.
- Dotfiles/Nix integration remains a host adapter layer.
- No core runtime dependency on `modules/editors/**` or Home Manager specifics.

---

## Feasibility Map (Feature -> Mechanism)

| Feature | Mechanism | Source of truth | Phase |
|---------|-----------|-----------------|-------|
| GAIA orchestrator mode | Agent definition + orchestration prompts | config/markdown + plugin context injection | P1 |
| Sub-agent delegation | `delegate_gaia` tool | plugin tool | P1 |
| Background parallel runs | `delegate_gaia(background=true)` + `collect_results` | plugin tool | P2 |
| Collaboration profiles | runtime state + command handlers | plugin commands/hooks | P2 |
| Permission auto-approve by mode | `permission.asked` event handling | plugin hook | P2 |
| Pair pause loop | `tool.execute.after` + pause state | plugin hook | P2 |
| Rejection feedback prompt | permission reply event + prompt prefill | plugin hook + tui client | P2 |
| Contract envelope parsing | shared JSON envelope parser + retry path | plugin runtime | P1 |
| Decision capture for DEMETER | question/rejection capture buffer | plugin hook + delegate prompt injection | P1 |
| Work-unit docs (`.gaia/{unit}`) | `plan_gaia` + DEMETER writes | plugin tool + sub-agent contract | P1 |
| GAIA bootstrap memory (`/gaia-init`) | command + template generation/update | plugin command + `.gaia/gaia-init.md` | P1 |
| Native plan/build non-overlap | explicit routing rules + no override hooks | plan + integration tests | P1 |

Legend: P1 = minimal viable implementation, P2 = follow-up.

---

## Config vs Plugin Responsibilities

## Config/Markdown (declarative)
- Agent definitions and baseline prompts.
- Command metadata when supported declaratively.
- Static defaults (`model`, temperature, prompt append, permissions baseline).

## Plugin Runtime (behavioral)
- Delegation mechanics and session continuity.
- Dynamic permission handling by collaboration mode.
- Decision/rejection capture and DEMETER payload injection.
- Pair-loop pauses, check-in packet generation, activity streaming.

## Hybrid
- Collaboration profile defaults loaded from `.gaia/config.jsonc`.
- Runtime command execution mutates in-memory collaboration state.

---

## Collaboration State Machine (Skeleton)

Knob definitions and allowed values are canonical in the main plan's
`### Collaboration Knobs (Canonical)` section.

Primary runtime state:
- `profile`: `pair_live|pair_batched|pair_ramp|agentic_checkpoint|agentic_full|standard`
- `mode`: `supervised|autopilot|locked`
- `visibility`: `live|checkpoint|quiet`
- `interaction`: `standard|pair`
- `checkinCadence`: `step|batch|wave|milestone`
- `reviewDepth`: `inline|diff|risk|deep_repo`
- `approvedWave`: `{ active: boolean; waveId?: string }`

Core transitions (initial draft):
- `/profile X` -> apply full mapping atomically.
- `/pair` -> `mode=supervised`, `visibility=live`, `interaction=pair`, cadence tuned for rapid feedback.
- `/next` -> resumes execution only when paused by pair loop/checkpoint.
- `/autopilot` -> clears pending supervised gates, keeps dangerous denylist enforced.
- `/locked` -> blocks write/edit and non-readonly bash.
- rejection event -> clears `approvedWave` and records decision payload.

Guard conditions:
- Dangerous denylist is never auto-approved.
- Locked mode cannot delegate to write-capable execution paths.
- Pair pause only triggers for mutable tool batches.
- Wave approval never crosses work-unit boundaries.

Wave boundary default:
- `implementation+basic_checks` (implementation returns `ok=true` and baseline checks pass).

---

## Command Handling Strategy

## Control commands
- `/autopilot`, `/supervised`, `/locked`
- `/live`, `/checkpoint`, `/quiet`
- `/pair`, `/standard`, `/next`
- `/profile ...`, `/cadence ...`, `/review ...`

## Bootstrap command
- `/gaia-init`
  - Creates `.gaia/gaia-init.md` if missing.
  - Refreshes sections from template if file exists.
  - Optionally proposes promotions from `.gaia/learnings.md`.
  - Never overwrites user-written sections silently.

## Delegation metadata requirement

`delegate_gaia` and `collect_results` should return metadata-rich payloads for resilience:

- `task_id`
- `session_id`
- `model_used`
- `raw_text`
- `parsed_json`
- `parse_error`
- `status`

`context_aids` is the stable input field (`skills`, `tools`, `files`).

## `plan_gaia` API binding

Implement exactly the operation set defined in the main plan section
`#### src/tools/plan.ts — Minimal Filesystem API (Canonical)`.

Enforcement rule:
- Any DEMETER write path must resolve through `plan_gaia`-equivalent `.gaia/`-scoped operations.

---

## GAIA Init + Learnings Lifecycle

Role split:
- `.gaia/learnings.md`: append-only discoveries and reusable lessons.
- `.gaia/gaia-init.md`: curated always-on orchestration guidance (GAIA-specific init memory).
- `GAIA.md` (optional, repo root): GAIA-specific instructions for this repository.

Lifecycle:
1. `/gaia-init` seeds `gaia-init.md` from template.
2. DEMETER adds session learnings to `learnings.md`.
3. GAIA/DEMETER proposes stable entries for promotion.
4. User accepts/rejects promotions; accepted items go to `gaia-init.md`.

GAIA instruction integration:
- If `GAIA.md` exists, load it as optional GAIA-specific instruction context.
- Keep concise durable constraints in `GAIA.md`; keep session-derived guidance in `gaia-init.md`.
- For long guides, prefer project skills for lazy loading and keep only short routing notes in
  `GAIA.md`.

Open implementation detail:
- Promotion UX (explicit command confirmation vs inline checkpoint choice).

---

## Permission Gating Strategy

- Baseline permissions from matrix.
- In supervised mode: default `ask`, with optional wave-scoped temporary auto-approve.
- In autopilot mode: auto-approve non-dangerous actions.
- In locked mode: deny all mutations, allow read-only paths.
- Dangerous denylist always blocked regardless of mode.

Autopilot safety rails:
- `maxToolCallsPerWave`
- `maxWaveMinutes`
- `maxBackgroundTasks`
- `consecutiveFailureLimit` with fallback (`checkpoint` by default)

---

## Pair Loop + Check-in Packet

Per pause packet should include:
1. Files changed
2. Commands run + key outcomes
3. Why this batch happened
4. Risk note
5. Next intended action

Accepted feedback intents:
- `/next`
- `undo last`
- `change approach ...`
- `review this deeper`

Each feedback event is logged to DEMETER decisions as `pair_feedback`.

---

## Rejection Feedback + DEMETER Flow

Flow:
1. Permission rejected.
2. Plugin prefills prompt with `Rejected <tool> because: `.
3. User explains reason in natural language.
4. GAIA adapts next delegation.
5. Decision buffer records event as `rejection`.
6. DEMETER writes to `.gaia/{work-unit}/decisions.md`.

---

## VCS-Agnostic Contract

- MINERVA returns `vcs_type`: `jj|git|none`.
- GAIA passes `vcs_type` to all relevant delegations.
- Revision output contract uses neutral `revision_ids` (JJ change id or git SHA).
- Plugin core does not encode personal workflow assumptions.
- Repo-specific workflow notes go into `.gaia/gaia-init.md` or `.gaia/config.jsonc`.

---

## Non-Overlap Contract (Native Plan/Build)

Must remain true:
- User can run native `plan` unchanged.
- User can run native `build` unchanged.
- GAIA mode only activates when explicitly selected.
- No global hook should rewrite native agent prompts or route native calls through GAIA.

Validation checklist:
- Start session in `plan`: no GAIA orchestration hooks trigger.
- Start session in `build`: no GAIA delegation required.
- Start session in `gaia`: orchestration features active.

---

## Portability Validation (Core vs Host)

Core package checks:
- Build `tools/opencode-gaia-plugin/` outside this dotfiles tree.
- Confirm no imports/references to `modules/editors/**` from core runtime files.
- Load plugin via direct file path in OpenCode without Nix/Home Manager.

Host adapter checks:
- Dotfiles module wiring only handles installation/registration and defaults.
- Repo-specific policy files (`GAIA.md`, `.gaia/gaia-init.md`) remain optional inputs.

---

## Minimal Phase-1 Slice (Execution Target)

Ship first:
1. Config loader + model resolution basics.
2. `delegate_gaia` sync execution path + metadata return shape.
3. Three core sub-agents: MINERVA, HEPHAESTUS, DEMETER.
4. Shared contract envelope parsing + invalid-JSON retry handling.
5. Work-unit file flow via `plan_gaia` API.
6. `/gaia-init` command + template file bootstrap + optional `GAIA.md` ingestion.
7. Explicit non-overlap verification for native `plan`/`build`.

Defer to Phase-2:
- Full profile/cadence/review command matrix.
- Background parallel manager details.
- Advanced pair-loop UX refinements.

---

## Contradiction Tracker

Use this table while editing the main plan:

| Topic | Main plan status | Companion status | Action |
|------|-------------------|------------------|--------|
| SDK version | updated to 1.1.53 | TBD | keep pinned consistently |
| Pair pause granularity | grouped batches | grouped batches | keep aligned |
| Agent/command registration assumptions | config + plugin split | documented | verify against SDK reality |
| VCS language | neutral | neutral | keep JJ details in optional context only |

---

## Next Edits Queue

- Fill concrete SDK call patterns for each mapped feature.
- Add example payloads for `delegate_gaia` and DEMETER harvest input.
- Add test scenarios for non-overlap, rejection feedback, and `/gaia-init` lifecycle.
