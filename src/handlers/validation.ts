import { z } from "zod";
import {
  TaskCreateSchema,
  TaskUpdateSchema,
  FeatureCreateSchema,
  FeatureUpdateSchema,
  BugCreateSchema,
  BugUpdateSchema,
  RuleCreateSchema,
  RuleUpdateSchema,
  MessageCreateSchema,
  MessageUpdateSchema,
} from "../types/index.js";

/**
 * Input validation for MCP tool calls
 */

const SearchSchema = z.object({
  query: z.string().min(1),
  type: z
    .enum(["task", "feature", "bug", "rule", "message", "prompt"])
    .optional(),
  tags: z.array(z.string()).optional(),
  priority: z.enum(["low", "medium", "high", "critical"]).optional(),
  status: z
    .enum(["todo", "in-progress", "blocked", "completed", "cancelled"])
    .optional(),
  limit: z.number().int().positive().max(100).optional(),
  offset: z.number().int().nonnegative().optional(),
  sortBy: z.enum(["relevance", "created", "updated", "priority"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

const IdSchema = z.object({
  id: z.string().min(1),
});

const BackupSchema = z.object({
  path: z.string().optional(),
});

const RestoreSchema = z.object({
  path: z.string().min(1),
});

const SyncSchema = z.object({
  force: z.boolean().optional(),
});

const ListSchema = z.object({
  limit: z.number().int().positive().max(100).optional(),
  offset: z.number().int().nonnegative().optional(),
  status: z
    .enum(["todo", "in-progress", "blocked", "completed", "cancelled"])
    .optional(),
  priority: z.enum(["low", "medium", "high", "critical"]).optional(),
  assignee: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

const ThreadSchema = z.object({
  threadId: z.string().min(1),
  limit: z.number().int().positive().max(100).optional(),
  offset: z.number().int().nonnegative().optional(),
});

const ReactionSchema = z.object({
  messageId: z.string().min(1),
  reaction: z.string().min(1),
  userId: z.string().min(1),
});

const RelatedItemSchema = z.object({
  messageId: z.string().min(1),
  itemType: z.enum(["task", "feature", "bug", "rule"]),
  itemId: z.string().min(1),
  itemTitle: z.string().optional(),
});

const MentionsSchema = z.object({
  userId: z.string().min(1),
  limit: z.number().int().positive().max(100).optional(),
  offset: z.number().int().nonnegative().optional(),
});

export async function validateInput(
  toolName: string,
  args: Record<string, unknown>
): Promise<Record<string, unknown>> {
  try {
    switch (toolName) {
      // Task operations
      case "create_task":
        return TaskCreateSchema.parse(args);
      case "update_task":
        return TaskUpdateSchema.parse(args);
      case "delete_task":
      case "get_task":
        return IdSchema.parse(args);
      case "list_tasks":
        return ListSchema.parse(args);

      // Feature operations
      case "create_feature":
        return FeatureCreateSchema.parse(args);
      case "update_feature":
        return FeatureUpdateSchema.parse(args);
      case "delete_feature":
      case "get_feature":
        return IdSchema.parse(args);
      case "list_features":
        return ListSchema.parse(args);

      // Bug operations
      case "create_bug":
        return BugCreateSchema.parse(args);
      case "update_bug":
        return BugUpdateSchema.parse(args);
      case "delete_bug":
      case "get_bug":
        return IdSchema.parse(args);
      case "list_bugs":
        return ListSchema.parse(args);

      // Rule operations
      case "create_rule":
        return RuleCreateSchema.parse(args);
      case "update_rule":
        return RuleUpdateSchema.parse(args);
      case "delete_rule":
      case "get_rule":
        return IdSchema.parse(args);
      case "list_rules":
        return ListSchema.parse(args);

      // Message operations
      case "create_message":
        return MessageCreateSchema.parse(args);
      case "update_message":
        return MessageUpdateSchema.parse(args);
      case "delete_message":
      case "get_message":
        return IdSchema.parse(args);
      case "list_messages":
        return ListSchema.parse(args);
      case "get_thread":
        return ThreadSchema.parse(args);
      case "get_replies":
        return IdSchema.parse(args);
      case "add_reaction":
      case "remove_reaction":
        return ReactionSchema.parse(args);
      case "add_related_item":
        return RelatedItemSchema.extend({ itemTitle: z.string().min(1) }).parse(
          args
        );
      case "remove_related_item":
        return RelatedItemSchema.omit({ itemTitle: true }).parse(args);
      case "get_mentions":
        return MentionsSchema.parse(args);
      case "get_thread_summary":
        return ThreadSchema.omit({ limit: true, offset: true }).parse(args);

      // Search operations
      case "search":
      case "advanced_search":
        return SearchSchema.parse(args);

      // Persistence operations
      case "backup_database":
        return BackupSchema.parse(args);
      case "restore_database":
        return RestoreSchema.parse(args);
      case "sync_filesystem":
        return SyncSchema.parse(args);

      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join(", ");
      throw new Error(`Validation failed for ${toolName}: ${issues}`);
    }
    throw error;
  }
}
