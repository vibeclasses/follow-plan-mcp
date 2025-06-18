import { z } from "zod";
import type { BaseItem, TimestampedItem, TaggedItem } from "./common.js";

export type CascadeType =
  | "dependency"
  | "notification"
  | "automation"
  | "workflow";
export type CascadeAction =
  | "create"
  | "update"
  | "delete"
  | "status_change"
  | "assign"
  | "complete";
export type CascadeTarget =
  | "task"
  | "feature"
  | "bug"
  | "rule"
  | "message"
  | "prompt";

export interface Cascade extends BaseItem, TimestampedItem, TaggedItem {
  type: CascadeType;
  sourceType: CascadeTarget;
  sourceId?: string;
  targetType: CascadeTarget;
  targetId?: string;
  triggerAction: CascadeAction;
  cascadeActions: CascadeActionConfig[];
  conditions: CascadeCondition[];
  enabled: boolean;
  executionCount: number;
  lastExecuted?: string;
  successRate: number;
  retryAttempts: number;
  maxRetries: number;
}

export interface CascadeActionConfig {
  action: CascadeAction;
  targetField?: string;
  value?: unknown;
  template?: string;
  delay?: number;
  conditions?: CascadeCondition[];
}

export interface CascadeCondition {
  field: string;
  operator:
    | "equals"
    | "not_equals"
    | "contains"
    | "not_contains"
    | "greater_than"
    | "less_than"
    | "exists"
    | "not_exists";
  value: unknown;
  logicalOperator?: "AND" | "OR";
}

export interface CascadeCreateInput {
  title: string;
  description: string;
  type: CascadeType;
  sourceType: CascadeTarget;
  sourceId?: string;
  targetType: CascadeTarget;
  targetId?: string;
  triggerAction: CascadeAction;
  cascadeActions: CascadeActionConfig[];
  conditions?: CascadeCondition[];
  enabled?: boolean;
  maxRetries?: number;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface CascadeUpdateInput extends Partial<CascadeCreateInput> {
  id: string;
  executionCount?: number;
  lastExecuted?: string;
  successRate?: number;
  retryAttempts?: number;
}

export interface CascadeFilter {
  type?: CascadeType | CascadeType[];
  sourceType?: CascadeTarget | CascadeTarget[];
  targetType?: CascadeTarget | CascadeTarget[];
  triggerAction?: CascadeAction | CascadeAction[];
  enabled?: boolean;
  recentlyExecuted?: boolean;
  tags?: string[];
}

export interface CascadeExecution {
  cascadeId: string;
  triggered: string;
  sourceItem: { type: CascadeTarget; id: string };
  targetItem?: { type: CascadeTarget; id: string };
  actions: CascadeActionResult[];
  success: boolean;
  duration: number;
  error?: string;
}

export interface CascadeActionResult {
  action: CascadeAction;
  success: boolean;
  result?: unknown;
  error?: string;
  duration: number;
}

// Zod schemas for validation
export const CascadeCreateSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  type: z.enum(["dependency", "notification", "automation", "workflow"]),
  sourceType: z.enum(["task", "feature", "bug", "rule", "message", "prompt"]),
  sourceId: z.string().optional(),
  targetType: z.enum(["task", "feature", "bug", "rule", "message", "prompt"]),
  targetId: z.string().optional(),
  triggerAction: z.enum([
    "create",
    "update",
    "delete",
    "status_change",
    "assign",
    "complete",
  ]),
  cascadeActions: z.array(
    z.object({
      action: z.enum([
        "create",
        "update",
        "delete",
        "status_change",
        "assign",
        "complete",
      ]),
      targetField: z.string().optional(),
      value: z.unknown().optional(),
      template: z.string().optional(),
      delay: z.number().nonnegative().optional(),
      conditions: z
        .array(
          z.object({
            field: z.string(),
            operator: z.enum([
              "equals",
              "not_equals",
              "contains",
              "not_contains",
              "greater_than",
              "less_than",
              "exists",
              "not_exists",
            ]),
            value: z.unknown(),
            logicalOperator: z.enum(["AND", "OR"]).optional(),
          })
        )
        .optional(),
    })
  ),
  conditions: z
    .array(
      z.object({
        field: z.string(),
        operator: z.enum([
          "equals",
          "not_equals",
          "contains",
          "not_contains",
          "greater_than",
          "less_than",
          "exists",
          "not_exists",
        ]),
        value: z.unknown(),
        logicalOperator: z.enum(["AND", "OR"]).optional(),
      })
    )
    .optional(),
  enabled: z.boolean().optional(),
  maxRetries: z.number().nonnegative().optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const CascadeUpdateSchema = CascadeCreateSchema.partial().extend({
  id: z.string(),
  executionCount: z.number().nonnegative().optional(),
  lastExecuted: z.string().datetime().optional(),
  successRate: z.number().min(0).max(1).optional(),
  retryAttempts: z.number().nonnegative().optional(),
});

export type CascadeCreateInput_Validated = z.infer<typeof CascadeCreateSchema>;
export type CascadeUpdateInput_Validated = z.infer<typeof CascadeUpdateSchema>;
