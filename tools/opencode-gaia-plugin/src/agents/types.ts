export type AgentName =
  | "minerva"
  | "apollo"
  | "eleuthia"
  | "hephaestus"
  | "demeter"
  | "artemis"
  | "aether"
  | "poseidon"
  | "hades";

export type AgentKey = "gaia" | AgentName;
export type LeanAgentKey = "gaia" | "minerva" | "hephaestus" | "demeter";

export type VcsType = "jj" | "git" | "none";

export interface AgentEnvelope<TData, TAgent extends AgentKey = AgentName> {
  contract_version: "1.0";
  agent: TAgent;
  work_unit: string;
  session_id: string;
  vcs_type?: VcsType;
  ok: boolean;
  data: TData;
  errors: string[];
}

export interface GaiaData {
  next_actions: string[];
  delegations: string[];
  summary: string;
}

export interface MinervaData {
  repo_map: string;
  vcs_type: VcsType;
  plan: string[];
  risk_list: string[];
  suggested_agents: string[];
}

export interface ApolloData {
  conventions: string[];
  examples: string[];
  do_dont: { do: string[]; dont: string[] };
}

export interface EleuthiaData {
  files_created: string[];
  compile_status: "pass" | "fail" | "untested";
}

export interface HephaestusData {
  diff_summary: string;
  files_modified: string[];
  revision_ids: string[];
  notes: string[];
  refactoring_done: string[];
  known_issues: string[];
}

export interface DemeterDecision {
  type: "question" | "rejection" | "mode_switch" | "pair_feedback";
  question: string;
  answer: string;
  rationale?: string;
  impact: string;
}

export interface DemeterData {
  log_entry: string;
  decisions: DemeterDecision[];
  learnings: string[];
  plan_updates: string[];
  session_summary: string;
}

export interface ArtemisData {
  tests_added: string[];
  coverage_notes: string;
  pass_status: "pass" | "fail" | "partial";
}

export interface AetherData {
  checks_run: string[];
  failures: string[];
  fixes: string[];
  release_ready: boolean;
}

export interface PoseidonData {
  config_changes: string[];
  migrations: string[];
  deploy_notes: string;
}

export interface HadesVulnerability {
  issue: string;
  severity: "low" | "medium" | "high" | "critical";
  testable_scenario: string;
  suggested_fix_agent: "hephaestus" | "poseidon" | "artemis";
}

export interface HadesData {
  vulnerabilities: HadesVulnerability[];
  rollback_plan: string;
  minimal_patch: string;
  risk_level: "low" | "medium" | "high" | "critical";
}

export type GaiaOutput = AgentEnvelope<GaiaData, "gaia">;
export type MinervaOutput = AgentEnvelope<MinervaData, "minerva">;
export type ApolloOutput = AgentEnvelope<ApolloData, "apollo">;
export type EleuthiaOutput = AgentEnvelope<EleuthiaData, "eleuthia">;
export type HephaestusOutput = AgentEnvelope<HephaestusData, "hephaestus">;
export type DemeterOutput = AgentEnvelope<DemeterData, "demeter">;
export type ArtemisOutput = AgentEnvelope<ArtemisData, "artemis">;
export type AetherOutput = AgentEnvelope<AetherData, "aether">;
export type PoseidonOutput = AgentEnvelope<PoseidonData, "poseidon">;
export type HadesOutput = AgentEnvelope<HadesData, "hades">;

export interface AgentModelConfig {
  model: string;
  fallback: string[];
  temperature: number;
  reasoningEffort?: "low" | "medium" | "high";
  thinking?: {
    type: "enabled";
    budgetTokens: number;
  };
  maxTokens?: number;
}

export interface AgentRuntimeConfig {
  modelConfig: AgentModelConfig;
  prompt: string;
  disabled: boolean;
}
