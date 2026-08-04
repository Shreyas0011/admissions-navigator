import { z } from "zod";

export const algorithmSchema = z.enum([
  "ROUND_ROBIN",
  "LEAST_WORKLOAD",
  "LEAST_ACTIVE",
  "MANUAL",
]);

export const policyTypeSchema = z.enum([
  "MANUAL",
  "ROUND_ROBIN",
  "LEAST_WORKLOAD",
  "LEAST_ACTIVE",
  "PROGRAMME_BASED",
  "HYBRID",
]);

export const policyInputSchema = z.object({
  id: z.string().uuid(),
  policyType: policyTypeSchema,
  autoAssign: z.boolean(),
  fallbackAlgorithm: algorithmSchema,
  defaultPoolId: z.string().uuid().nullable(),
});

export const poolInputSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2, "Pool name is required").max(120),
  description: z.string().trim().max(400).optional(),
  defaultAlgorithm: algorithmSchema,
  memberIds: z.array(z.string().uuid()).max(200).default([]),
});

export const ruleInputSchema = z.object({
  id: z.string().uuid().optional(),
  policyId: z.string().uuid(),
  programmeId: z.string().uuid().nullable(),
  poolId: z.string().uuid(),
  algorithm: algorithmSchema,
  priority: z.coerce.number().int().min(1).max(999).default(100),
});

export type PolicyInput = z.infer<typeof policyInputSchema>;
export type PoolInput = z.infer<typeof poolInputSchema>;
export type RuleInput = z.infer<typeof ruleInputSchema>;

export const policyCreateSchema = z.object({
  name: z.string().trim().min(2, "Policy name is required").max(120),
  policyType: policyTypeSchema,
  autoAssign: z.boolean().default(true),
  fallbackAlgorithm: algorithmSchema,
  defaultPoolId: z.string().uuid().nullable().default(null),
  priority: z.coerce.number().int().min(1).max(999).default(100),
});

export type PolicyCreateInput = z.infer<typeof policyCreateSchema>;
