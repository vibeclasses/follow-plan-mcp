import { DatabaseService } from "./database.js";
import { generateId } from "../utils/id-generator.js";
import { logger } from "../utils/logger.js";
import type {
  Message,
  MessageCreateInput,
  MessageUpdateInput,
  MessageFilter,
  MessageEdit,
  RelatedItem,
} from "../types/index.js";

/**
 * Service for managing messages and communication logs
 */
export class MessageService {
  constructor(private db: DatabaseService) {}

  async create(input: MessageCreateInput): Promise<Message> {
    const now = new Date().toISOString();
    const id = generateId();

    const message: Message = {
      id,
      title: input.title || this.generateTitleFromContent(input.content),
      description:
        input.content.substring(0, 200) +
        (input.content.length > 200 ? "..." : ""),
      type: input.type || "note",
      sender: input.sender,
      content: input.content,
      mentions: input.mentions || [],
      attachments: input.attachments || [],
      reactions: {},
      editHistory: [],
      relatedItems: input.relatedItems || [],
      tags: input.tags || [],
      metadata: input.metadata || {},
      created: now,
      updated: now,
      ...(input.senderName !== undefined && { senderName: input.senderName }),
      ...(input.threadId !== undefined && { threadId: input.threadId }),
      ...(input.replyTo !== undefined && { replyTo: input.replyTo }),
    };

    const dbRecord = {
      id: message.id,
      title: message.title,
      content: message.content,
      type: message.type,
      sender: message.sender,
      sender_name: message.senderName,
      thread_id: message.threadId,
      reply_to: message.replyTo,
      mentions: JSON.stringify(message.mentions),
      attachments: JSON.stringify(message.attachments),
      reactions: JSON.stringify(message.reactions),
      edited: message.edited,
      edit_history: JSON.stringify(message.editHistory),
      related_items: JSON.stringify(message.relatedItems),
      tags: JSON.stringify(message.tags),
      metadata: JSON.stringify(message.metadata),
      created: message.created,
      updated: message.updated,
    };

    await this.db.create("messages", dbRecord);

    logger.info(`Created message: ${message.title} (${message.id})`);
    return message;
  }

  async update(id: string, input: MessageUpdateInput): Promise<Message | null> {
    const existing = await this.findById(id);
    if (!existing) {
      return null;
    }

    const now = new Date().toISOString();

    // Create edit history entry if content is being changed
    const editHistory = [...existing.editHistory];
    if (input.content && input.content !== existing.content) {
      const edit: MessageEdit = {
        timestamp: now,
        editor: input.senderName || input.sender || "system",
        previousContent: existing.content,
        ...(input.reason !== undefined && { reason: input.reason }),
      };
      editHistory.push(edit);
    }

    const updated: Message = {
      ...existing,
      ...input,
      id, // Ensure ID doesn't change
      title: input.title || existing.title,
      editHistory,
      updated: now,
    };

    // Only add edited timestamp if content was actually changed
    if (input.content && input.content !== existing.content) {
      updated.edited = now;
    }

    const dbRecord = {
      title: updated.title,
      content: updated.content,
      type: updated.type,
      sender: updated.sender,
      sender_name: updated.senderName,
      thread_id: updated.threadId,
      reply_to: updated.replyTo,
      mentions: JSON.stringify(updated.mentions),
      attachments: JSON.stringify(updated.attachments),
      reactions: JSON.stringify(updated.reactions),
      edited: updated.edited,
      edit_history: JSON.stringify(updated.editHistory),
      related_items: JSON.stringify(updated.relatedItems),
      tags: JSON.stringify(updated.tags),
      metadata: JSON.stringify(updated.metadata),
      updated: updated.updated,
    };

    const success = await this.db.update("messages", id, dbRecord);

    if (success) {
      logger.info(`Updated message: ${updated.title} (${id})`);
      return updated;
    }

    return null;
  }

  async delete(id: string): Promise<boolean> {
    const message = await this.findById(id);
    if (!message) {
      return false;
    }

    const success = await this.db.delete("messages", id);

    if (success) {
      logger.info(`Deleted message: ${message.title} (${id})`);
    }

    return success;
  }

  async findById(id: string): Promise<Message | null> {
    const record = await this.db.findById("messages", id);
    if (!record) {
      return null;
    }

    return this.mapDbRecordToMessage(record);
  }

  async findMany(
    filter?: MessageFilter,
    limit?: number,
    offset?: number
  ): Promise<Message[]> {
    const where: Record<string, unknown> = {};

    if (filter?.type) {
      if (Array.isArray(filter.type)) {
        where.type = filter.type[0];
      } else {
        where.type = filter.type;
      }
    }

    if (filter?.sender) {
      if (Array.isArray(filter.sender)) {
        where.sender = filter.sender[0];
      } else {
        where.sender = filter.sender;
      }
    }

    if (filter?.senderName) {
      where.sender_name = filter.senderName;
    }

    if (filter?.threadId) {
      where.thread_id = filter.threadId;
    }

    const records = await this.db.findMany(
      "messages",
      where,
      "created DESC",
      limit,
      offset
    );
    return records.map((record) => this.mapDbRecordToMessage(record));
  }

  async findByThread(
    threadId: string,
    limit?: number,
    offset?: number
  ): Promise<Message[]> {
    const records = await this.db.findMany(
      "messages",
      { thread_id: threadId },
      "created ASC",
      limit,
      offset
    );
    return records.map((record) => this.mapDbRecordToMessage(record));
  }

  async findReplies(messageId: string): Promise<Message[]> {
    const records = await this.db.findMany(
      "messages",
      { reply_to: messageId },
      "created ASC"
    );
    return records.map((record) => this.mapDbRecordToMessage(record));
  }

  async addReaction(
    messageId: string,
    reaction: string,
    userId: string
  ): Promise<boolean> {
    const message = await this.findById(messageId);
    if (!message) {
      return false;
    }

    const reactions = { ...message.reactions };
    if (!reactions[reaction]) {
      reactions[reaction] = [];
    }

    if (!reactions[reaction].includes(userId)) {
      reactions[reaction].push(userId);
    }

    const success = await this.db.update("messages", messageId, {
      reactions: JSON.stringify(reactions),
      updated: new Date().toISOString(),
    });

    if (success) {
      logger.info(
        `Added reaction ${reaction} to message ${messageId} by ${userId}`
      );
    }

    return success;
  }

  async removeReaction(
    messageId: string,
    reaction: string,
    userId: string
  ): Promise<boolean> {
    const message = await this.findById(messageId);
    if (!message) {
      return false;
    }

    const reactions = { ...message.reactions };
    if (reactions[reaction]) {
      reactions[reaction] = reactions[reaction].filter((id) => id !== userId);
      if (reactions[reaction].length === 0) {
        delete reactions[reaction];
      }
    }

    const success = await this.db.update("messages", messageId, {
      reactions: JSON.stringify(reactions),
      updated: new Date().toISOString(),
    });

    if (success) {
      logger.info(
        `Removed reaction ${reaction} from message ${messageId} by ${userId}`
      );
    }

    return success;
  }

  async addRelatedItem(
    messageId: string,
    relatedItem: RelatedItem
  ): Promise<boolean> {
    const message = await this.findById(messageId);
    if (!message) {
      return false;
    }

    // Check if relation already exists
    const exists = message.relatedItems.some(
      (item) => item.type === relatedItem.type && item.id === relatedItem.id
    );

    if (exists) {
      return true;
    }

    const updatedRelatedItems = [...message.relatedItems, relatedItem];
    const success = await this.db.update("messages", messageId, {
      related_items: JSON.stringify(updatedRelatedItems),
      updated: new Date().toISOString(),
    });

    if (success) {
      logger.info(
        `Added related item ${relatedItem.type}:${relatedItem.id} to message ${messageId}`
      );
    }

    return success;
  }

  async removeRelatedItem(
    messageId: string,
    itemType: string,
    itemId: string
  ): Promise<boolean> {
    const message = await this.findById(messageId);
    if (!message) {
      return false;
    }

    const updatedRelatedItems = message.relatedItems.filter(
      (item) => !(item.type === itemType && item.id === itemId)
    );

    const success = await this.db.update("messages", messageId, {
      related_items: JSON.stringify(updatedRelatedItems),
      updated: new Date().toISOString(),
    });

    if (success) {
      logger.info(
        `Removed related item ${itemType}:${itemId} from message ${messageId}`
      );
    }

    return success;
  }

  async findByMention(
    userId: string,
    limit?: number,
    offset?: number
  ): Promise<Message[]> {
    // This would require a more complex query to search within the mentions JSON array
    // For now, we'll fetch all messages and filter in memory
    const allMessages = await this.findMany(undefined, 1000); // Increased limit for filtering
    const mentionedMessages = allMessages.filter((message) =>
      message.mentions.includes(userId)
    );

    // Apply pagination
    const start = offset || 0;
    const end = start + (limit || 50);
    return mentionedMessages.slice(start, end);
  }

  async getThreadSummary(threadId: string): Promise<{
    messageCount: number;
    participants: string[];
    lastActivity: string;
    firstMessage: Message | null;
    lastMessage: Message | null;
  }> {
    const messages = await this.findByThread(threadId);

    if (messages.length === 0) {
      return {
        messageCount: 0,
        participants: [],
        lastActivity: "",
        firstMessage: null,
        lastMessage: null,
      };
    }

    const participants = Array.from(
      new Set(messages.map((m) => m.senderName || m.sender))
    );

    return {
      messageCount: messages.length,
      participants,
      lastActivity: messages[messages.length - 1]?.created || "",
      firstMessage: messages[0] || null,
      lastMessage: messages[messages.length - 1] || null,
    };
  }

  private generateTitleFromContent(content: string): string {
    // Extract first sentence or first 50 characters
    const firstSentence = content.split(/[.!?]/)[0];
    if (firstSentence && firstSentence.length <= 50) {
      return firstSentence.trim();
    }

    return content.substring(0, 50).trim() + (content.length > 50 ? "..." : "");
  }

  private mapDbRecordToMessage(record: Record<string, unknown>): Message {
    const message: Message = {
      id: record.id as string,
      title: record.title as string,
      description:
        (record.content as string).substring(0, 200) +
        ((record.content as string).length > 200 ? "..." : ""),
      type: record.type as Message["type"],
      sender: record.sender as Message["sender"],
      content: record.content as string,
      mentions: JSON.parse((record.mentions as string) || "[]"),
      attachments: JSON.parse((record.attachments as string) || "[]"),
      reactions: JSON.parse((record.reactions as string) || "{}"),
      editHistory: JSON.parse((record.edit_history as string) || "[]"),
      relatedItems: JSON.parse((record.related_items as string) || "[]"),
      tags: JSON.parse((record.tags as string) || "[]"),
      metadata: JSON.parse((record.metadata as string) || "{}"),
      created: record.created as string,
      updated: record.updated as string,
    };

    // Only add optional properties if they have values
    if (record.sender_name !== null && record.sender_name !== undefined) {
      message.senderName = record.sender_name as string;
    }
    if (record.thread_id !== null && record.thread_id !== undefined) {
      message.threadId = record.thread_id as string;
    }
    if (record.reply_to !== null && record.reply_to !== undefined) {
      message.replyTo = record.reply_to as string;
    }
    if (record.edited !== null && record.edited !== undefined) {
      message.edited = record.edited as string;
    }

    return message;
  }
}
