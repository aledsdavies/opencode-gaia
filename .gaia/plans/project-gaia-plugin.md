# Plan: Project GAIA — OpenCode Orchestration Plugin

> **Status**: Draft — awaiting approval before implementation  
> **Created**: 2026-02-06  
> **Author**: HEPHAESTUS (build agent) + adavies  
> **Estimated effort**: Large (multi-session)

---

## TL;DR

Build an OpenCode plugin (`opencode-gaia`) that adds an optional GAIA orchestrator backed by 9 specialist sub-agents, each with typed contracts, configurable model assignments, and parallel execution. Inspired by Oh My OpenCode but dramatically leaner — fewer tokens consumed, faster results, focused prompts. Themed after Horizon Zero Dawn's terraforming AI hierarchy.

**What this keeps**: Native OpenCode `plan` and `build` agents for normal workflows.  
**What this adds**: TypeScript plugin orchestration mode (`gaia`), parallel background tasks, delegation routing, and a `.gaia/` workflow for persistent work-unit records.

### Planning Standard (Two Documents, Always)

Every GAIA initiative maintains two artifacts from day one:

1. **Plan doc (this file)** — product intent, architecture, scope, and tradeoffs.
2. **Implementation companion** — concrete SDK/hook mapping and execution details.

For this project, the companion file is:
`.gaia/plans/project-gaia-plugin-implementation-companion.md`

The two docs are treated as a pair and kept in sync as decisions evolve.

### MVP Cut Companion (Execution Slice)

To keep implementation focused, this plan also uses a dedicated MVP cut doc:
`.gaia/plans/project-gaia-plugin-mvp-cut.md`

This file defines what ships in P1, what is explicitly deferred, and the acceptance gates
required before expanding scope.

### Canonical Specs (Single Source of Truth)

To prevent drift, the following sections in this plan are canonical:

- **Agent output schema**: `### Agent Contracts`
- **Delegation tool contract**: `#### src/tools/delegate.ts — The Delegation Tool`
- **Collaboration controls**: `### Collaboration Knobs (Canonical)`
- **Instruction layering**: `### Instruction Layering (AGENTS + GAIA + Skills)`

The implementation companion explains runtime mechanics and references these sections instead of redefining schemas.

### Portability Requirement (Hard Constraint)

GAIA is developed inside this dotfiles repo, but the plugin itself is a portable product that must
work when extracted into its own repository.

| Layer | Purpose | Must stay here |
|-------|---------|----------------|
| **Core plugin package** | Reusable `opencode-gaia` runtime | `tools/opencode-gaia-plugin/` only |
| **Host adapter (this repo)** | Nix wiring, local defaults, personal/team policies | `modules/editors/**`, local AGENTS/docs/skills wiring |

Core package rules:
- No imports from `modules/`, `users/`, or other dotfiles-specific paths.
- No runtime dependency on Nix or this repository layout.
- All repo-specific behavior must come through config, init context, or optional skills.
- Must run with plain OpenCode plugin loading (without Home Manager).

Extraction acceptance checks:
- Copy `tools/opencode-gaia-plugin/` into a separate repo and build without dotfiles modules.
- Load plugin via local file path in OpenCode and verify startup succeeds.
- Confirm optional host files (`GAIA.md`, `.gaia/gaia-init.md`) are safely optional.
- Confirm native `plan` and `build` still work when GAIA is installed but not selected.

---

## Background & Motivation

### Current State

- **2 primary agents** (plan, build) defined in `modules/editors/opencode/default.nix`
- **13 skills** installed via Home Manager symlinks
- **3 instruction docs** loaded into every context window (~600 lines total)
- **No custom sub-agents** — only OpenCode built-in `general` and `explore`
- **No delegation system** — primary agent does everything itself
- **No parallel execution** — sequential tool calls only
- **Bug**: `smallModel` uses wrong provider prefix (`zai-coding-plan` → should be `zhipuai-coding-plan`)

### Problems

1. **Context bloat**: 600+ lines of instructions loaded always, most ignored by weaker models
2. **No specialization**: One agent tries to be recon, coder, tester, reviewer all at once
3. **No cost optimization**: Every sub-agent call uses the expensive primary model
4. **No parallel work**: Can't fire multiple explorations simultaneously
5. **Models don't follow rules**: Question tool, skill loading, VCS awareness buried in walls of text

### What Oh My OpenCode Does Well

- **11 agents** with clear roles and model assignments
- **Category-based delegation** with typed task routing
- **Parallel background agents** via session.create/prompt SDK calls
- **Dynamic prompt building** — sub-agents only see relevant instructions
- **Session continuity** — resume sub-agent conversations with session_id
- **40+ lifecycle hooks** for enforcing behavior

### What OMO Gets Wrong (for our needs)

- **Too heavy**: 10k+ lines of code, 40+ hooks, complex state management
- **Too many tokens**: Agent prompts are 500+ lines each, consuming expensive context
- **Over-engineered delegation**: Category system + Sisyphus-Junior + prompt_append layering
- **GPT-5.3-codex dependency**: Many features assume specific models
- **Not extractable**: Deeply coupled to its own config system

---

## Architecture Overview

### Primary Agent Modes (Compatibility)

The plugin keeps OpenCode's normal workflow intact and adds GAIA as an opt-in mode.

| Primary | Purpose | Default |
|---------|---------|---------|
| `plan` | Native planning workflow | available |
| `build` | Native implementation workflow | available |
| `gaia` | Orchestrated multi-agent workflow | optional (user-selected) |

Users can keep using `plan`/`build` exactly as today. `gaia` is for tasks where orchestration,
parallelism, and structured work-unit memory are worth the overhead.

GAIA core behavior stays VCS-agnostic. Repository-specific JJ/git workflow preferences belong in
`.gaia/gaia-init.md` or `.gaia/config.jsonc`, not hardcoded orchestration defaults.

### The HZD Hierarchy (GAIA Mode)

```
┌─────────────────────────────────────────────────────┐
│                 GAIA (Orchestrator Mode)              │
│         Orchestrator — never executes herself          │
│      Model: openai/gpt-5.3-codex (default, unlockable)│
│                                                       │
│   Decides: what happens next, who to call, when done  │
│   Produces: routing decisions, final user-facing summary│
└───────────┬───────────────────────────────┬───────────┘
            │                               │
     ┌──────┴──────┐                 ┌──────┴──────┐
     │  Recon/Plan  │                 │  Execution   │
     └──────┬──────┘                 └──────┬──────┘
            │                               │
   ┌────────┼────────┐          ┌───────────┼───────────┐
   │        │        │          │           │           │
MINERVA  APOLLO  ELEUTHIA   HEPHAESTUS  DEMETER    ARTEMIS
 recon   knowledge scaffold  implement  historian   tests
   │                                                   │
   │        ┌───────────────────────────────────────────┤
   │        │                                           │
AETHER   POSEIDON                                   HADES
quality  config/ops                              red-team
```

### Agent Roster (Complete)

| Agent | HZD Role | Function | Default Model | Temp | Mode |
|-------|----------|----------|---------------|------|------|
| **GAIA** | Earth Mother | Orchestrator — routes tasks, merges results, never codes | `openai/gpt-5.3-codex` | 0.2 | primary (optional) |
| **MINERVA** | Wisdom | Recon & routing — repo map, task decomposition, entrypoints | `zhipuai-coding-plan/glm-4.7` | 0.1 | subagent |
| **APOLLO** | Knowledge | Internal RAG — conventions, patterns, prior art, docs | `zhipuai-coding-plan/glm-4.7` | 0.1 | subagent |
| **ELEUTHIA** | Creation | Scaffolding — new files, interfaces, wiring, stubs | `kimi-for-coding/k2p5` | 0.2 | subagent |
| **HEPHAESTUS** | The Forge | Implementation & refactoring — write code, clean up, simplify | `openai/gpt-5.3-codex` | 0.1 | subagent |
| **DEMETER** | Harvest | Historian — documents work, catalogs decisions & learnings. NOT review/design. | `zhipuai-coding-plan/glm-4.7` | 0.1 | subagent |
| **ARTEMIS** | The Hunt | Tests & harness — unit/integration tests, fixtures, mocks | `openai/gpt-5.2-codex` | 0.1 | subagent |
| **AETHER** | Sky/Air | Quality gates — lint, typecheck, security, perf budgets | `zhipuai-coding-plan/glm-4.7` | 0.1 | subagent |
| **POSEIDON** | Sea/Config | Config, migrations, CI/CD, runtime wiring | `kimi-for-coding/k2p5` | 0.1 | subagent |
| **HADES** | Underworld | Red-team — rollback strategy, find flaws, containment | `openai/gpt-5.2` | 0.2 | subagent |

All models above are **defaults**. Every agent is fully configurable via plugin config (see Agent Configuration section below).

---

### Agent Trait Profiles (Model Selection Guide)

Each agent has cognitive traits that determine what kind of model works well for it. This guide helps users (and future-us) pick appropriate models when swapping providers or budgets change.

#### GAIA — The Orchestrator

```
Cognitive demands:  HIGH reasoning, HIGH planning, MEDIUM code understanding
Token pattern:      Short bursts, reads sub-agent outputs, produces routing decisions
Context window:     LARGE — sees the full picture, all sub-agent results
Key capabilities:   Task decomposition, delegation routing, synthesis, decision-making
Creativity:         LOW — should be deterministic and predictable
Tool usage:         Heavy — delegate_gaia, todowrite, plan_gaia, read, question

Why expensive model: GAIA must correctly decompose tasks, pick the right sub-agents in the
right order, and synthesize results from multiple specialists. A weak orchestrator means
every downstream agent gets bad instructions. This is the highest-leverage position.

Good models:        gpt-5.3-codex, claude-opus-4-6, kimi-k2-thinking (with extended thinking)
Acceptable:         gpt-5.2, kimi-k2p5, claude-sonnet-4-5
Poor fit:           glm-4.7 (weak at multi-step planning), small/nano models
```

#### MINERVA — Recon & Routing

```
Cognitive demands:  LOW reasoning, HIGH search/pattern-matching, LOW code generation
Token pattern:      Many parallel tool calls (grep, glob, read), returns structured summary
Context window:     MEDIUM — reads many files but doesn't need to hold them all
Key capabilities:   File discovery, dependency tracing, risk identification, structure mapping
Creativity:         NONE — factual discovery only
Tool usage:         Heavy — grep, glob, read, bash (read-only)

Why cheap model OK: MINERVA does glorified grep. She reads files, traces imports, builds a
map. This is mechanical work. The prompt tells her exactly what to look for and how to
structure the output. Weak models handle this well because the task is narrow and concrete.

MUST NOT:           Propose architecture changes. Suggest "how to do it". Opine on design.
                    MINERVA discovers WHAT exists and WHERE — never HOW things should change.
                    That's APOLLO (patterns) or HEPHAESTUS (implementation).

Good models:        glm-4.7, glm-4.6, gpt-5-nano, claude-haiku-4-5
Acceptable:         kimi-k2p5 (overkill but fine)
Poor fit:           Expensive models (waste of money for grep work)
```

#### APOLLO — Knowledge & Patterns

```
Cognitive demands:  MEDIUM reasoning, HIGH comprehension, LOW code generation
Token pattern:      Reads multiple files, synthesizes conventions, returns "how this repo works"
Context window:     LARGE — must compare patterns across many files simultaneously
Key capabilities:   Pattern recognition, convention extraction, documentation synthesis
Creativity:         LOW — reports what IS, not what SHOULD BE
Tool usage:         Heavy — read, grep, glob, webfetch (for external docs)

Why cheap model OK: APOLLO reads existing code and summarizes patterns. Similar to MINERVA
but with more synthesis. The key skill is comprehension, not generation. Cheap models with
large context windows actually excel here because they can ingest many files at once.

MUST NOT:           Expand scope with extra refactors. Suggest new features. Propose
                    architectural changes. APOLLO reports what IS — existing conventions,
                    existing patterns, existing pitfalls. Never what SHOULD BE.

Good models:        glm-4.7, kimi-k2p5 (if conventions are subtle), claude-haiku-4-5
Acceptable:         glm-4.6 (smaller context may miss patterns)
Poor fit:           Models with small context windows
```

#### ELEUTHIA — Scaffolding

```
Cognitive demands:  MEDIUM reasoning, MEDIUM code generation, HIGH structural understanding
Token pattern:      Creates multiple files, needs to understand project conventions
Context window:     MEDIUM — must see existing patterns to match them
Key capabilities:   File creation, interface design, dependency wiring, boilerplate generation
Creativity:         LOW-MEDIUM — follows existing patterns but creates new structures
Tool usage:         Heavy — write, edit, bash (for build verification)

Why mid-tier model: ELEUTHIA creates files that must compile and follow conventions. This
requires understanding existing architecture (from APOLLO's output) and generating
structurally sound code. Too weak = compilation errors. Too expensive = waste on boilerplate.

Good models:        kimi-k2p5, claude-sonnet-4-5, gpt-5.1-codex-mini
Acceptable:         glm-4.7 (for simple scaffolding), gpt-5.2 (overkill)
Poor fit:           Nano models (too many compilation errors in generated code)
```

#### HEPHAESTUS — Implementation & Refactoring

```
Cognitive demands:  HIGH reasoning, HIGH code generation, HIGH code understanding
Token pattern:      Reads plan + scaffold + patterns, writes substantial code changes
Context window:     LARGE — must hold plan, existing code, and generated code simultaneously
Key capabilities:   Algorithm design, bug-free code generation, multi-file edits, test awareness,
                    refactoring, naming improvements, deduplication, style alignment
Creativity:         MEDIUM — solves problems, picks approaches, makes design decisions
Tool usage:         Heavy — edit, write, bash (build/test), read

HEPHAESTUS both implements new code AND cleans up existing code. Refactoring is part of
the forge's work — the model that wrote the code understands it best and can simplify in
the same session via session continuity, avoiding redundant context re-reads.

VCS handling: HEPHAESTUS never hardcodes git or jj commands. GAIA passes vcs_type in the
delegation prompt. HEPHAESTUS uses available VCS guidance from the environment when present,
but proceeds without hard dependency on any specific skill package. Revision IDs in
HephaestusOutput are whatever the VCS returns — JJ change_id or git SHA.

Why expensive model: This is where the actual code gets written. A cheap model produces
code that doesn't compile, misses edge cases, ignores conventions, and creates tech debt.
HEPHAESTUS output directly becomes the codebase. Quality here is non-negotiable.

Good models:        gpt-5.3-codex, claude-opus-4-6, gpt-5.2-codex
Acceptable:         kimi-k2p5 (for simpler implementations), claude-sonnet-4-5
Poor fit:           glm-4.7 (poor code generation quality), nano/mini models
```

#### DEMETER — Historian & Knowledge Harvester

```
Cognitive demands:  MEDIUM reasoning, HIGH summarization, LOW code generation
Token pattern:      Reads sub-agent outputs + diffs + session history, produces structured docs
Context window:     LARGE — must review everything that happened across a full work session
Key capabilities:   Summarization, categorization, pattern extraction, technical writing
Creativity:         LOW — reports what happened factually, extracts reusable knowledge
Tool usage:         read (heavy), write (.gaia/ files only), edit (.gaia/ files only)

DEMETER's job is to "harvest" the work session. After implementation waves complete, GAIA
delegates to DEMETER with the full context: what MINERVA found, what HEPHAESTUS built,
what ARTEMIS tested, what HADES flagged, and critically — what the user decided when
asked questions. DEMETER distills all of this into:

1. **Decisions** — every choice the user made via the question tool, with context on what
   was asked, what they chose, and what it impacts. These are gold — they capture intent
   that would otherwise be lost between sessions. When you come back in 3 months and ask
   "why did we use jose instead of jsonwebtoken?", DEMETER's record has the answer.
2. **Log entries** — what was done, by whom, with what revision IDs
3. **Learnings** — reusable knowledge discovered during the session
4. **Plan updates** — mark completed tasks, note deviations from the plan
5. **Session summaries** — concise recap for future context

DEMETER is strictly documentation/knowledge. She is NOT a reviewer, NOT a designer,
and NOT a critic. She does not evaluate quality of code, suggest improvements, or
opine on architecture. That's HADES (red-team) and AETHER (quality gates).

Why cheap model OK: DEMETER summarizes and writes structured markdown. She doesn't
generate code or make architectural decisions. The prompt provides a strict template.
Any model that can read context and produce organized text works fine. This is one of
the lowest-stakes agents — if the summary is mediocre, no code breaks.

MUST NOT:           Review code quality. Suggest improvements. Propose design changes.
                    Write changelogs or PR summaries (those are GAIA's job to compose
                    from DEMETER's output). Run VCS commands. Touch source code files.

Writes to:          .gaia/{work-unit}/log.md, .gaia/{work-unit}/decisions.md,
                    .gaia/learnings.md. Never anything outside .gaia/.

Good models:        glm-4.7, glm-4.6, claude-haiku-4-5, gpt-5-nano
Acceptable:         kimi-k2p5 (better summaries but overkill)
Poor fit:           Expensive models (complete waste for documentation work)
```

#### ARTEMIS — Tests & Harness

```
Cognitive demands:  HIGH reasoning, HIGH code generation, HIGH adversarial thinking
Token pattern:      Reads implementation, generates comprehensive test cases + fixtures
Context window:     LARGE — must understand what code does AND what could go wrong
Key capabilities:   Edge case identification, test design, mock creation, assertion writing
Creativity:         MEDIUM-HIGH — must imagine failure scenarios, boundary conditions
Tool usage:         write, edit, bash (test runner), read

Why mid-high model: Writing good tests requires understanding WHAT the code does, then
imagining HOW it could fail. This is adversarial thinking — the model must be smart enough
to find edge cases, design meaningful assertions, and create realistic fixtures. Cheap
models write superficial tests that miss the point.

Good models:        gpt-5.2-codex, claude-sonnet-4-5, kimi-k2-thinking
Acceptable:         kimi-k2p5 (for straightforward test cases)
Poor fit:           glm-4.7 (tests are too shallow), nano models
```

#### AETHER — Quality Gates

```
Cognitive demands:  LOW reasoning, LOW code generation, HIGH tool operation
Token pattern:      Runs commands, parses output, reports pass/fail
Context window:     SMALL — focused on command output, not code comprehension
Key capabilities:   Running linters/typecheckers, parsing error output, categorizing issues
Creativity:         NONE — mechanical pass/fail checking
Tool usage:         bash (heavy — linters, typecheckers, security tools), read

Why cheap model OK: AETHER runs commands and reports results. "Run `tsc --noEmit`, tell me
if it passed, list the errors if not." This is mechanical. The prompt includes exact
commands to run. Any model that can execute bash and parse output works fine.

MUST NOT:           Suggest design changes. Propose refactors. Recommend architectural
                    improvements. AETHER's fixes are strictly "do X to satisfy the tool" —
                    add a missing import, fix a type annotation, remove an unused variable.
                    If a quality gate failure requires design work, AETHER reports it and
                    GAIA routes the fix to the appropriate agent (see Fix Routing below).

Good models:        glm-4.7, glm-4.6, gpt-5-nano, claude-haiku-4-5
Acceptable:         Anything — this agent is tool-driven, not intelligence-driven
Poor fit:           Expensive models (total waste for running linters)
```

#### POSEIDON — Config, Data & Ops

```
Cognitive demands:  MEDIUM reasoning, MEDIUM code generation, HIGH domain knowledge
Token pattern:      Reads existing config, produces config changes + migration scripts
Context window:     MEDIUM — needs to see existing config/CI/Docker setup
Key capabilities:   YAML/TOML/Docker/CI fluency, migration scripting, env variable management
Creativity:         LOW — follows established DevOps patterns
Tool usage:         edit, write, bash, read

Why mid-tier model: Config work is pattern-matching with domain knowledge. The model needs
to know Docker, CI/CD, database migrations, etc. This is specialized but not creative.
Mid-tier models with good training data handle it well. Expensive models are overkill.

Good models:        kimi-k2p5, claude-sonnet-4-5, gpt-5.1-codex-mini
Acceptable:         glm-4.7 (for simple config changes)
Poor fit:           Nano models (may generate invalid YAML/Docker syntax)
```

#### HADES — Red-Team & Containment

```
Cognitive demands:  HIGH reasoning, HIGH adversarial thinking, MEDIUM code understanding
Token pattern:      Reads implementation + tests, tries to find flaws, produces risk report
Context window:     LARGE — must hold the full change to reason about interactions
Key capabilities:   Security analysis, race condition detection, failure mode imagination,
                    rollback planning, scope reduction under pressure
Creativity:         HIGH — must think like an attacker, imagine unlikely scenarios
Tool usage:         read (heavy), bash (read-only for checks), webfetch (CVE lookups)

Why mid-high model: Red-teaming requires adversarial intelligence. HADES must look at code
and think "how could this break in production?", "what happens under load?", "is there a
security vulnerability here?". This is the opposite of mechanical — it requires imagination
and deep reasoning. Cheap models produce superficial "looks fine" reviews.

MUST:               Produce TESTABLE failure modes. Every vulnerability or risk identified
                    must include a concrete scenario that ARTEMIS can turn into a test case.
                    "Race condition in auth refresh" → "Two concurrent requests with expired
                    token should not both trigger refresh." This makes HADES output actionable.
MUST NOT:           Fix code. Edit files. Implement mitigations. HADES identifies and reports.
                    GAIA routes fixes to HEPHAESTUS (code), POSEIDON (config), or ARTEMIS (tests).

Good models:        gpt-5.2, claude-opus-4-6, kimi-k2-thinking (extended thinking)
Acceptable:         gpt-5.2-codex, claude-sonnet-4-5
Poor fit:           glm-4.7 (reviews are too shallow), nano models
```

---

### Agent Configuration System

All agents are configurable via a JSONC config file (`.gaia/config.jsonc` or `~/.config/opencode/gaia.jsonc`). The plugin loads defaults and merges user overrides, following the same pattern as OMO.

### Skills and Tools Behavior (Default)

By default, agents autonomously decide which tools to use and whether to load skills based on
task context. No explicit skill policy config is required.

- **Default behavior**: auto-decide tools and skills in context
- **Expected quality**: proactive skill loading when clearly relevant
- **GAIA role**: nudge sub-agents when relevant skills appear available, but never hard-fail if
  a specific skill is missing
- **BYO skills**: plugin does not hardcode a required skill package; it adapts to what is present

#### Config Schema

```typescript
interface GaiaConfig {
  mode?: "supervised" | "autopilot" | "locked"  // Default autonomy mode (default: "supervised")
  visibility?: "live" | "checkpoint" | "quiet"  // Default visibility mode (default: "checkpoint")
  interaction?: "standard" | "pair"              // Default interaction style (default: "standard")
  checkinCadence?: "step" | "batch" | "wave" | "milestone" // Default: "wave"
  reviewDepth?: "inline" | "diff" | "risk" | "deep_repo"    // Default: "diff"
  startup?: {
    askAtTaskStart?: boolean                        // Default: true
    defaultProfile?: "pair_live" | "pair_batched" | "pair_ramp" | "agentic_checkpoint" | "agentic_full" | "standard"
    rampWarmupBatches?: number                      // Default: 2
  }
  gaiaContext?: {
    initFile?: string           // Default: ".gaia/gaia-init.md"
    gaiaInstructionFile?: string // Default: "GAIA.md" (load only if present)
    useLearnings?: boolean      // Default: true (inject selected learnings into GAIA context)
    accountFor?: string[]       // Persistent constraints/objectives GAIA should always consider
    avoid?: string[]            // Anti-goals / forbidden directions for this repo
    extraContextFiles?: string[] // Additional files to load into GAIA context when present
  }
  wavePolicy?: {
    enforceWaveId?: boolean     // Default: true
    boundaryRule?: "implementation+basic_checks" | "manual" // Default: implementation+basic_checks
  }
  autopilotSafeguards?: {
    maxToolCallsPerWave?: number  // Default: 40
    maxWaveMinutes?: number       // Default: 20
    maxBackgroundTasks?: number   // Default: 3
    consecutiveFailureLimit?: number // Default: 3
    onFailureLimit?: "checkpoint" | "supervised_pause" // Default: checkpoint
  }
  agents: {
    [agentName: string]: AgentOverride
  }
  // Future: parallel limits, etc.
}

interface AgentOverride {
  model?: string            // Override default model
  fallback?: string[]       // Override fallback chain (array of model IDs)
  temperature?: number      // Override temperature
  reasoningEffort?: "low" | "medium" | "high"  // For OpenAI reasoning models
  thinking?: {              // For Anthropic extended thinking
    type: "enabled"
    budgetTokens: number
  }
  maxTokens?: number        // Override max output tokens
  disabled?: boolean        // Disable this agent entirely
  prompt_append?: string    // Append to the default prompt (don't replace it)
  prompt?: string           // Fully replace the default prompt (advanced)
}
```

#### Example Config (`.gaia/config.jsonc`)

```jsonc
{
  "mode": "supervised",
  "visibility": "checkpoint",
  "interaction": "standard",
  "checkinCadence": "wave",
  "reviewDepth": "diff",
  "startup": {
    "askAtTaskStart": true,
    "defaultProfile": "pair_ramp",
    "rampWarmupBatches": 2
  },
  "gaiaContext": {
    "initFile": ".gaia/gaia-init.md",
    "gaiaInstructionFile": "GAIA.md",
    "useLearnings": true,
    "accountFor": [
      "Favor incremental, reviewable changes over large rewrites",
      "Keep native plan/build workflows fully usable"
    ],
    "avoid": [
      "Hard dependencies on specific skill package names",
      "VCS-specific assumptions baked into core orchestration"
    ],
    "extraContextFiles": [
      "README.md",
      "docs/ARCHITECTURE.md"
    ]
  },
  "wavePolicy": {
    "enforceWaveId": true,
    "boundaryRule": "implementation+basic_checks"
  },
  "autopilotSafeguards": {
    "maxToolCallsPerWave": 40,
    "maxWaveMinutes": 20,
    "maxBackgroundTasks": 3,
    "consecutiveFailureLimit": 3,
    "onFailureLimit": "checkpoint"
  },
  // Per-project agent overrides
  "agents": {
    // This project is Angular — use Gemini for implementation (good at frontend)
    "hephaestus": {
      "model": "opencode/gemini-3-pro",
      "prompt_append": "This is an Angular 21 project. Use signals, standalone components, and zoneless change detection."
    },
    // Kimi has better reasoning for this complex domain
    "hades": {
      "model": "kimi-for-coding/kimi-k2-thinking",
      "temperature": 0.3
    },
    // Don't need scaffolding on this project — it's all existing code
    "eleuthia": {
      "disabled": true
    },
    // Budget-conscious: downgrade ARTEMIS for this project
    "artemis": {
      "model": "kimi-for-coding/k2p5"
    }
  }
}
```

### GAIA Init + Learnings ("/init for GAIA")

`.gaia/gaia-init.md` acts like an AGENTS-style bootstrap file for GAIA orchestration.

- **Role**: durable project context GAIA should account for on every task
- **Source**: created/updated via `/gaia-init` workflow
- **Content**: goals, hard constraints, architecture anchors, risk hotspots, preferred collaboration style
- **Relationship to `learnings.md`**: learnings are append-only discovery notes; `gaia-init.md` is curated active guidance

DEMETER can propose promotions from `learnings.md` into `gaia-init.md`, but GAIA should treat
`gaia-init.md` as the authoritative orchestration bootstrap context.

### Optional `GAIA.md` (Project Instructions for GAIA)

Use an optional repo-root `GAIA.md` file for GAIA-specific instructions, similar to AGENTS files
but scoped to orchestration behavior.

Recommended flow:

1. Add `GAIA.md` at repository root when project-specific GAIA rules are needed.
2. Keep it focused on durable constraints and orchestration preferences (not session notes).
3. For very large guides, convert them into project skills for lazy loading and reference those
   skills from `GAIA.md` (short summary in file, full detail in skill resources).
4. If `GAIA.md` is absent, GAIA runs with AGENTS + `.gaia/gaia-init.md` + config defaults.

This keeps instructions portable and avoids hardwiring repository-specific policy into plugin code.

### Instruction Layering (AGENTS + GAIA + Skills)

Instruction precedence is explicit:

1. **System + safety constraints** (non-negotiable runtime/tooling limits)
2. **AGENTS/project instructions** (general coding behavior)
3. **`GAIA.md` (optional)** (GAIA-specific orchestration constraints)
4. **`.gaia/gaia-init.md`** (curated active project memory)
5. **On-demand skills** (lazy-loaded deep guidance when relevant)

If rules conflict at the same level, the more specific scope wins; hard safety constraints always
override everything else.

#### Default Fallback Chains

```typescript
const AGENT_DEFAULTS: Record<string, AgentModelConfig> = {
  gaia: {
    model: "openai/gpt-5.3-codex",
    fallback: ["kimi-for-coding/k2p5", "zhipuai-coding-plan/glm-4.7"],
    temperature: 0.2,
    reasoningEffort: "medium",
  },
  minerva: {
    model: "zhipuai-coding-plan/glm-4.7",
    fallback: ["zhipuai-coding-plan/glm-4.6", "kimi-for-coding/k2p5"],
    temperature: 0.1,
  },
  apollo: {
    model: "zhipuai-coding-plan/glm-4.7",
    fallback: ["kimi-for-coding/k2p5", "zhipuai-coding-plan/glm-4.6"],
    temperature: 0.1,
  },
  eleuthia: {
    model: "kimi-for-coding/k2p5",
    fallback: ["zhipuai-coding-plan/glm-4.7"],
    temperature: 0.2,
  },
  hephaestus: {
    model: "openai/gpt-5.3-codex",
    fallback: ["openai/gpt-5.2-codex", "kimi-for-coding/k2p5"],
    temperature: 0.1,
    reasoningEffort: "medium",
  },
  demeter: {
    model: "zhipuai-coding-plan/glm-4.7",
    fallback: ["zhipuai-coding-plan/glm-4.6"],
    temperature: 0.1,
  },
  artemis: {
    model: "openai/gpt-5.2-codex",
    fallback: ["kimi-for-coding/k2p5", "zhipuai-coding-plan/glm-4.7"],
    temperature: 0.1,
  },
  aether: {
    model: "zhipuai-coding-plan/glm-4.7",
    fallback: ["zhipuai-coding-plan/glm-4.6"],
    temperature: 0.1,
  },
  poseidon: {
    model: "kimi-for-coding/k2p5",
    fallback: ["zhipuai-coding-plan/glm-4.7"],
    temperature: 0.1,
  },
  hades: {
    model: "openai/gpt-5.2",
    fallback: ["kimi-for-coding/kimi-k2-thinking", "kimi-for-coding/k2p5"],
    temperature: 0.2,
    reasoningEffort: "medium",
  },
}
```

#### Model Resolution Pipeline

When a sub-agent is invoked, the plugin resolves its model in this priority order:

1. **User config override** (`.gaia/config.jsonc` → `agents.{name}.model`)
2. **Default model** (from `AGENT_DEFAULTS`)
3. **Fallback chain** — iterate through fallbacks until one is available
4. **System default** — OpenCode's configured default model as last resort

This mirrors OMO's `resolveModelPipeline()` but is simpler — no category inheritance, no variant system.

#### Model Cost Strategy

| Tier | Models | Used By | Rationale |
|------|--------|---------|-----------|
| **Expensive** | `openai/gpt-5.3-codex` | GAIA (orchestrate), HEPHAESTUS (implement) | Orchestration needs smarts. Implementation needs quality. Short bursts only. |
| **Mid-high** | `openai/gpt-5.2-codex`, `openai/gpt-5.2` | ARTEMIS (tests), HADES (red-team) | Tests need reasoning. Red-team needs adversarial thinking. |
| **Mid** | `kimi-for-coding/k2p5` | ELEUTHIA (scaffold), POSEIDON (config) | Good enough for structured tasks. Kimi yearly subscription. |
| **Cheap** | `zhipuai-coding-plan/glm-4.7` | MINERVA (recon), APOLLO (knowledge), AETHER (quality gates), DEMETER (historian) | Grep-like work, doc lookup, running linters, summarization. GLM subscription. |

#### Quick Model Swap Presets (Future Enhancement)

For convenience, the plugin could support named presets:

```jsonc
{
  // Apply a preset instead of configuring each agent
  "preset": "budget",  // or "balanced", "premium", "local"
}
```

| Preset | GAIA | Recon/Knowledge | Implementation | Tests/Review |
|--------|------|-----------------|----------------|-------------|
| **budget** | kimi-k2p5 | glm-4.7 | kimi-k2p5 | glm-4.7 |
| **balanced** (default) | gpt-5.3-codex | glm-4.7 | gpt-5.3-codex | gpt-5.2-codex |
| **premium** | gpt-5.3-codex | gpt-5.2 | gpt-5.3-codex | gpt-5.2 |
| **local** | (user's primary) | (user's small) | (user's primary) | (user's small) |

This is a Phase 2+ enhancement, not MVP.

### Agent Contracts

Every sub-agent MUST return a single JSON object in a fenced code block, using a shared envelope
plus agent-specific `data`. This is the canonical machine-parseable schema for GAIA.

**Contract enforcement rule for GAIA**: If a sub-agent returns invalid JSON or no JSON
block, GAIA resumes the same session (`session_id`) with: "Your output was not valid JSON.
Return ONLY a ```json block with the required fields." One retry only — if it fails twice,
GAIA records the parse failure and proceeds with best-effort extraction.

**Prompt template for enforcing JSON output** (injected into every sub-agent):
```
## Output Format (MANDATORY)
Return your result as a single JSON object in a fenced code block:
```json
{
  "contract_version": "1.0",
  "agent": "minerva",
  "work_unit": "example-work-unit",
  "session_id": "...",
  "vcs_type": "git",
  "ok": true,
  "data": { ... agent-specific fields ... },
  "errors": []
}
```
No text before or after the JSON block. GAIA parses this programmatically.
```

```typescript
type AgentName =
  | "minerva" | "apollo" | "eleuthia" | "hephaestus" | "demeter"
  | "artemis" | "aether" | "poseidon" | "hades"

interface AgentEnvelope<TData> {
  contract_version: "1.0"
  agent: AgentName
  work_unit: string
  session_id: string
  vcs_type?: "jj" | "git" | "none"  // Propagated when known
  ok: boolean
  data: TData
  errors: string[] // Parse issues, tool failures, or unmet prerequisites
}

interface MinervaData {
  repo_map: string
  vcs_type: "jj" | "git" | "none" // Detected from .jj/ or .git/ presence
  plan: string[]
  risk_list: string[]
  suggested_agents: string[]
}

interface ApolloData {
  conventions: string[]
  examples: string[]
  do_dont: { do: string[]; dont: string[] }
}

interface EleuthiaData {
  files_created: string[]
  compile_status: "pass" | "fail" | "untested"
}

interface HephaestusData {
  diff_summary: string
  files_modified: string[]
  revision_ids: string[]
  notes: string[]
  refactoring_done: string[]
  known_issues: string[]
}

interface DemeterData {
  log_entry: string
  decisions: {
    type: "question" | "rejection" | "mode_switch" | "pair_feedback"
    question: string
    answer: string
    rationale?: string
    impact: string
  }[]
  learnings: string[]
  plan_updates: string[]
  session_summary: string
}

interface ArtemisData {
  tests_added: string[]
  coverage_notes: string
  pass_status: "pass" | "fail" | "partial"
}

interface AetherData {
  checks_run: string[]
  failures: string[]
  fixes: string[]
  release_ready: boolean
}

interface PoseidonData {
  config_changes: string[]
  migrations: string[]
  deploy_notes: string
}

interface HadesData {
  vulnerabilities: {
    issue: string
    severity: "low" | "medium" | "high" | "critical"
    testable_scenario: string
    suggested_fix_agent: "hephaestus" | "poseidon" | "artemis"
  }[]
  rollback_plan: string
  minimal_patch: string
  risk_level: "low" | "medium" | "high" | "critical"
}

type MinervaOutput = AgentEnvelope<MinervaData>
type ApolloOutput = AgentEnvelope<ApolloData>
type EleuthiaOutput = AgentEnvelope<EleuthiaData>
type HephaestusOutput = AgentEnvelope<HephaestusData>
type DemeterOutput = AgentEnvelope<DemeterData>
type ArtemisOutput = AgentEnvelope<ArtemisData>
type AetherOutput = AgentEnvelope<AetherData>
type PoseidonOutput = AgentEnvelope<PoseidonData>
type HadesOutput = AgentEnvelope<HadesData>
```

### Permission Matrix

| Agent | read | edit | write | bash | task | webfetch |
|-------|------|------|-------|------|------|---------|
| GAIA | allow | deny | deny | read-only | allow | allow |
| MINERVA | allow | deny | deny | read-only | deny | deny |
| APOLLO | allow | deny | deny | read-only | deny | allow |
| ELEUTHIA | allow | ask | ask | ask | deny | deny |
| HEPHAESTUS | allow | ask | ask | ask | deny | deny |
| DEMETER | allow | allow (.gaia/ only) | allow (.gaia/ only) | read-only | deny | deny |
| ARTEMIS | allow | ask | ask | ask (test commands) | deny | deny |
| AETHER | allow | deny | deny | allow (lint/check) | deny | deny |
| POSEIDON | allow | ask | ask | ask | deny | deny |
| HADES | allow | deny | deny | read-only | deny | deny |

**Key constraints:**
- GAIA never edits files. She delegates ALL execution, including VCS revisions (→ HEPHAESTUS).
- HADES is read-only — finds problems, doesn't fix them. Produces testable failure modes that feed ARTEMIS.
- DEMETER only writes to `.gaia/` — never touches source code.
- AETHER never suggests design changes — only "do X to satisfy the tool" (fix lint error, add missing import).
- DEMETER receives revision IDs, diffs, and decision context via GAIA's delegation prompt — she doesn't run VCS commands herself.

---

## GAIA Orchestration Logic

This section applies when the user selects `gaia` mode. GAIA never writes code herself.
She decides what happens next based on the task and delegates execution to sub-agents.

### Task Classification (Phase 0)

Every user message goes through classification:

| Type | Signal | GAIA's Action |
|------|--------|---------------|
| **Trivial** | "What does X do?", single lookup | MINERVA or APOLLO directly, return answer |
| **Quick fix** | "Fix the typo in X", obvious change | HEPHAESTUS directly, verify with AETHER |
| **Feature** | "Add rate limiting to the API" | Full pipeline: MINERVA → APOLLO → ELEUTHIA? → HEPHAESTUS → ARTEMIS → AETHER + HADES → DEMETER |
| **Refactor** | "Clean up the auth module" | MINERVA → APOLLO → HEPHAESTUS (refactor mode) → AETHER → DEMETER |
| **Bug** | "Login fails with error X" | MINERVA → APOLLO → HEPHAESTUS → ARTEMIS |
| **Infra** | "Add Docker support" | MINERVA → POSEIDON → AETHER |
| **Review** | "Review what was done" | HADES + AETHER in parallel |

### Default Pipeline (Feature Work)

```
1. MINERVA (parallel): map repo + propose plan
2. APOLLO (parallel with MINERVA): confirm patterns/conventions  
3. GAIA: synthesize, create .gaia/ plan, get user approval if complex
4. ELEUTHIA (if needed): scaffold new files
5. HEPHAESTUS: implement the changes (includes refactoring/cleanup)
6. ARTEMIS: add tests
7. AETHER + HADES (parallel): quality gates + red-team review
8. HEPHAESTUS: create revision via VCS (jj/git) — GAIA delegates with revision message
9. DEMETER: harvest — document everything into logbook, learnings, plan updates
10. GAIA: final review, report to user
```

### Parallel Execution Strategy

Agents that don't depend on each other run simultaneously:

```
Wave 1: MINERVA + APOLLO (parallel background)
Wave 2: GAIA reads results, creates plan
Wave 3: ELEUTHIA (if needed)
Wave 4: HEPHAESTUS (needs scaffold from Wave 3)
Wave 5: ARTEMIS + AETHER + HADES (parallel background)
Wave 6: HEPHAESTUS creates revision via VCS (GAIA passes revision message)
Wave 7: DEMETER (harvests everything from waves 1-6, receives revision IDs from GAIA)
Wave 8: GAIA reviews, reports to user
```

### Fix Routing (When Verification Fails)

When AETHER or HADES find issues, GAIA routes fixes to the correct agent — never back to
AETHER or HADES themselves (they're non-editing).

| Failure Type | Route To | Example |
|-------------|----------|---------|
| Build/lint/typecheck error | **HEPHAESTUS** | Missing import, type mismatch, unused variable |
| Test failure | **HEPHAESTUS** (code fix) or **ARTEMIS** (test fix) | Depends on whether the test or the code is wrong |
| Missing test coverage | **ARTEMIS** | HADES identified a testable scenario, ARTEMIS writes the test |
| CI/config/migration issue | **POSEIDON** | Docker build fails, CI pipeline misconfigured |
| Security vulnerability | **HEPHAESTUS** (mitigate) | HADES found an issue, HEPHAESTUS implements the fix |
| Risk/rollback needed | **HEPHAESTUS** (reduce scope) | HADES says "too risky", HEPHAESTUS implements minimal_patch |

GAIA passes the specific failure details from AETHER/HADES output into the fix agent's
prompt, along with the `session_id` from the original implementation session (so
HEPHAESTUS has full context without re-reading files).

### Session Continuity

Every `delegate_gaia` result includes `session_id` (plus parse metadata). GAIA stores these for follow-up:

```typescript
// If HEPHAESTUS's implementation has issues found by AETHER:
delegate_gaia({
  agent: "hephaestus",
  session_id: hephaestus_session,
  prompt: "AETHER found: [issues]. Fix these."
})
// HEPHAESTUS has full context from before — no repeated file reads
```

---

## Plugin Architecture

### Directory Structure

```
tools/opencode-gaia-plugin/
├── src/
│   ├── index.ts                 # Plugin entry — wires tools/hooks/state; loads config-driven agent/command setup
│   ├── agents/
│   │   ├── index.ts             # Agent registry — createBuiltinAgents(), getAgent()
│   │   ├── types.ts             # AgentContract types, output schemas, AgentModelConfig
│   │   ├── gaia.ts              # GAIA orchestrator prompt (primary agent)
│   │   ├── minerva.ts           # Recon & routing sub-agent
│   │   ├── apollo.ts            # Knowledge & patterns sub-agent
│   │   ├── eleuthia.ts          # Scaffolding sub-agent
│   │   ├── hephaestus.ts        # Implementation sub-agent
│   │   ├── demeter.ts           # Historian / knowledge harvester sub-agent
│   │   ├── artemis.ts           # Testing sub-agent
│   │   ├── aether.ts            # Quality gates sub-agent
│   │   ├── poseidon.ts          # Config & ops sub-agent
│   │   └── hades.ts             # Red-team sub-agent
│   ├── config/
│   │   ├── schema.ts            # GaiaConfig Zod schema + AgentOverride + mode types
│   │   ├── defaults.ts          # AGENT_DEFAULTS with models, fallbacks, temps
│   │   └── loader.ts            # Load + merge .gaia/config.jsonc + global config
│   ├── tools/
│   │   ├── delegate.ts          # delegate_gaia + collect_results tools
│   │   └── plan.ts              # plan_gaia tool (create/read .gaia/ work units)
│   ├── hooks/
│   │   ├── context-aid-nudger.ts # Nudge agents toward relevant skills/tools when available
│   │   ├── harvest-reminder.ts  # Remind GAIA to delegate to DEMETER after impl waves
│   │   ├── decision-capture.ts  # Intercept question + rejection responses for DEMETER
│   │   ├── rejection-feedback.ts # Pre-fill user input after permission rejection
│   │   ├── autonomy.ts          # Auto-approve permissions in autopilot, deny in locked
│   │   ├── activity-stream.ts   # Live stream of tool calls, edits, and bash activity
│   │   ├── pair-loop.ts         # Pause after edit/bash batches for on-the-fly feedback
│   │   └── todo-enforcer.ts     # Enforce todowrite usage on multi-step work
│   ├── commands/
│   │   ├── mode.ts              # /autopilot, /supervised, /locked slash commands
│   │   ├── visibility.ts        # /live, /checkpoint, /quiet, /pair, /standard, /next, /profile, /cadence, /review controls
│   │   └── init.ts              # /gaia-init command (bootstrap/update .gaia/gaia-init.md)
│   └── shared/
│       ├── models.ts            # resolveModel() — fallback chain resolution
│       ├── permissions.ts       # Permission matrix + dangerous ops denylist
│       └── prompts.ts           # Shared prompt fragments (delegation protocol, etc.)
├── package.json
├── tsconfig.json
├── default.nix                  # Nix build derivation
└── AGENTS.md                    # Plugin-specific agent docs (for AI reading)
```

### Key Files

#### `src/index.ts` — Plugin Entry

```typescript
import type { Plugin } from "@opencode-ai/plugin"
// Registers:
// - GAIA as optional primary agent (plan/build remain available)
// - 9 sub-agents (minerva, apollo, eleuthia, hephaestus, demeter, artemis, aether, poseidon, hades)
// - 3 tools (delegate_gaia, collect_results, plan_gaia)
// - 8 hooks (context-aid-nudger, harvest-reminder, decision-capture, rejection-feedback, autonomy, activity-stream, pair-loop, todo-enforcer)
// - 13 slash commands (/autopilot, /supervised, /locked, /live, /checkpoint, /quiet, /pair, /standard, /next, /profile, /cadence, /review, /gaia-init)
// Note: agent + command registration may be config/markdown-driven where required by SDK constraints.
```

#### `src/agents/types.ts` — Contracts

Defines the typed output interfaces for each agent. These aren't enforced at runtime (LLMs return strings), but the contracts are embedded in agent prompts so they know what format to return.

#### `src/tools/delegate.ts` — The Delegation Tool

This is the core innovation. A custom tool that GAIA calls to route work:
This subsection is the canonical `delegate_gaia` contract.

```typescript
interface DelegateContextAids {
  skills?: string[]
  tools?: string[]
  files?: string[]
}

interface DelegateGaiaResult {
  task_id?: string            // Present for background tasks
  session_id: string
  model_used: string
  raw_text: string | null     // Final assistant text when available
  parsed_json: unknown | null // Parsed contract payload (envelope) when valid
  parse_error: string | null  // Why parse failed
  status: "running" | "completed" | "partial" | "failed"
}

tool({
  description: "Delegate a task to a specialist GAIA sub-agent. Use 'background: true' for parallel work.",
  args: {
    agent: schema.enum([
      "minerva", "apollo", "eleuthia", "hephaestus", "demeter",
      "artemis", "aether", "poseidon", "hades"
    ]).describe("Which specialist sub-agent to invoke"),
    prompt: schema.string().describe("Detailed task prompt with TASK/CONTEXT/MUST DO/MUST NOT/EXPECTED"),
    background: schema.boolean().describe("true=async (parallel), false=sync (wait for result)"),
    session_id: schema.string().optional().describe("Resume a previous sub-agent session"),
    context_aids: schema.object({
      skills: schema.array(schema.string()).optional(),
      tools: schema.array(schema.string()).optional(),
      files: schema.array(schema.string()).optional(),
    }).optional().describe("Optional context aids; non-blocking if unavailable"),
  },
  async execute(args, ctx) {
    // 1. Load agent config from defaults + user overrides
    // 2. Resolve model via fallback chain (checking model availability)
    // 3. Build optional context-aids block from context_aids
    // 4. If session_id: resume existing session with new prompt
    // 5. Else: create child session via ctx.client.session.create()
    //    - Set model, temperature, reasoningEffort from resolved config
    //    - Inject: agent system prompt + optional context-aids + user prompt
    // 6. If background: return DelegateGaiaResult with status="running"
    // 7. If sync: poll session.messages(), then return parsed envelope + metadata
  }
})
```

#### `src/tools/delegate.ts` — `collect_results` Tool

Companion tool for collecting background task results:

```typescript
tool({
  description: "Collect results from a background sub-agent task",
  args: {
    task_id: schema.string().describe("The task_id returned by delegate_gaia with background=true"),
    cancel: schema.boolean().optional().describe("Cancel the background task instead of collecting"),
  },
  async execute(args, ctx) {
    // 1. Look up session by task_id
    // 2. If cancel: abort the session, return confirmation
    // 3. Check if session is idle (complete)
    // 4. If complete: return DelegateGaiaResult with parsed_json/parse_error populated
    // 5. If still running: return DelegateGaiaResult with status="running"
  }
})
```

#### `src/tools/plan.ts` — Minimal Filesystem API (Canonical)

`plan_gaia` is the only write surface for GAIA workflow artifacts. DEMETER and other agents
should write through this API (or identical constrained helpers) so `.gaia/` boundaries are
enforceable.

```typescript
interface PlanGaiaApi {
  create_work_unit(slug: string, title: string): {
    plan_path: string
    log_path: string
    decisions_path: string
  }

  append_log(slug: string, markdown: string): { ok: boolean }
  append_decisions(slug: string, rowsMarkdown: string): { ok: boolean }
  append_learnings(markdownBullets: string[]): { ok: boolean }

  read_work_unit(slug: string): {
    paths: string[]
    content: {
      plan_md: string
      log_md: string
      decisions_md: string
    }
  }
}
```

All operations above are scoped to `.gaia/` only.

### Hooks Design

#### `decision-capture.ts` — Capturing User Decisions

Uses the `tool.execute.after` hook to intercept question tool responses. Every time a user
answers a question, the hook extracts the question text, selected option(s), and any custom
text. These are buffered in memory and passed to DEMETER when she's invoked.

```typescript
// Hook: tool.execute.after
"tool.execute.after": async (input, output) => {
  if (input.tool !== "question") return

  // Parse the structured response from the question tool output
  // output.output contains: "User has answered your questions: ..."
  const decisions = parseQuestionResponse(output.output)

  // Buffer in plugin state — DEMETER reads these when harvesting
  decisionBuffer.push(...decisions.map(d => ({
    question: d.question,
    answer: d.selectedLabels.join(", "),
    timestamp: Date.now(),
    sessionID: input.sessionID,
  })))
}
```

When GAIA delegates to DEMETER, the delegate tool injects the buffered decisions into
DEMETER's prompt:

```
## Decisions Made This Session
The user was asked N questions and made the following choices:

1. Q: "Should we use jose or jsonwebtoken?"
   A: "jose" — "ESM native, smaller bundle"
   
2. Q: "Where should the validator live?"
   A: "com.finboot.internal.spring.validation" — "Separates implementation from config"
```

DEMETER then structures these into her output contract, adding impact analysis and
writing them to the logbook and learnings files.

#### `rejection-feedback.ts` — Prompting User Explanation on Rejection

When a user rejects a tool call (permission = "ask", user picks "reject"), OpenCode returns
a bare "permission denied" error to the LLM. The agent has no idea WHY and will blindly
retry or give up. This hook bridges the gap.

```typescript
// Hook: event handler for permission.replied
event: async ({ event }) => {
  if (event.type !== "permission.replied") return
  const { response, tool, sessionID } = event.properties
  if (response !== "reject") return

  // Pre-fill user input with a template so they can explain naturally
  await ctx.client.tui.appendPrompt({
    body: { text: `Rejected ${tool} because: ` }
  })
}
```

After rejection, the user sees their input pre-filled with `Rejected edit because: ` and
types their reason. The agent sees this as a normal user message in the conversation and
adapts accordingly. No special parsing needed — it's natural language.

DEMETER's `decision-capture.ts` hook also watches for rejection patterns. When a user
message starts with "Rejected ... because:", the hook adds it to the decision buffer with
`type: "rejection"` so it appears in the work unit's `decisions.md`.

#### `harvest-reminder.ts` — Triggering DEMETER

Uses `tool.execute.after` on delegate_gaia calls. When GAIA completes implementation +
verification waves (HEPHAESTUS, ARTEMIS, AETHER, HADES), the hook injects a system
reminder: "Implementation complete. Delegate to DEMETER to harvest this session."

#### `context-aid-nudger.ts` — Proactive Skills/Tools Suggestions

Uses `chat.message` hook. GAIA proactively nudges sub-agents to use relevant skills/tools
for additional context when available. Suggestions are non-blocking and never required.

Example guidance injected into delegation prompt:
```
If relevant skills or custom tools are available in this environment, proactively use them
to improve context and quality. If unavailable, continue normally with built-in tools.
```

#### `todo-enforcer.ts` — TodoWrite Usage

Uses `tool.execute.after`. If GAIA delegates 3+ tasks without using todowrite,
injects a reminder: "You have multiple tasks in flight. Use todowrite to track them."

---

### Build System

Follows the same pattern as `opencode-multi-provider-plugin`:

```nix
# tools/opencode-gaia-plugin/default.nix
pkgs.buildNpmPackage {
  pname = "opencode-gaia-plugin";
  version = "0.1.0";
  src = ./.;
  npmDepsHash = "...";
  buildPhase = "npm run build";
  installPhase = ''
    mkdir -p $out
    cp -r dist/* $out/
    cp package.json $out/
    cp -r node_modules $out/
  '';
}
```

### Nix Module Changes

`modules/editors/opencode/default.nix` updates:

1. **Fix smallModel** bug: `zai-coding-plan` → `zhipuai-coding-plan`
2. **Add GAIA plugin** to plugins list (alongside gemini-auth)
3. **Keep native plan/build agents** and add `gaia` as optional orchestration primary
4. **Keep skills optional**: no hard dependency on named skills in plugin core
5. **Rewrite AGENTS_CONFIG.md** to lean guidance focused on delegation and autonomy

---

## The .gaia/ Workflow

### Directory Structure (per-project, user's choice to commit or gitignore)

Each unit of work gets its own folder. Plan, logbook, and decisions live together so
context is never scattered. When you switch tasks, you switch folders.

```
GAIA.md                    # Optional GAIA-specific instructions for this repository
.gaia/
├── config.jsonc              # Agent model overrides (optional, per-project)
├── gaia-init.md              # GAIA bootstrap context (/gaia-init output)
├── learnings.md              # Cross-project accumulated knowledge (global to repo)
├── auth-refactor/            # One work unit = one folder
│   ├── plan.md               # The plan for this work
│   ├── log.md                # Build journal for this work
│   └── decisions.md          # User decisions captured during this work
├── api-rate-limiting/        # Another active work unit
│   ├── plan.md
│   ├── log.md
│   └── decisions.md
└── archive/                  # Completed work units moved here
    └── 2026-01-15.jwt-impl/
        ├── plan.md
        ├── log.md
        └── decisions.md
```

**Why per-folder instead of per-file:**
- Switching tasks = reading a different folder, not scanning a monolith logbook
- Plans, logs, and decisions stay co-located — no cross-referencing needed
- Archiving is `mv .gaia/auth-refactor .gaia/archive/2026-02-06.auth-refactor`
- `gaia-init.md` provides persistent orchestration context (GAIA-specific "/init")
- `GAIA.md` is optional and carries GAIA-specific orchestration instructions
- `learnings.md` stays at root because it's cross-cutting (applies to all future work)
- Each folder is a self-contained record you can hand to someone (or future-you) and they
  understand the full story: what was planned, what happened, and what was decided

### Plan Template (`.gaia/{work-unit}/plan.md`)

```markdown
# {Title}

> Created: {date}  
> Status: draft | approved | in-progress | complete  
> Effort: quick | short | medium | large

## Goal
{What and why — 1-2 sentences}

## Context
{Background, constraints, related issues, prior art}

## Tasks
- [ ] {Specific task with file/location and assigned agent}
- [ ] {Another task}

## Done When
- [ ] {Verifiable condition — command to run, output to expect}

## Guardrails
- {What NOT to do}
- {Scope boundaries}
```

### Log Template (`.gaia/{work-unit}/log.md`)

Append-only. Each session adds a dated section.

```markdown
# Log

## {date} — {session summary}

### Done
- [x] {thing done} (agent: HEPHAESTUS, rev: {id})

### Issues
- {issue description}

### Learnings
- {reusable knowledge discovered}

### Next
- {what to do next}
```

### Decisions Template (`.gaia/{work-unit}/decisions.md`)

Populated from DEMETER's `decisions` output — every question tool interaction captured so
that coming back months later, you can trace WHY something was done a certain way.

```markdown
# Decisions

| Date | Question | Choice | Rationale | Impact |
|------|----------|--------|-----------|--------|
| {date} | {what was asked} | {what user chose} | {why, if given} | {what this affects} |
```

### Learnings (`.gaia/learnings.md` — global, cross-cutting)

```markdown
# Learnings

## {Category}
- {Lesson learned} — discovered during {work-unit} ({date})
```

### GAIA Init (`.gaia/gaia-init.md` — curated orchestration bootstrap)

`learnings.md` captures discovered knowledge; `gaia-init.md` captures enduring guidance that GAIA
should apply from the very start of each task.

```markdown
# GAIA Init

## Product Intent
- {What this repository optimizes for}

## Non-Negotiables
- {Rules GAIA must always respect}

## Architecture Anchors
- {Core modules/paths GAIA should treat as stable}

## Optional GAIA.md Notes
- {Repository-specific GAIA instructions that must be honored}

## Risk Hotspots
- {Areas requiring extra review depth}

## Collaboration Defaults
- Preferred profile: {pair_ramp|standard|...}
- Preferred cadence: {batch|wave|...}

## VCS Notes (Optional)
- {Project-specific workflow guidance, if any}
```

`/gaia-init` bootstraps this file and can refresh it later using curated learnings.

---

## Consolidated AGENTS.md (~100 lines)

This replaces the current 192-line AGENTS_CONFIG.md. Only rules that MUST be in every context window:

```markdown
# GAIA Agent System

## 1. VCS Detection (ALWAYS FIRST)
MINERVA detects VCS type during recon and returns it in `vcs_type`.
GAIA passes vcs_type to ALL downstream delegation prompts.
.jj/ → vcs_type: "jj", use JJ-aware commands and any available JJ guidance aids
.git/ → vcs_type: "git", use git commands
Agents NEVER hardcode git or jj — they use the VCS type from context.

## 2. GAIA Is The Orchestrator
You are GAIA. You NEVER write code or edit files yourself.
You route tasks to specialist sub-agents and verify their work.
delegate_gaia tool is your primary interface.

## 3. Sub-agent Roster
| Agent | Role | Use When |
|-------|------|----------|
| minerva | Recon/routing | Start of any task, repo mapping |
| apollo | Knowledge/patterns | Need conventions, prior art |
| eleuthia | Scaffolding | New files, interfaces, stubs |
| hephaestus | Implementation | Write actual code changes + refactoring |
| demeter | Historian | Document work, maintain logbook & learnings |
| artemis | Testing | Unit/integration tests |
| aether | Quality gates | Lint, typecheck, security |
| poseidon | Config/ops | CI, Docker, migrations |
| hades | Red-team | Find flaws, rollback strategy |

## 4. Delegation Protocol
Every delegate_gaia call MUST include:
1. TASK: one-sentence goal
2. CONTEXT: file paths, patterns to follow
3. MUST DO: explicit requirements
4. MUST NOT DO: forbidden actions
5. EXPECTED OUTCOME: success criteria
6. OPTIONAL AIDS: suggested skills/tools for context (non-blocking if unavailable)

## 5. Parallel Execution
Fire non-dependent agents simultaneously:
- minerva + apollo (always parallel for recon)
- artemis + aether + hades (parallel for verification)

## 6. Workflow
Each work unit gets its own folder in .gaia/:
- Plan: .gaia/{work-unit}/plan.md
- Log: .gaia/{work-unit}/log.md  
- Decisions: .gaia/{work-unit}/decisions.md
- GAIA init: .gaia/gaia-init.md (always-on orchestration context)
- Optional GAIA instructions: GAIA.md (repo-root)
- Learnings: .gaia/learnings.md (global, cross-cutting)
- Session tasks: todowrite tool (ephemeral)

## 7. Context Aids (Skills + Tools)
Agents auto-decide which skills/tools to use for the task context.
- Be proactive: if relevant skills/tools are available, use them for better context.
- Be resilient: if they are unavailable, continue with built-in capabilities.
- GAIA can suggest likely aids to sub-agents, but suggestions are never hard requirements.

## 8. Communication
Plain English. No filler. No AI-speak. Start working immediately.
```

---

## Collaboration System (Planning + Execution)

### The Problem

Most of the time, users want to approve each file edit and bash command (supervised mode).
But sometimes — especially during large implementation tasks with a solid plan — the user
wants to say "just get on with it" and let agents work to completion without interruption.

OpenCode's native permission system is static (set at startup, no mid-session changes).
The GAIA plugin adds a dynamic collaboration layer on top.

Users primarily interact with **collaboration profiles** (pair/agentic variants). Internally,
GAIA maps those profiles to engine controls (mode, visibility, interaction, cadence, review depth).

### Collaboration Knobs (Canonical)

These are the only collaboration controls the runtime uses:

| Knob | Values | Purpose |
|------|--------|---------|
| `profile` | `pair_live`, `pair_batched`, `pair_ramp`, `agentic_checkpoint`, `agentic_full`, `standard` | User-facing preset |
| `mode` | `supervised`, `autopilot`, `locked` | Permission posture |
| `visibility` | `live`, `checkpoint`, `quiet` | How much activity is surfaced |
| `interaction` | `standard`, `pair` | Checkpoint style |
| `checkinCadence` | `step`, `batch`, `wave`, `milestone` | Pause frequency |
| `reviewDepth` | `inline`, `diff`, `risk`, `deep_repo` | Breadth/depth of review |

Profile application is a deterministic mapping onto these knobs. Runtime logic should read/write
these knobs, not ad-hoc secondary flags.

### Task-Start Collaboration Handshake

At the start of each new work unit, GAIA asks the user how they want to collaborate for this
task (unless disabled via config). This makes pair-programming and agentic execution first-class
options per task, not global one-time choices.

Default handshake options:

1. **Pair Live** — supervised + live + pair interaction (step-level feedback)
2. **Pair Batched** — supervised + live + standard interaction (batch feedback)
3. **Pair Ramp** — pair for first N batches, then GAIA asks whether to switch agentic
4. **Agentic + Check-ins** — autopilot + checkpoint visibility
5. **Full Agentic** — autopilot + quiet visibility

If `startup.defaultProfile` is configured, GAIA proposes it first and asks for confirmation.
Users can override at any time with slash commands.

### Collaboration Profiles (user-facing)

| Profile | Intended workflow | Engine mapping (typical) |
|---------|-------------------|--------------------------|
| `pair_live` | Full pair programming, step-by-step | supervised + live + pair + cadence=step + review=inline |
| `pair_batched` | Pair programming with fewer pauses | supervised + live + standard + cadence=batch + review=diff |
| `pair_ramp` | Watch first few edits, then decide | starts pair_batched, then prompts for switch after warmup |
| `agentic_checkpoint` | Mostly autonomous with meaningful check-ins | autopilot + checkpoint + standard + cadence=wave + review=risk |
| `agentic_full` | Max speed autonomy | autopilot + quiet + standard + cadence=milestone + review=diff |
| `standard` | Balanced default | supervised + checkpoint + standard + cadence=wave + review=diff |

### Execution Engine Modes (advanced/internal)

| Mode | edit | write | bash (safe) | bash (dangerous) | Behavior |
|------|------|-------|-------------|------------------|----------|
| **supervised** (default) | ask | ask | ask | deny | User approves checkpoints; optional wave-scoped auto-approve |
| **autopilot** | allow | allow | allow | deny | Agents work freely, dangerous ops still blocked |
| **locked** | deny | deny | read-only | deny | Pure read-only analysis mode |

### Visibility Modes (How much the user sees live)

Autonomy and visibility are independent. You can run autopilot with full live visibility.

| Visibility | Behavior |
|------------|----------|
| **live** | Stream tool activity as it happens (delegations, edits, bash calls, outcomes). |
| **checkpoint** (default) | Show wave-level summaries at decision points. |
| **quiet** | Minimal output until major milestones/final summary. |

### Pair Programming Preset

For pair-programming style collaboration, enable `pair` interaction mode:

- **Mode preset**: `supervised`
- **Visibility preset**: `live`
- **Pacing**: micro-checkpoints after each edit/bash batch

This gives real-time visibility plus fast intervention points, so the human can steer changes
while they are being made instead of only at wave boundaries.

### Supervised Flow Enhancements (Human-in-the-Loop UX)

Supervised remains the default, but the UX should avoid excessive approval fatigue.
GAIA uses checkpoint-based supervision:

1. **Plan checkpoint** — user approves the plan/work-unit before execution starts.
2. **Execution wave checkpoint** — user approves starting an implementation wave.
3. **Verification checkpoint** — user approves running broader verification wave (tests/lints/review).
4. **Revision checkpoint** — user approves creating the VCS revision.

Within each approved wave, the plugin can temporarily auto-approve non-dangerous prompts and
revert back to strict supervised at wave end. This keeps the human in control at meaningful
decision boundaries rather than forcing confirmation for every low-level call.

Progressive trust flow is supported: users can watch the first few edits in `pair` or `live`
mode, then switch to `/autopilot` (or "Agentic + Check-ins") once they are happy with the
pattern. GAIA can suggest this transition, but the user decides.

`pair_ramp` automates this pattern: after `rampWarmupBatches` (default 2-3), GAIA pauses with
a recommendation and asks whether to continue pairing or switch to an agentic profile.

### Check-in Cadence and Review Depth

Execution collaboration is tuned with two independent controls:

| Control | Levels | Meaning |
|---------|--------|---------|
| **checkinCadence** | `step` / `batch` / `wave` / `milestone` | How often GAIA pauses for human feedback |
| **reviewDepth** | `inline` / `diff` / `risk` / `deep_repo` | How broad/deep each review pass should be |

Review depth definitions:
- `inline`: changed lines only, quick pair-programming feedback
- `diff`: full file diff review for touched files
- `risk`: diff + risk hotspots (auth, data, infra, migrations)
- `deep_repo`: repository-level impact review (dependencies, adjacent modules, regressions)

GAIA can suggest raising review depth when risk increases, but user choice wins.

**Dangerous ops denylist** (always denied regardless of mode):
```
sudo *, su *, rm -rf /*, dd *, fdisk *, mkfs *
terraform destroy *, kubectl delete namespace *
git push --force *, jj git push --force *
```

### Toggling: Slash Commands

| Command | Effect |
|---------|--------|
| `/autopilot` | Switch to autopilot mode for this session |
| `/supervised` | Switch back to supervised mode (default) |
| `/locked` | Switch to locked mode (read-only analysis) |
| `/live` | Show edits/bash/tool activity as they happen |
| `/checkpoint` | Show wave-level summaries (default visibility) |
| `/quiet` | Suppress live details, only major milestones |
| `/pair` | Pair-programming preset: supervised + live + micro-checkpoints |
| `/standard` | Exit pair preset, return to normal checkpoint pacing |
| `/next` | Continue from current pair-mode pause point |
| `/profile <pair_live|pair_batched|pair_ramp|agentic_checkpoint|agentic_full|standard>` | Apply a full collaboration profile |
| `/cadence <step|batch|wave|milestone>` | Set check-in frequency for this task |
| `/review <inline|diff|risk|deep_repo>` | Set repository review depth |
| `/gaia-init` | Create or refresh `.gaia/gaia-init.md` from template + curated learnings |

These work mid-session — no restart needed.

### Toggling: Config Presets

Set the default mode per-project in `.gaia/config.jsonc`:

```jsonc
{
  "mode": "supervised",  // "supervised" | "autopilot" | "locked"
  "visibility": "checkpoint", // "live" | "checkpoint" | "quiet"
  "interaction": "standard", // "standard" | "pair"
  "checkinCadence": "wave", // "step" | "batch" | "wave" | "milestone"
  "reviewDepth": "diff", // "inline" | "diff" | "risk" | "deep_repo"
  "gaiaContext": {
    "initFile": ".gaia/gaia-init.md",
    "gaiaInstructionFile": "GAIA.md",
    "useLearnings": true,
    "accountFor": ["Keep native plan/build behavior unchanged"],
    "avoid": ["VCS-specific assumptions in core orchestration"]
  },
  "wavePolicy": {
    "enforceWaveId": true,
    "boundaryRule": "implementation+basic_checks"
  },
  "autopilotSafeguards": {
    "maxToolCallsPerWave": 40,
    "maxWaveMinutes": 20,
    "maxBackgroundTasks": 3,
    "consecutiveFailureLimit": 3,
    "onFailureLimit": "checkpoint"
  },
  "startup": {
    "askAtTaskStart": true,
    "defaultProfile": "pair_ramp",
    "rampWarmupBatches": 2
  },
  "agents": { ... }
}
```

The config preset sets starting mode/visibility. Slash commands override them for the current session.

### Implementation

The plugin maintains `currentMode`, `currentVisibility`, `currentInteraction`, plus an
optional `approvedWave` state. Slash commands update these; GAIA's checkpoint confirmations
activate/deactivate approved waves.

Wave semantics (canonical):
- Every approved wave has a unique `wave_id`.
- GAIA includes `wave_id` in delegation prompts for all actions in that wave.
- Default wave boundary (`implementation+basic_checks`): a wave ends only after implementation
  step returns `ok=true` and baseline checks pass.
- Wave approvals never cross work-unit boundaries.

Two hooks enforce behavior:

**`permission.asked` event handler** (autopilot + supervised-wave approvals):
```typescript
event: async ({ event }) => {
  if (event.type !== "permission.asked") return
  const canAutoApprove =
    currentMode === "autopilot" ||
    (currentMode === "supervised" && approvedWave?.active === true)
  if (!canAutoApprove) return

  const { permissionID, sessionID, tool, args } = event.properties

  // Check against dangerous ops denylist
  if (isDangerousOp(tool, args)) return  // Let OpenCode show the prompt normally

  // Auto-approve for this prompt
  await ctx.client.session.permissions({
    path: { id: sessionID, permissionID },
    body: { response: "once" }
  })
}
```

`approvedWave` is cleared when GAIA marks the wave complete, when the user rejects an action,
when mode changes, or when the active work unit changes. This guarantees approvals do not leak.

### Autopilot Safety Rails

Autopilot still enforces execution budgets:

- `maxToolCallsPerWave`
- `maxWaveMinutes`
- `maxBackgroundTasks`

Stop condition:
- If failures reach `consecutiveFailureLimit`, GAIA exits autopilot behavior for the current wave
  and falls back per `onFailureLimit` (default: checkpoint + user decision).

**`pair-loop.ts` hook** (for on-the-fly feedback in pair mode):
```typescript
"tool.execute.after": async (input, output) => {
  if (currentInteraction !== "pair") return
  if (!["edit", "write", "bash"].includes(input.tool)) return

  // Stream concise activity item
  streamActivity(input, output)

  // Pause GAIA after each mutable batch until user says /next or gives feedback
  await setPairPause({
    reason: `${input.tool} batch complete`,
    prompt: "Review this step. Reply with feedback or /next to continue."
  })
}
```

In pair mode, the user can provide feedback immediately ("rename this", "undo that bash
command", "change approach") and GAIA reformulates the next delegation accordingly.

### Check-in Packet (What the user sees)

Each pair pause or checkpoint includes a concise check-in so feedback is informed, not guesswork:

1. **What changed**: files edited and high-level delta
2. **What ran**: bash commands executed and key outputs
3. **Why**: 1-2 sentence rationale for this batch
4. **Risk note**: any potential side effects
5. **Next step**: what GAIA plans to do if user says `/next`

User responses GAIA handles immediately:
- `"/next"` -> continue to next batch
- `"undo last"` -> delegate rollback/revert action
- `"change approach to ..."` -> replan next delegation with new constraints
- `"review this deeper"` -> trigger higher review depth before continuing

**`tool.execute.before` hook** (for locked mode enforcement):
```typescript
"tool.execute.before": async (input, output) => {
  if (currentMode !== "locked") return
  if (["edit", "write"].includes(input.tool)) {
    throw new Error("Locked mode: file modifications blocked. Use /supervised or /autopilot to unlock.")
  }
  if (input.tool === "bash" && !isReadOnlyBash(input.args)) {
    throw new Error("Locked mode: write operations blocked. Use /supervised or /autopilot to unlock.")
  }
}
```

**Toast notification** on mode switch:
```typescript
await ctx.client.tui.showToast({
  body: { message: `GAIA mode: ${mode.toUpperCase()}`, variant: mode === "autopilot" ? "warning" : "info" }
})
```

### How GAIA Adapts to Collaboration Settings

The `chat.message` hook injects current collaboration state into GAIA system context:
```
<gaia-collaboration profile="pair_ramp" mode="supervised" visibility="live" interaction="pair" cadence="batch" review="diff" />
```

GAIA adjusts her behavior:

| Mode | GAIA behavior |
|------|--------------|
| **supervised** | Uses checkpoints (plan/execution/verification/revision). Can run wave-scoped auto-approval after user confirms each wave. |
| **autopilot** | Creates plan, proceeds immediately through all waves. Reports final summary when done. |
| **locked** | Only delegates to read-only agents (MINERVA, APOLLO, HADES). Refuses editing agents with explanation. |

Interaction style further adjusts behavior:

| Interaction | GAIA behavior |
|-------------|---------------|
| **standard** | Wave-level pacing; checkpoints at plan/execution/verification/revision boundaries. |
| **pair** | Step-level pacing; pauses after each mutable batch and waits for feedback or `/next`. |

Check-in cadence and review depth further shape each pause:
- `checkinCadence` determines pause frequency (`step`/`batch`/`wave`/`milestone`)
- `reviewDepth` determines review breadth (`inline`/`diff`/`risk`/`deep_repo`)

### DEMETER Captures Collaboration Changes

When the user changes profile/mode/visibility/cadence/review, the `decision-capture.ts` hook records it:
```
type: "mode_switch"
question: "User changed collaboration settings"
answer: "autopilot"
impact: "Agents will proceed without per-action approval"
```

This appears in the work unit's `decisions.md` so the record shows when the user
handed over control and when they took it back.

DEMETER also captures supervised checkpoint approvals/rejections so future sessions can see
which waves were explicitly approved and where human intervention occurred.

In pair mode, DEMETER captures each on-the-fly feedback event (`type: "pair_feedback"`) so the
record shows how live human steering changed implementation direction.

---

## Optional Environment Extensions

GAIA and sub-agents can leverage project-specific skills and custom tools when present.
This is bring-your-own: the plugin does not require specific skill names or tool packages.

- If relevant skills/tools exist, agents should proactively use them for more context.
- If not present, agents continue normally using built-in tools and prompts.
- GAIA nudges sub-agents with suggestions, not requirements.

---

## Agent Prompt Design Principles

### Lean Prompts (Key Differentiator from OMO)

OMO's Sisyphus prompt is 530 lines. Hephaestus is 618 lines. Our prompts will be **50-100 lines each** because:

1. **Single responsibility**: Each agent does ONE thing well
2. **Contract-driven**: Output format is defined, not discovered
3. **No meta-instructions**: No "how to use tools" — the model already knows
4. **No behavior enforcement**: Hooks handle that, not prompt text
5. **Context injected dynamically**: Skills loaded per-task, not baked in

### Prompt Template (each agent follows this)

```markdown
You are {NAME} — {role description from HZD lore, 1 sentence}.

## Your Job
{2-3 sentences: what you do, what you return}

## Output Contract
Return your findings in this structure:
{typed contract fields}

## Rules
- {3-5 critical rules specific to this agent}

## You CANNOT
- {2-3 hard restrictions matching permission matrix}
```

---

## Implementation Plan

### Phase 0: Planning Artifacts (required before coding)
- Keep `project-gaia-plugin.md` (what/why) and `project-gaia-plugin-implementation-companion.md` (how) in sync.
- Treat implementation companion updates as part of planning, not an afterthought.
- Capture the `/gaia-init` bootstrap design (template, lifecycle, and learning-promotion rules) before runtime work begins.

### MVP Scope (P1, explicit)

MVP is intentionally smaller than the full architecture:

1. GAIA core orchestration + `delegate_gaia` (sync path).
2. Core sub-agents only: MINERVA, HEPHAESTUS, DEMETER.
3. `plan_gaia` minimal filesystem API for `.gaia/` workflow artifacts.
4. Decision capture + rejection capture flow into DEMETER outputs.
5. `/gaia-init` bootstrap workflow + optional `GAIA.md` support.
6. Non-overlap verification: native `plan` and `build` unchanged.

Everything else (full profile controls, rich pair-loop behavior, full 9-agent roster,
background orchestration manager) is P2+.

### Phase 1: Foundation (~1 session)
1. Create `tools/opencode-gaia-plugin/` directory structure
2. Set up `package.json`, `tsconfig.json`, build config
3. Implement `src/agents/types.ts` — all contracts, AgentModelConfig, trait types
4. Implement `src/config/schema.ts` — GaiaConfig Zod schema, AgentOverride types
5. Implement `src/config/defaults.ts` — AGENT_DEFAULTS with all models, fallbacks, temps
6. Implement `src/config/loader.ts` — load .gaia/config.jsonc + ~/.config/opencode/gaia.jsonc, merge
7. Implement `src/shared/models.ts` — resolveModel() with fallback chain + availability check
8. Implement `src/shared/permissions.ts` — permission matrix constants

### Phase 2: Core MVP Agents (~1 session)
9. Implement GAIA primary agent (`src/agents/gaia.ts`)
10. Implement MINERVA, HEPHAESTUS, DEMETER prompts first (50-100 lines each)
11. Implement agent registry (`src/agents/index.ts`) — factory that merges defaults + overrides

### Phase 3: Core MVP Tools + Hooks + Commands (~1-2 sessions)
12. Implement `delegate_gaia` + `collect_results` tools (`src/tools/delegate.ts`)
13. Implement `plan_gaia` tool (`src/tools/plan.ts`) with create/read/append operations
14. Implement hooks: decision-capture, rejection-feedback, harvest-reminder (MVP set)
15. Implement slash commands for MVP: `/gaia-init` (+ minimal mode toggle support if needed)

### Phase 4: Plugin Entry + Integration (~1 session)
16. Wire everything in `src/index.ts`
17. Package plugin for standalone OpenCode loading (repo-agnostic README + file-path install path)
18. Build host adapter `default.nix` derivation (dotfiles integration layer only)
19. Update opencode module to load the plugin via adapter wiring
20. Rewrite AGENTS_CONFIG.md
21. Ensure GAIA prompt nudges optional skills/tools without hard dependencies
22. Fix `smallModel` bug

### Phase 5: MVP Testing (~1 session)
23. `nix flake check` — verify Nix builds
24. Manual testing — try GAIA with real tasks
25. Non-overlap tests: native `plan`/`build` unaffected
26. Invalid JSON retry test + parse fallback metadata validation
27. Rejection capture + locked mode enforcement tests
28. Extraction smoke test: copy `tools/opencode-gaia-plugin/` to a separate repo and verify plugin boot

### Phase 6: Post-MVP Expansion (P2+)
29. Add remaining sub-agents (APOLLO, ELEUTHIA, ARTEMIS, AETHER, POSEIDON, HADES)
30. Add richer collaboration controls (`/profile`, `/cadence`, `/review`, `/pair`, `/next`)
31. Add full autopilot guardrails + background orchestration manager
32. Iterate on prompts and tune model assignments at scale

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| GLM 4.7 too weak for MINERVA recon | Bad task decomposition | Fallback to kimi-k2p5. Monitor quality, upgrade model if needed. |
| Parallel sessions overwhelm API quotas | Rate limits, failures | Limit to 3 concurrent background sessions. Add retry logic. |
| Autopilot runaway loops/costs | Excessive tool calls, noisy failures | Enforce budget caps + consecutive-failure stop condition with checkpoint fallback. |
| Agent contracts not followed by weaker models | Unparseable output | Include examples in prompts. GAIA handles malformed output gracefully. |
| Plugin SDK changes break us | Build failures | Pin @opencode-ai/plugin version. Keep plugin lean so updates are easy. |
| GAIA overthinks simple tasks | Slow for trivial work | Phase 0 classification routes trivial tasks directly to one agent. |
| Too many agents confuse GAIA | Wrong routing | Clear delegation table in GAIA prompt. Hooks remind on misrouting. |

---

## Open Questions (To Resolve During Implementation)

1. **Background task polling**: OMO uses `session.idle` events + BackgroundManager. Do we need that complexity or can we poll `session.messages()` in a loop?

2. **Context-aid nudging strategy**: How aggressively should GAIA suggest optional skills/tools to sub-agents without becoming noisy?

3. **GAIA model override**: GAIA defaults to `gpt-5.3-codex` but the user can Tab to change. Should the plugin enforce the default or respect the UI selection?

4. **Plan approval flow**: Should GAIA always create a plan for complex tasks and wait for user approval, or should it auto-proceed? (Probably configurable.)

5. **`/gaia-init` sourcing**: Should bootstrap include only curated template content, or template + auto-proposed entries from recent learnings (default: template + explicit promotions)?

6. **Default collaboration profile**: Should startup default to `pair_ramp` (watch first few edits, then suggest agentic) or `standard`?

7. **A/B implementation**: Your ChatGPT notes mentioned running HEPHAESTUS_A and HEPHAESTUS_B in parallel with different approaches. Worth building in Phase 1 or defer?

---

## Dependencies

### npm packages needed

```json
{
  "@opencode-ai/plugin": "^1.1.53",
  "@opencode-ai/sdk": "^1.1.53"
}
```

No other deps needed. We're lean.

### Nix integration

- Plugin built via `pkgs.buildNpmPackage` (same as gemini-auth plugin)
- Installed to `~/.config/opencode/plugin/gaia/` via `xdg.configFile`
- Registered in `opencode.json` via `cfg.plugins`

---

## Success Criteria

### MVP (P1) success criteria

- [ ] `nix flake check` passes
- [ ] GAIA appears as optional primary agent in OpenCode
- [ ] Native `plan` and `build` agents remain available and unchanged
- [ ] `delegate_gaia` tool is available to GAIA
- [ ] `delegate_gaia` returns metadata (`session_id`, `model_used`, `parsed_json`, `parse_error`)
- [ ] Invalid JSON retry path works and records parse failures safely
- [ ] `.gaia/{work-unit}/` folders are created and readable
- [ ] `.gaia/gaia-init.md` is bootstrapped via `/gaia-init`
- [ ] Optional `GAIA.md` is detected/applied when present and safely ignored when absent
- [ ] Core plugin runs when extracted into a standalone repo (no dotfiles module imports)
- [ ] Host adapter wiring remains separate from core plugin runtime
- [ ] Work-unit `log.md` updates after implementation tasks
- [ ] `/locked` blocks all modifications
- [ ] Rejection feedback pre-fills user input with explanation template
- [ ] DEMETER captures decisions, rejections, and collaboration-setting changes in decisions.md

### Post-MVP (P2+) success criteria

- [ ] Sub-agents execute with tuned models across full 9-agent roster
- [ ] Parallel execution works for recon and verification waves
- [ ] `/autopilot` budget caps + stop condition enforce safely
- [ ] `/supervised` restores per-action approval prompts outside approved waves
- [ ] GAIA asks collaboration mode at task start (or uses configured default profile)
- [ ] `/live`, `/profile`, `/cadence`, `/review` controls work reliably mid-session
- [ ] `/pair` enables step-level pauses with `/next` and check-in packets
- [ ] DEMETER captures pair-feedback interventions in decisions.md
- [ ] VCS-agnostic: works identically with JJ and git repos

---

## References

- **Implementation companion**: `.gaia/plans/project-gaia-plugin-implementation-companion.md`
- **MVP cut**: `.gaia/plans/project-gaia-plugin-mvp-cut.md`
- **Oh My OpenCode source**: `/tmp/oh-my-opencode/` (cloned for analysis)
- **OpenCode Plugin SDK**: `@opencode-ai/plugin` v1.1.53
- **Current Nix module**: `modules/editors/opencode/default.nix`
- **Current AGENTS.md**: `modules/editors/AGENTS_CONFIG.md`
- **HZD agent mapping**: ChatGPT conversation (linked in session history)
- **Available models**: `opencode models` output (non-Zen listed in plan)
