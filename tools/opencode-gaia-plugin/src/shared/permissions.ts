import type { AgentKey } from "../agents/types.js";

export type PermissionLevel = "allow" | "ask" | "deny" | "gaia-only";

export interface AgentPermissions {
  read: PermissionLevel;
  edit: PermissionLevel;
  write: PermissionLevel;
  bash: PermissionLevel;
  task: PermissionLevel;
  webfetch: PermissionLevel;
}

export const AGENT_PERMISSION_MATRIX: Record<AgentKey, AgentPermissions> = {
  gaia: {
    read: "allow",
    edit: "deny",
    write: "deny",
    bash: "ask",
    task: "allow",
    webfetch: "allow",
  },
  minerva: {
    read: "allow",
    edit: "deny",
    write: "deny",
    bash: "ask",
    task: "deny",
    webfetch: "deny",
  },
  apollo: {
    read: "allow",
    edit: "deny",
    write: "deny",
    bash: "ask",
    task: "deny",
    webfetch: "allow",
  },
  eleuthia: {
    read: "allow",
    edit: "ask",
    write: "ask",
    bash: "ask",
    task: "deny",
    webfetch: "deny",
  },
  hephaestus: {
    read: "allow",
    edit: "ask",
    write: "ask",
    bash: "ask",
    task: "deny",
    webfetch: "deny",
  },
  demeter: {
    read: "allow",
    edit: "gaia-only",
    write: "gaia-only",
    bash: "ask",
    task: "deny",
    webfetch: "deny",
  },
  artemis: {
    read: "allow",
    edit: "ask",
    write: "ask",
    bash: "ask",
    task: "deny",
    webfetch: "deny",
  },
  aether: {
    read: "allow",
    edit: "deny",
    write: "deny",
    bash: "allow",
    task: "deny",
    webfetch: "deny",
  },
  poseidon: {
    read: "allow",
    edit: "ask",
    write: "ask",
    bash: "ask",
    task: "deny",
    webfetch: "deny",
  },
  hades: {
    read: "allow",
    edit: "deny",
    write: "deny",
    bash: "ask",
    task: "deny",
    webfetch: "deny",
  },
};

const DANGEROUS_PATTERNS: RegExp[] = [
  /^sudo\b/i,
  /^su\b/i,
  /^rm\s+-rf\s+\/$/i,
  /^dd\b/i,
  /^fdisk\b/i,
  /^mkfs\b/i,
  /^terraform\s+destroy\b/i,
  /^kubectl\s+delete\s+namespace\b/i,
  /^\S+(?:\s+\S+)?\s+push\s+.*--force\b/i,
];

export function isDangerousBashCommand(command: string): boolean {
  const normalized = command.trim();
  return DANGEROUS_PATTERNS.some((pattern) => pattern.test(normalized));
}
