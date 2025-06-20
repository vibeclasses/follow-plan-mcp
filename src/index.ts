#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import util from "util";
import { promises as fs } from "fs";
import path from "path";
import { DatabaseService } from "./services/database.js";
import { TaskService } from "./services/tasks.js";
import { FeatureService } from "./services/features.js";
import { BugService } from "./services/bugs.js";
import { MessageService } from "./services/messages.js";
import { SearchService } from "./services/search.js";
import { PersistenceService } from "./services/persistence.js";
import { validateInput } from "./handlers/validation.js";
import { createResourceHandlers } from "./handlers/resources.js";
import { createToolHandlers } from "./handlers/tools.js";
import { createMessageHandlers } from "./handlers/messages.js";
import { logger } from "./utils/logger.js";
import { debugLogger } from "./utils/debug-logger.js";
import type { PlanStructure } from "./types/index.js";

/**
 * Follow Plan MCP Server
 *
 * A comprehensive Model Context Protocol server for intelligent project planning
 * and task management with SQLite persistence and full-text search capabilities.
 */
export class FollowPlanServer {
  private server: Server;
  private projectPath: string;
  private planStructure: PlanStructure;
  private databaseService: DatabaseService;
  private taskService: TaskService;
  private featureService: FeatureService;
  private bugService: BugService;
  private messageService: MessageService;
  private searchService: SearchService;
  private persistenceService: PersistenceService;
  private isInitialized = false;

  constructor(projectPath: string) {
    this.projectPath = path.resolve(projectPath);
    this.planStructure = this.createPlanStructure();
    this.server = new Server(
      {
        name: "follow-plan-mcp",
        version: "1.0.0",
      },
      {
        capabilities: {
          resources: {},
          tools: {},
        },
      }
    );

    // Initialize services
    this.databaseService = new DatabaseService(this.planStructure.databasePath);
    this.taskService = new TaskService(this.databaseService);
    this.featureService = new FeatureService(this.databaseService);
    this.bugService = new BugService(this.databaseService);
    this.messageService = new MessageService(this.databaseService);
    this.searchService = new SearchService(this.databaseService);
    this.persistenceService = new PersistenceService(
      this.databaseService,
      this.planStructure
    );

    this.setupHandlers();
  }

  private createPlanStructure(): PlanStructure {
    const planDir = path.join(this.projectPath, ".follow-plan");
    return {
      indexPath: path.join(planDir, "index.md"),
      tasksDir: path.join(planDir, "tasks"),
      featuresDir: path.join(planDir, "features"),
      bugsDir: path.join(planDir, "bugs"),
      rulesDir: path.join(planDir, "rules"),
      workflowsDir: path.join(planDir, "workflows"),
      changelogDir: path.join(planDir, "changelog"),
      tmpDir: path.join(planDir, "tmp"),
      databasePath: path.join(planDir, "database.db"),
    };
  }

  private setupHandlers(): void {
    // Create handler instances
    const resourceHandlers = createResourceHandlers(
      this.taskService,
      this.featureService,
      this.bugService,
      this.searchService,
      this.planStructure
    );

    const toolHandlers = createToolHandlers(
      this.taskService,
      this.featureService,
      this.bugService,
      this.searchService,
      this.persistenceService
    );

    const messageHandlers = createMessageHandlers(this.messageService);

    // List resources handler
    this.server.setRequestHandler(
      ListResourcesRequestSchema,
      async (request) => {
        logger.debug(
          `📥 ListResourcesRequestSchema handler called with:`,
          request.params
        );
        return resourceHandlers.listResources();
      }
    );

    // Read resource handler
    this.server.setRequestHandler(
      ReadResourceRequestSchema,
      async (request) => {
        logger.debug(
          `📥 ReadResourceRequestSchema handler called with:`,
          request.params
        );
        return resourceHandlers.readResource(request.params.uri);
      }
    );

    // List tools handler
    this.server.setRequestHandler(ListToolsRequestSchema, async (request) => {
      logger.debug(
        `📥 ListToolsRequestSchema handler called with:`,
        request.params
      );
      return toolHandlers.listTools();
    });

    // Call tool handler
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      logger.debug(
        `📥 CallToolRequestSchema handler called with:`,
        request.params
      );
      const { name, arguments: args } = request.params;

      try {
        // Validate input based on tool
        const validatedArgs = await validateInput(name, args || {});

        // Route to appropriate handler
        switch (name) {
          // Task operations
          case "create_task":
            return toolHandlers.createTask(validatedArgs);
          case "update_task":
            return toolHandlers.updateTask(validatedArgs);
          case "delete_task":
            return toolHandlers.deleteTask(validatedArgs);
          case "get_task":
            return toolHandlers.getTask(validatedArgs);
          case "list_tasks":
            return toolHandlers.listTasks(validatedArgs);

          // Feature operations
          case "create_feature":
            return toolHandlers.createFeature(validatedArgs);
          case "update_feature":
            return toolHandlers.updateFeature(validatedArgs);
          case "delete_feature":
            return toolHandlers.deleteFeature(validatedArgs);
          case "get_feature":
            return toolHandlers.getFeature(validatedArgs);
          case "list_features":
            return toolHandlers.listFeatures(validatedArgs);

          // Bug operations
          case "create_bug":
            return toolHandlers.createBug(validatedArgs);
          case "update_bug":
            return toolHandlers.updateBug(validatedArgs);
          case "delete_bug":
            return toolHandlers.deleteBug(validatedArgs);
          case "get_bug":
            return toolHandlers.getBug(validatedArgs);
          case "list_bugs":
            return toolHandlers.listBugs(validatedArgs);

          // Message operations
          case "create_message":
            return messageHandlers.createMessage(validatedArgs as any);
          case "update_message":
            return messageHandlers.updateMessage(validatedArgs as any);
          case "delete_message":
            return messageHandlers.deleteMessage(
              validatedArgs as { id: string }
            );
          case "get_message":
            return messageHandlers.getMessage(validatedArgs as { id: string });
          case "list_messages":
            return messageHandlers.listMessages(validatedArgs as any);
          case "get_thread":
            return messageHandlers.getThread(
              validatedArgs as {
                threadId: string;
                limit?: number;
                offset?: number;
              }
            );
          case "get_replies":
            return messageHandlers.getReplies(
              validatedArgs as { messageId: string }
            );
          case "add_reaction":
            return messageHandlers.addReaction(
              validatedArgs as {
                messageId: string;
                reaction: string;
                userId: string;
              }
            );
          case "remove_reaction":
            return messageHandlers.removeReaction(
              validatedArgs as {
                messageId: string;
                reaction: string;
                userId: string;
              }
            );
          case "add_related_item":
            return messageHandlers.addRelatedItem(
              validatedArgs as {
                messageId: string;
                itemType: "task" | "feature" | "bug" | "rule";
                itemId: string;
                itemTitle: string;
              }
            );
          case "remove_related_item":
            return messageHandlers.removeRelatedItem(
              validatedArgs as {
                messageId: string;
                itemType: string;
                itemId: string;
              }
            );
          case "get_mentions":
            return messageHandlers.getMentions(
              validatedArgs as {
                userId: string;
                limit?: number;
                offset?: number;
              }
            );
          case "get_thread_summary":
            return messageHandlers.getThreadSummary(
              validatedArgs as { threadId: string }
            );

          // Search operations
          case "search":
            return toolHandlers.search(validatedArgs);
          case "advanced_search":
            return toolHandlers.advancedSearch(validatedArgs);

          // Persistence operations
          case "backup_database":
            return toolHandlers.backupDatabase(validatedArgs);
          case "restore_database":
            return toolHandlers.restoreDatabase(validatedArgs);
          case "sync_filesystem":
            return toolHandlers.syncFilesystem(validatedArgs);

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        logger.error(`Tool execution failed: ${name}`, error);
        throw error;
      }
    });
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      logger.info(
        `Initializing Follow Plan MCP Server for project: ${this.projectPath}`
      );

      // Create directory structure
      await this.createDirectoryStructure();

      // Initialize database
      await this.databaseService.initialize();

      // Initialize persistence service
      await this.persistenceService.initialize();

      // Create index file if it doesn't exist
      await this.createIndexFile();

      this.isInitialized = true;
      logger.info("Follow Plan MCP Server initialized successfully");
    } catch (error) {
      logger.error("Failed to initialize Follow Plan MCP Server", error);
      throw error;
    }
  }

  private async createDirectoryStructure(): Promise<void> {
    const directories = [
      path.dirname(this.planStructure.indexPath),
      this.planStructure.tasksDir,
      this.planStructure.featuresDir,
      this.planStructure.bugsDir,
      this.planStructure.rulesDir,
      this.planStructure.workflowsDir,
      this.planStructure.changelogDir,
      this.planStructure.tmpDir,
      path.join(this.planStructure.tmpDir, "logs"),
      path.join(this.planStructure.tmpDir, "stacktraces"),
    ];

    for (const dir of directories) {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  private async createIndexFile(): Promise<void> {
    try {
      await fs.access(this.planStructure.indexPath);
    } catch {
      // File doesn't exist, create it
      const indexContent = `# Project Plan

This is the main index for your project plan. The Follow Plan MCP server manages:

## Structure

- **Tasks**: Individual work items with status tracking
- **Features**: User stories and feature specifications  
- **Bugs**: Issue tracking and resolution
- **Messages**: Communication logs and notes
- **Workflows**: Development processes
- **Changelog**: Project history

## Getting Started

Use the MCP tools to create and manage your project items:

\`\`\`
create_task: Create a new task
create_feature: Create a new feature
create_bug: Report a new bug
create_message: Add a communication log
search: Find items across your project
\`\`\`

---
*Generated by Follow Plan MCP Server v1.0.0*
`;
      await fs.writeFile(this.planStructure.indexPath, indexContent, "utf8");
    }
  }

  async start(): Promise<void> {
    await this.initialize();

    // Add debug request interceptor
    // Access private properties with type assertion to avoid TypeScript errors
    const serverAny = this.server as any;
    const originalHandleRequest =
      serverAny._handleRequest || serverAny.handleRequest;

    if (originalHandleRequest && typeof originalHandleRequest === "function") {
      // Override the handler with our debug version
      const debugHandler = async (request: any) => {
        debugLogger.logRequest(request);

        // Log all registered handlers and their schemas
        if (process.env.DEBUG) {
          // Access private _requestHandlers property
          const handlers = serverAny._requestHandlers || new Map();
          if (handlers && handlers.size > 0) {
            logger.debug(`🔧 Registered handlers (${handlers.size}):`);
            handlers.forEach((handler: any, schema: any) => {
              try {
                const schemaInfo = {
                  typeName: schema._def?.typeName,
                  shape: Object.keys(schema._def?.shape || {}),
                };
                logger.debug(
                  `- Handler schema: ${util.inspect(schemaInfo, { depth: 2 })}`
                );
              } catch (err) {
                logger.debug(`- Handler schema: [Error inspecting schema]`);
              }
            });
          }
        }

        try {
          const result = await originalHandleRequest.call(serverAny, request);
          debugLogger.logResponse(request.id, result);
          return result;
        } catch (error) {
          debugLogger.logResponse(request.id, null, error);
          throw error;
        }
      };

      // Replace the handler
      if (serverAny._handleRequest) {
        serverAny._handleRequest = debugHandler;
      } else if (serverAny.handleRequest) {
        serverAny.handleRequest = debugHandler;
      }

      logger.debug("Debug request interceptor installed");
    } else {
      logger.warn(
        "Could not install debug interceptor: handleRequest method not found"
      );
    }

    const transport = new StdioServerTransport();
    await this.server.connect(transport);

    logger.info("Follow Plan MCP Server started and connected via stdio");
  }

  async shutdown(): Promise<void> {
    try {
      logger.info("Shutting down Follow Plan MCP Server...");

      // Graceful shutdown of services
      await this.persistenceService.shutdown();
      await this.databaseService.close();

      logger.info("Follow Plan MCP Server shutdown complete");
    } catch (error) {
      logger.error("Error during shutdown", error);
      throw error;
    }
  }
}

// Main execution
async function main(): Promise<void> {
  const projectPath = process.argv[2] || process.cwd();

  if (!projectPath) {
    console.error("Usage: follow-plan-mcp <project-path>");
    process.exit(1);
  }

  const server = new FollowPlanServer(projectPath);

  // Handle graceful shutdown
  const shutdown = async () => {
    try {
      await server.shutdown();
      process.exit(0);
    } catch (error) {
      console.error("Error during shutdown:", error);
      process.exit(1);
    }
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
  process.on("uncaughtException", (error) => {
    logger.error("Uncaught exception:", error);
    shutdown();
  });
  process.on("unhandledRejection", (reason) => {
    logger.error("Unhandled rejection:", reason);
    shutdown();
  });

  try {
    await server.start();
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
}

// Only run main if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}
