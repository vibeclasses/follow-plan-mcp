import { z } from "zod";
import type {
  BaseItem,
  Priority,
  Status,
  PrioritizedItem,
  TimestampedItem,
  TaggedItem,
} from "./common.js";

export interface Feature
  extends BaseItem,
    PrioritizedItem,
    TimestampedItem,
    TaggedItem {
  status: Status;
  category: string;
  epic?: string;
  userStory: string;
  acceptanceCriteria: string[];
  estimatedStoryPoints?: number;
  actualStoryPoints?: number;
  relatedTasks: string[];
  relatedBugs: string[];
  stakeholders: string[];
  businessValue: string;
  technicalNotes: string[];
  designNotes: string[];
  testingNotes: string[];
}

export interface FeatureCreateInput {
  title: string;
  description: string;
  priority?: Priority;
  status?: Status;
  category: string;
  epic?: string;
  userStory: string;
  acceptanceCriteria?: string[];
  estimatedStoryPoints?: number;
  stakeholders?: string[];
  businessValue?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface FeatureUpdateInput extends Partial<FeatureCreateInput> {
  id: string;
  actualStoryPoints?: number;
  relatedTasks?: string[];
  relatedBugs?: string[];
  technicalNotes?: string[];
  designNotes?: string[];
  testingNotes?: string[];
}

export interface FeatureFilter {
  status?: Status | Status[];
  priority?: Priority | Priority[];
  category?: string;
  epic?: string;
  stakeholder?: string;
  tags?: string[];
  hasRelatedTasks?: boolean;
  hasRelatedBugs?: boolean;
}

// Zod schemas for validation
export const FeatureCreateSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  priority: z.enum(["low", "medium", "high", "critical"]).optional(),
  status: z
    .enum(["todo", "in-progress", "blocked", "completed", "cancelled"])
    .optional(),
  category: z.string().min(1),
  epic: z.string().optional(),
  userStory: z.string().min(1),
  acceptanceCriteria: z.array(z.string()).optional(),
  estimatedStoryPoints: z.number().positive().optional(),
  stakeholders: z.array(z.string()).optional(),
  businessValue: z.string().optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const FeatureUpdateSchema = FeatureCreateSchema.partial().extend({
  id: z.string(),
  actualStoryPoints: z.number().nonnegative().optional(),
  relatedTasks: z.array(z.string()).optional(),
  relatedBugs: z.array(z.string()).optional(),
  technicalNotes: z.array(z.string()).optional(),
  designNotes: z.array(z.string()).optional(),
  testingNotes: z.array(z.string()).optional(),
});

export type FeatureCreateInput_Validated = z.infer<typeof FeatureCreateSchema>;
export type FeatureUpdateInput_Validated = z.infer<typeof FeatureUpdateSchema>;
