import { z } from "zod";
import type {
  BaseItem,
  Priority,
  Status,
  PrioritizedItem,
  TimestampedItem,
  TaggedItem,
} from "./common.js";

export interface Task
  extends BaseItem,
    PrioritizedItem,
    TimestampedItem,
    TaggedItem {
  status: Status;
  estimatedHours?: number;
  actualHours?: number;
  dueDate?: string;
  dependencies: string[];
  blockers: string[];
  relatedFeatures: string[];
  relatedBugs: string[];
  progress: number;
  notes: string[];
  attachments: string[];
}

export interface TaskCreateInput {
  title: string;
  description: string;
  priority?: Priority;
  status?: Status;
  assignee?: string;
  estimatedHours?: number;
  dueDate?: string;
  dependencies?: string[];
  relatedFeatures?: string[];
  relatedBugs?: string[];
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface TaskUpdateInput extends Partial<TaskCreateInput> {
  id: string;
  actualHours?: number;
  progress?: number;
  notes?: string[];
  attachments?: string[];
  blockers?: string[];
}

export interface TaskFilter {
  status?: Status | Status[];
  priority?: Priority | Priority[];
  assignee?: string;
  tags?: string[];
  dueBefore?: string;
  dueAfter?: string;
  hasBlockers?: boolean;
  hasDependencies?: boolean;
}

// Zod schemas for validation
export const TaskCreateSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  priority: z.enum(["low", "medium", "high", "critical"]).optional(),
  status: z
    .enum(["todo", "in-progress", "blocked", "completed", "cancelled"])
    .optional(),
  assignee: z.string().optional(),
  estimatedHours: z.number().positive().optional(),
  dueDate: z.string().datetime().optional(),
  dependencies: z.array(z.string()).optional(),
  relatedFeatures: z.array(z.string()).optional(),
  relatedBugs: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const TaskUpdateSchema = TaskCreateSchema.partial().extend({
  id: z.string(),
  actualHours: z.number().nonnegative().optional(),
  progress: z.number().min(0).max(100).optional(),
  notes: z.array(z.string()).optional(),
  attachments: z.array(z.string()).optional(),
  blockers: z.array(z.string()).optional(),
});

export type TaskCreateInput_Validated = z.infer<typeof TaskCreateSchema>;
export type TaskUpdateInput_Validated = z.infer<typeof TaskUpdateSchema>;
