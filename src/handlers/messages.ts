import type { MessageService } from "../services/messages";
import type {
  MessageCreateInput_Validated,
  MessageUpdateInput_Validated,
  MessageFilter,
  Message,
  MessageCreateInput,
  MessageUpdateInput,
  RelatedItem,
} from "../types/index.js";

/**
 * Message handlers for MCP server
 */
export function createMessageHandlers(messageService: MessageService) {
  return {
    // Create a new message
    createMessage: async (args: MessageCreateInput_Validated) => {
      // Create a clean object with only defined properties
      const createInput: MessageCreateInput = {
        content: args.content,
        sender: args.sender,
      };
      
      // Only add optional properties if they're defined
      if (args.title !== undefined) createInput.title = args.title;
      if (args.type !== undefined) createInput.type = args.type;
      if (args.senderName !== undefined) createInput.senderName = args.senderName;
      if (args.threadId !== undefined) createInput.threadId = args.threadId;
      if (args.replyTo !== undefined) createInput.replyTo = args.replyTo;
      if (args.mentions !== undefined) createInput.mentions = args.mentions;
      if (args.attachments !== undefined) createInput.attachments = args.attachments;
      if (args.relatedItems !== undefined) createInput.relatedItems = args.relatedItems;
      if (args.tags !== undefined) createInput.tags = args.tags;
      if (args.metadata !== undefined) createInput.metadata = args.metadata;
      
      const message = await messageService.create(createInput);
      return {
        content: [
          {
            type: "text",
            text: `Created message: ${message.title} (${message.id})\nType: ${message.type}\nSender: ${message.senderName || message.sender}\nContent: ${message.content.substring(0, 100)}${message.content.length > 100 ? "..." : ""}`,
          },
        ],
      };
    },

    // Update an existing message
    updateMessage: async (args: MessageUpdateInput_Validated) => {
      if (!args.id) {
        throw new Error("Message ID is required");
      }
      
      // Create a clean update object with only defined properties
      const updateInput: MessageUpdateInput = {
        id: args.id
      };
      
      // Only add optional properties if they're defined
      if (args.title !== undefined) updateInput.title = args.title;
      if (args.content !== undefined) updateInput.content = args.content;
      if (args.type !== undefined) updateInput.type = args.type;
      if (args.tags !== undefined) updateInput.tags = args.tags;
      if (args.metadata !== undefined) updateInput.metadata = args.metadata;
      if (args.attachments !== undefined) updateInput.attachments = args.attachments;
      if (args.mentions !== undefined) updateInput.mentions = args.mentions;
      if (args.relatedItems !== undefined) updateInput.relatedItems = args.relatedItems;
      if (args.reason !== undefined) updateInput.reason = args.reason;
      
      const message = await messageService.update(args.id, updateInput);
      if (!message) {
        throw new Error(`Message not found: ${args.id}`);
      }
      return {
        content: [
          {
            type: "text",
            text: `Updated message: ${message.title} (${message.id})${message.edited ? "\n(Edited)" : ""}`,
          },
        ],
      };
    },

    // Get a message by ID
    getMessage: async (args: { id: string }) => {
      if (!args.id) {
        throw new Error("Message ID is required");
      }
      const message = await messageService.findById(args.id);
      if (!message) {
        throw new Error(`Message not found: ${args.id}`);
      }

      const relatedItemsText =
        message.relatedItems.length > 0
          ? `\nRelated Items: ${message.relatedItems.map((item) => `${item.type}:${item.title}`).join(", ")}`
          : "";

      const reactionsText =
        Object.keys(message.reactions).length > 0
          ? `\nReactions: ${Object.entries(message.reactions)
              .map(([emoji, users]) => `${emoji} (${users.length})`)
              .join(", ")}`
          : "";

      const editedText = message.edited
        ? `\nLast Edited: ${message.edited}`
        : "";

      return {
        content: [
          {
            type: "text",
            text: `**${message.title}**\n\n${message.content}\n\nType: ${message.type}\nSender: ${message.senderName || message.sender}\nCreated: ${message.created}${editedText}${relatedItemsText}${reactionsText}`,
          },
        ],
      };
    },

    // List messages with optional filters
    listMessages: async (args: {
      type?: string;
      sender?: string;
      senderName?: string;
      threadId?: string;
      limit?: number;
      offset?: number;
      hasAttachments?: boolean;
      dateAfter?: string;
      dateBefore?: string;
      tags?: string[];
    }) => {
      // Create filter object with only defined properties
      const filter: MessageFilter = {};
      
      // Add required properties with type casting if needed
      if (args.type !== undefined) filter.type = args.type as any;
      if (args.sender !== undefined) filter.sender = args.sender as any;
      
      // Only add optional properties if they're defined
      if (args.senderName !== undefined) filter.senderName = args.senderName;
      if (args.threadId !== undefined) filter.threadId = args.threadId;
      if (args.hasAttachments !== undefined) filter.hasAttachments = args.hasAttachments;
      if (args.dateAfter !== undefined) filter.dateAfter = args.dateAfter;
      if (args.dateBefore !== undefined) filter.dateBefore = args.dateBefore;
      if (args.tags !== undefined) filter.tags = args.tags;

      const messages = await messageService.findMany(
        filter,
        args.limit,
        args.offset
      );

      if (messages.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: "No messages found matching the specified criteria.",
            },
          ],
        };
      }

      const messageList = messages
        .map((m) => {
          const threadText = m.threadId ? ` [Thread: ${m.threadId}]` : "";
          const replyText = m.replyTo ? ` [Reply to: ${m.replyTo}]` : "";
          return `- **${m.title}** (${m.type}) - ${m.senderName || m.sender}${threadText}${replyText}\n  ${m.content.substring(0, 80)}${m.content.length > 80 ? "..." : ""}`;
        })
        .join("\n\n");

      return {
        content: [
          {
            type: "text",
            text: `Found ${messages.length} messages:\n\n${messageList}`,
          },
        ],
      };
    },

    // Delete a message
    deleteMessage: async (args: { id: string }) => {
      const success = await messageService.delete(args.id);
      if (!success) {
        throw new Error(`Message not found: ${args.id}`);
      }
      return {
        content: [
          {
            type: "text",
            text: `Deleted message: ${args.id}`,
          },
        ],
      };
    },

    // Get messages in a thread
    getThread: async (args: {
      threadId: string;
      limit?: number;
      offset?: number;
    }) => {
      const messages = await messageService.findByThread(
        args.threadId,
        args.limit,
        args.offset
      );
      const summary = await messageService.getThreadSummary(args.threadId);

      if (messages.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `No messages found in thread: ${args.threadId}`,
            },
          ],
        };
      }

      const threadInfo = `**Thread Summary**\nMessages: ${summary.messageCount}\nParticipants: ${summary.participants.join(", ")}\nLast Activity: ${summary.lastActivity}\n\n`;

      const messageList = messages
        .map((m, index) => {
          const replyText = m.replyTo ? ` [Reply to: ${m.replyTo}]` : "";
          return `${index + 1}. **${m.senderName || m.sender}** (${m.created})${replyText}\n   ${m.content}`;
        })
        .join("\n\n");

      return {
        content: [
          {
            type: "text",
            text: `${threadInfo}**Messages:**\n\n${messageList}`,
          },
        ],
      };
    },

    // Get replies to a specific message
    getReplies: async (args: { messageId: string }) => {
      const replies = await messageService.findReplies(args.messageId);

      if (replies.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `No replies found for message: ${args.messageId}`,
            },
          ],
        };
      }

      const replyList = replies
        .map(
          (r, index) =>
            `${index + 1}. **${r.senderName || r.sender}** (${r.created})\n   ${r.content}`
        )
        .join("\n\n");

      return {
        content: [
          {
            type: "text",
            text: `Found ${replies.length} replies:\n\n${replyList}`,
          },
        ],
      };
    },

    // Add reaction to a message
    addReaction: async (args: {
      messageId: string;
      reaction: string;
      userId: string;
    }) => {
      const success = await messageService.addReaction(
        args.messageId,
        args.reaction,
        args.userId
      );
      if (!success) {
        throw new Error(`Message not found: ${args.messageId}`);
      }
      return {
        content: [
          {
            type: "text",
            text: `Added reaction ${args.reaction} to message ${args.messageId}`,
          },
        ],
      };
    },

    // Remove reaction from a message
    removeReaction: async (args: {
      messageId: string;
      reaction: string;
      userId: string;
    }) => {
      const success = await messageService.removeReaction(
        args.messageId,
        args.reaction,
        args.userId
      );
      if (!success) {
        throw new Error(`Message not found: ${args.messageId}`);
      }
      return {
        content: [
          {
            type: "text",
            text: `Removed reaction ${args.reaction} from message ${args.messageId}`,
          },
        ],
      };
    },

    // Add related item to a message
    addRelatedItem: async (args: {
      messageId: string;
      itemType: "task" | "feature" | "bug" | "rule";
      itemId: string;
      itemTitle: string;
    }) => {
      const relatedItem: RelatedItem = {
        type: args.itemType,
        id: args.itemId,
        title: args.itemTitle,
      };

      const success = await messageService.addRelatedItem(
        args.messageId,
        relatedItem
      );
      if (!success) {
        throw new Error(`Message not found: ${args.messageId}`);
      }
      return {
        content: [
          {
            type: "text",
            text: `Added related ${args.itemType} "${args.itemTitle}" to message ${args.messageId}`,
          },
        ],
      };
    },

    // Remove related item from a message
    removeRelatedItem: async (args: {
      messageId: string;
      itemType: string;
      itemId: string;
    }) => {
      const success = await messageService.removeRelatedItem(
        args.messageId,
        args.itemType,
        args.itemId
      );
      if (!success) {
        throw new Error(`Message not found: ${args.messageId}`);
      }
      return {
        content: [
          {
            type: "text",
            text: `Removed related ${args.itemType} from message ${args.messageId}`,
          },
        ],
      };
    },

    // Get messages that mention a specific user
    getMentions: async (args: {
      userId: string;
      limit?: number;
      offset?: number;
    }) => {
      const messages = await messageService.findByMention(
        args.userId,
        args.limit,
        args.offset
      );

      if (messages.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `No messages found mentioning user: ${args.userId}`,
            },
          ],
        };
      }

      const messageList = messages
        .map((m) => {
          const threadText = m.threadId ? ` [Thread: ${m.threadId}]` : "";
          return `- **${m.title}** by ${m.senderName || m.sender} (${m.created})${threadText}\n  ${m.content.substring(0, 80)}${m.content.length > 80 ? "..." : ""}`;
        })
        .join("\n\n");

      return {
        content: [
          {
            type: "text",
            text: `Found ${messages.length} messages mentioning ${args.userId}:\n\n${messageList}`,
          },
        ],
      };
    },

    // Get conversation summary for a thread
    getThreadSummary: async (args: { threadId: string }) => {
      const summary = await messageService.getThreadSummary(args.threadId);

      if (summary.messageCount === 0) {
        return {
          content: [
            {
              type: "text",
              text: `Thread not found or has no messages: ${args.threadId}`,
            },
          ],
        };
      }

      const firstMessageText = summary.firstMessage
        ? `\n**First Message:** ${summary.firstMessage.content.substring(0, 100)}${summary.firstMessage.content.length > 100 ? "..." : ""}`
        : "";

      const lastMessageText = summary.lastMessage
        ? `\n**Last Message:** ${summary.lastMessage.content.substring(0, 100)}${summary.lastMessage.content.length > 100 ? "..." : ""}`
        : "";

      return {
        content: [
          {
            type: "text",
            text: `**Thread Summary for ${args.threadId}**\n\nTotal Messages: ${summary.messageCount}\nParticipants: ${summary.participants.join(", ")}\nLast Activity: ${summary.lastActivity}${firstMessageText}${lastMessageText}`,
          },
        ],
      };
    },
  };
}

// Export tool definitions for messages
export const MESSAGE_TOOLS = [
  {
    name: "create_message",
    description: "Create a new message or communication log",
    inputSchema: {
      type: "object",
      properties: {
        content: { type: "string", description: "Message content" },
        title: { type: "string", description: "Message title (optional)" },
        type: {
          type: "string",
          enum: ["note", "decision", "meeting", "update", "question", "idea"],
        },
        sender: { type: "string", enum: ["user", "system", "bot", "external"] },
        senderName: { type: "string", description: "Display name of sender" },
        threadId: {
          type: "string",
          description: "Thread ID for grouping messages",
        },
        replyTo: {
          type: "string",
          description: "ID of message being replied to",
        },
        mentions: {
          type: "array",
          items: { type: "string" },
          description: "User IDs mentioned in message",
        },
        attachments: {
          type: "array",
          items: { type: "string" },
          description: "File attachments",
        },
        relatedItems: {
          type: "array",
          items: {
            type: "object",
            properties: {
              type: {
                type: "string",
                enum: ["task", "feature", "bug", "rule"],
              },
              id: { type: "string" },
              title: { type: "string" },
            },
            required: ["type", "id", "title"],
          },
        },
        tags: { type: "array", items: { type: "string" } },
      },
      required: ["content", "sender"],
    },
  },
  {
    name: "update_message",
    description: "Update an existing message",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Message ID" },
        content: { type: "string", description: "Updated content" },
        title: { type: "string", description: "Updated title" },
        reason: { type: "string", description: "Reason for edit" },
      },
      required: ["id"],
    },
  },
  {
    name: "get_message",
    description: "Get a message by ID",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Message ID" },
      },
      required: ["id"],
    },
  },
  {
    name: "list_messages",
    description: "List messages with optional filters",
    inputSchema: {
      type: "object",
      properties: {
        type: {
          type: "string",
          enum: ["note", "decision", "meeting", "update", "question", "idea"],
        },
        sender: { type: "string", enum: ["user", "system", "bot", "external"] },
        senderName: { type: "string" },
        threadId: { type: "string" },
        hasAttachments: { type: "boolean" },
        dateAfter: { type: "string" },
        dateBefore: { type: "string" },
        tags: { type: "array", items: { type: "string" } },
        limit: { type: "number", minimum: 1, maximum: 100 },
        offset: { type: "number", minimum: 0 },
      },
    },
  },
  {
    name: "delete_message",
    description: "Delete a message",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Message ID" },
      },
      required: ["id"],
    },
  },
  {
    name: "get_thread",
    description: "Get all messages in a thread",
    inputSchema: {
      type: "object",
      properties: {
        threadId: { type: "string", description: "Thread ID" },
        limit: { type: "number", minimum: 1, maximum: 100 },
        offset: { type: "number", minimum: 0 },
      },
      required: ["threadId"],
    },
  },
  {
    name: "get_replies",
    description: "Get replies to a specific message",
    inputSchema: {
      type: "object",
      properties: {
        messageId: { type: "string", description: "Message ID" },
      },
      required: ["messageId"],
    },
  },
  {
    name: "add_reaction",
    description: "Add reaction to a message",
    inputSchema: {
      type: "object",
      properties: {
        messageId: { type: "string", description: "Message ID" },
        reaction: { type: "string", description: "Reaction emoji or text" },
        userId: { type: "string", description: "User ID adding reaction" },
      },
      required: ["messageId", "reaction", "userId"],
    },
  },
  {
    name: "remove_reaction",
    description: "Remove reaction from a message",
    inputSchema: {
      type: "object",
      properties: {
        messageId: { type: "string", description: "Message ID" },
        reaction: { type: "string", description: "Reaction emoji or text" },
        userId: { type: "string", description: "User ID removing reaction" },
      },
      required: ["messageId", "reaction", "userId"],
    },
  },
  {
    name: "add_related_item",
    description: "Add related item to a message",
    inputSchema: {
      type: "object",
      properties: {
        messageId: { type: "string", description: "Message ID" },
        itemType: { type: "string", enum: ["task", "feature", "bug", "rule"] },
        itemId: { type: "string", description: "Item ID" },
        itemTitle: { type: "string", description: "Item title" },
      },
      required: ["messageId", "itemType", "itemId", "itemTitle"],
    },
  },
  {
    name: "remove_related_item",
    description: "Remove related item from a message",
    inputSchema: {
      type: "object",
      properties: {
        messageId: { type: "string", description: "Message ID" },
        itemType: { type: "string", enum: ["task", "feature", "bug", "rule"] },
        itemId: { type: "string", description: "Item ID" },
      },
      required: ["messageId", "itemType", "itemId"],
    },
  },
  {
    name: "get_mentions",
    description: "Get messages that mention a specific user",
    inputSchema: {
      type: "object",
      properties: {
        userId: {
          type: "string",
          description: "User ID to search for mentions",
        },
        limit: { type: "number", minimum: 1, maximum: 100 },
        offset: { type: "number", minimum: 0 },
      },
      required: ["userId"],
    },
  },
  {
    name: "get_thread_summary",
    description: "Get summary information for a thread",
    inputSchema: {
      type: "object",
      properties: {
        threadId: { type: "string", description: "Thread ID" },
      },
      required: ["threadId"],
    },
  },
];
