import { z } from 'zod';
import type { BaseItem, TimestampedItem, TaggedItem } from './common.js';

export type PromptType = 'system' | 'user' | 'template' | 'context' | 'cascade';
export type PromptScope = 'global' | 'project' | 'feature' | 'task' | 'bug';

export interface Prompt extends BaseItem, TimestampedItem, TaggedItem {
  type: PromptType;
  scope: PromptScope;
  content: string;
  variables: PromptVariable[];
  conditions: PromptCondition[];
  priority: number;
  enabled: boolean;
  usageCount: number;
  lastUsed?: string;
  successRate?: number;
  parentPrompt?: string;
  childPrompts: string[];
}

export interface PromptVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  required: boolean;
  defaultValue?: unknown;
  validation?: string;
}

export interface PromptCondition {
  field: string;
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'regex' | 'exists';
  value: unknown;
  description: string;
  logicalOperator?: 'AND' | 'OR';
}

export interface PromptCreateInput {
  title: string;
  description: string;
  type: PromptType;
  scope: PromptScope;
  content: string;
  variables?: PromptVariable[];
  conditions?: PromptCondition[];
  priority?: number;
  enabled?: boolean;
  parentPrompt?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface PromptUpdateInput extends Partial<PromptCreateInput> {
  id: string;
  usageCount?: number;
  lastUsed?: string;
  successRate?: number;
  childPrompts?: string[];
}

export interface PromptFilter {
  type?: PromptType | PromptType[];
  scope?: PromptScope | PromptScope[];
  enabled?: boolean;
  parentPrompt?: string;
  hasChildren?: boolean;
  recentlyUsed?: boolean;
  tags?: string[];
}

export interface PromptExecution {
  promptId: string;
  executed: string;
  variables: Record<string, unknown>;
  result: string;
  success: boolean;
  duration: number;
  tokens?: number;
  feedback?: string;
  error?: string;
}

// Zod schemas for validation
export const PromptVariableSchema = z.object({
  name: z.string(),
  type: z.enum(['string', 'number', 'boolean', 'array', 'object']),
  description: z.string(),
  required: z.boolean(),
  defaultValue: z.unknown().optional(),
  validation: z.string().optional()
});

export const PromptConditionSchema = z.object({
  field: z.string(),
  operator: z.enum(['equals', 'contains', 'startsWith', 'endsWith', 'regex', 'exists']),
  value: z.unknown(),
  description: z.string()
});

export const PromptCreateSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  type: z.enum(['system', 'user', 'template', 'context', 'cascade']),
  scope: z.enum(['global', 'project', 'feature', 'task', 'bug']),
  content: z.string().min(1),
  variables: z.array(PromptVariableSchema).optional(),
  conditions: z.array(PromptConditionSchema).optional(),
  priority: z.number().int().min(0).max(100).optional(),
  enabled: z.boolean().optional(),
  parentPrompt: z.string().optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional()
});

export const PromptUpdateSchema = PromptCreateSchema.partial().extend({
  id: z.string(),
  usageCount: z.number().int().nonnegative().optional(),
  lastUsed: z.string().datetime().optional(),
  successRate: z.number().min(0).max(1).optional(),
  childPrompts: z.array(z.string()).optional()
});

export type PromptCreateInput_Validated = z.infer<typeof PromptCreateSchema>;
export type PromptUpdateInput_Validated = z.infer<typeof PromptUpdateSchema>;