import { z } from "zod";
import type {
  BaseItem,
  Priority,
  Status,
  Severity,
  PrioritizedItem,
  TimestampedItem,
  TaggedItem,
} from "./common.js";

export interface Bug
  extends BaseItem,
    PrioritizedItem,
    TimestampedItem,
    TaggedItem {
  status: Status;
  severity: Severity;
  component: string;
  version?: string;
  environment?: string;
  reporter: string;
  assignee?: string;
  stepsToReproduce: string[];
  expectedBehavior: string;
  actualBehavior: string;
  workaround?: string;
  relatedTasks: string[];
  relatedFeatures: string[];
  duplicateOf?: string;
  attachments: string[];
  testCases: string[];
}

export interface BugCreateInput {
  title: string;
  description: string;
  priority?: Priority;
  severity: Severity;
  component: string;
  version?: string;
  environment?: string;
  reporter: string;
  assignee?: string;
  stepsToReproduce?: string[];
  expectedBehavior: string;
  actualBehavior: string;
  workaround?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface BugUpdateInput extends Partial<BugCreateInput> {
  id: string;
  status?: Status;
  relatedTasks?: string[];
  relatedFeatures?: string[];
  duplicateOf?: string;
  attachments?: string[];
  testCases?: string[];
}

export interface BugFilter {
  status?: Status | Status[];
  priority?: Priority | Priority[];
  severity?: Severity | Severity[];
  component?: string;
  reporter?: string;
  assignee?: string;
  tags?: string[];
}

// Zod schemas for validation
export const BugCreateSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  priority: z.enum(["low", "medium", "high", "critical"]).optional(),
  severity: z.enum(["minor", "major", "critical", "blocker"]),
  component: z.string().min(1),
  version: z.string().optional(),
  environment: z.string().optional(),
  reporter: z.string(),
  assignee: z.string().optional(),
  stepsToReproduce: z.array(z.string()).optional(),
  expectedBehavior: z.string(),
  actualBehavior: z.string(),
  workaround: z.string().optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const BugUpdateSchema = BugCreateSchema.partial().extend({
  id: z.string(),
  status: z.enum(["todo", "in-progress", "blocked", "completed", "cancelled"]).optional(),
  relatedTasks: z.array(z.string()).optional(),
  relatedFeatures: z.array(z.string()).optional(),
  duplicateOf: z.string().optional(),
  attachments: z.array(z.string()).optional(),
  testCases: z.array(z.string()).optional(),
});

export type BugCreateInput_Validated = z.infer<typeof BugCreateSchema>;
export type BugUpdateInput_Validated = z.infer<typeof BugUpdateSchema>;
