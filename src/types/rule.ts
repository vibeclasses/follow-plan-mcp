import { z } from "zod";
import type {
  BaseItem,
  RuleType,
  TimestampedItem,
  TaggedItem,
} from "./common.js";

export interface Rule extends BaseItem, TimestampedItem, TaggedItem {
  type: RuleType;
  category: string;
  condition: string;
  action: string;
  enabled: boolean;
  scope: string[];
  exceptions: string[];
  validationScript?: string;
  automationScript?: string;
  triggerEvents: string[];
  lastTriggered?: string;
  triggerCount: number;
}

export interface RuleCreateInput {
  title: string;
  description: string;
  type: RuleType;
  category: string;
  condition: string;
  action: string;
  enabled?: boolean;
  scope?: string[];
  exceptions?: string[];
  validationScript?: string;
  automationScript?: string;
  triggerEvents?: string[];
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface RuleUpdateInput extends Partial<RuleCreateInput> {
  id: string;
  lastTriggered?: string;
  triggerCount?: number;
}

export interface RuleFilter {
  type?: RuleType | RuleType[];
  category?: string;
  enabled?: boolean;
  scope?: string;
  tags?: string[];
  recentlyTriggered?: boolean;
}

export interface RuleExecution {
  ruleId: string;
  triggered: string;
  context: Record<string, unknown>;
  result: "success" | "failure" | "skipped";
  message?: string;
  duration: number;
}

// Zod schemas for validation
export const RuleCreateSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  type: z.enum(["validation", "automation", "guideline", "constraint"]),
  category: z.string().min(1),
  condition: z.string().min(1),
  action: z.string().min(1),
  enabled: z.boolean().optional(),
  scope: z.array(z.string()).optional(),
  exceptions: z.array(z.string()).optional(),
  validationScript: z.string().optional(),
  automationScript: z.string().optional(),
  triggerEvents: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const RuleUpdateSchema = RuleCreateSchema.partial().extend({
  id: z.string(),
  lastTriggered: z.string().datetime().optional(),
  triggerCount: z.number().nonnegative().optional(),
});

export type RuleCreateInput_Validated = z.infer<typeof RuleCreateSchema>;
export type RuleUpdateInput_Validated = z.infer<typeof RuleUpdateSchema>;
