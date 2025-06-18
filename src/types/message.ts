import { z } from "zod";
import type { BaseItem, TimestampedItem, TaggedItem } from "./common.js";

export type MessageType =
  | "note"
  | "decision"
  | "meeting"
  | "update"
  | "question"
  | "idea";
export type MessageSender = "user" | "system" | "bot" | "external";

export interface Message extends BaseItem, TimestampedItem, TaggedItem {
  type: MessageType;
  sender: MessageSender;
  senderName?: string;
  content: string;
  threadId?: string;
  replyTo?: string;
  mentions: string[];
  attachments: string[];
  reactions: Record<string, string[]>;
  edited?: string;
  editHistory: MessageEdit[];
  relatedItems: RelatedItem[];
}

export interface MessageEdit {
  timestamp: string;
  editor: string;
  previousContent: string;
  reason?: string;
}

export interface RelatedItem {
  type: "task" | "feature" | "bug" | "rule";
  id: string;
  title: string;
}

export interface MessageCreateInput {
  title?: string;
  content: string;
  type?: MessageType;
  sender: MessageSender;
  senderName?: string;
  threadId?: string;
  replyTo?: string;
  mentions?: string[];
  attachments?: string[];
  relatedItems?: RelatedItem[];
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface MessageUpdateInput extends Partial<MessageCreateInput> {
  id: string;
  reason?: string;
}

export interface MessageFilter {
  type?: MessageType | MessageType[];
  sender?: MessageSender | MessageSender[];
  senderName?: string;
  threadId?: string;
  mentions?: string;
  hasAttachments?: boolean;
  dateAfter?: string;
  dateBefore?: string;
  tags?: string[];
}

// Zod schemas for validation
export const MessageCreateSchema = z.object({
  title: z.string().max(200).optional(),
  content: z.string().min(1),
  type: z
    .enum(["note", "decision", "meeting", "update", "question", "idea"])
    .optional(),
  sender: z.enum(["user", "system", "bot", "external"]),
  senderName: z.string().optional(),
  threadId: z.string().optional(),
  replyTo: z.string().optional(),
  mentions: z.array(z.string()).optional(),
  attachments: z.array(z.string()).optional(),
  relatedItems: z
    .array(
      z.object({
        type: z.enum(["task", "feature", "bug", "rule"]),
        id: z.string(),
        title: z.string(),
      })
    )
    .optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const MessageUpdateSchema = MessageCreateSchema.partial().extend({
  id: z.string(),
  reason: z.string().optional(),
});

export type MessageCreateInput_Validated = z.infer<typeof MessageCreateSchema>;
export type MessageUpdateInput_Validated = z.infer<typeof MessageUpdateSchema>;
