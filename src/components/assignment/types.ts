import type { getEngineConsoleFn } from "@/domains/assignment/assignment.functions";

export type EngineConsole = Awaited<ReturnType<typeof getEngineConsoleFn>>;
export type EnginePolicy = EngineConsole["policies"][number];
export type EnginePool = EngineConsole["pools"][number];
export type EngineRule = EngineConsole["rules"][number];
export type EngineCounsellor = EngineConsole["counsellors"][number];
export type EngineProgramme = EngineConsole["programmes"][number];
export type EngineLogRow = EngineConsole["log"][number];

export const ALGORITHMS = ["ROUND_ROBIN", "LEAST_WORKLOAD", "LEAST_ACTIVE", "MANUAL"] as const;
export const POLICY_TYPES = [
  "MANUAL",
  "ROUND_ROBIN",
  "LEAST_WORKLOAD",
  "LEAST_ACTIVE",
  "PROGRAMME_BASED",
  "HYBRID",
] as const;
