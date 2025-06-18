import type { TaskService } from "../services/tasks.js";
import type { FeatureService } from "../services/features.js";
import type { BugService } from "../services/bugs.js";
import type { SearchService } from "../services/search.js";
import type { PersistenceService } from "../services/persistence.js";
import { MESSAGE_TOOLS } from "./messages.js";

/**
 * Tool handlers for MCP server
 */
export function createToolHandlers(
  taskService: TaskService,
  featureService: FeatureService,
  bugService: BugService,
  searchService: SearchService,
  persistenceService: PersistenceService
) {
  return {
    // List all available tools
    listTools: async () => {
      return {
        tools: [
          // Task tools
          {
            name: "create_task",
            description: "Create a new task",
            inputSchema: {
              type: "object",
              properties: {
                title: { type: "string", description: "Task title" },
                description: {
                  type: "string",
                  description: "Task description",
                },
                priority: {
                  type: "string",
                  enum: ["low", "medium", "high", "critical"],
                },
                status: {
                  type: "string",
                  enum: [
                    "todo",
                    "in-progress",
                    "blocked",
                    "completed",
                    "cancelled",
                  ],
                },
                assignee: { type: "string", description: "Assigned person" },
                estimatedHours: {
                  type: "number",
                  description: "Estimated hours",
                },
                dueDate: {
                  type: "string",
                  description: "Due date (ISO string)",
                },
                dependencies: { type: "array", items: { type: "string" } },
                relatedFeatures: { type: "array", items: { type: "string" } },
                relatedBugs: { type: "array", items: { type: "string" } },
                tags: { type: "array", items: { type: "string" } },
              },
              required: ["title", "description"],
            },
          },
          {
            name: "update_task",
            description: "Update an existing task",
            inputSchema: {
              type: "object",
              properties: {
                id: { type: "string", description: "Task ID" },
                title: { type: "string", description: "Task title" },
                description: {
                  type: "string",
                  description: "Task description",
                },
                priority: {
                  type: "string",
                  enum: ["low", "medium", "high", "critical"],
                },
                status: {
                  type: "string",
                  enum: [
                    "todo",
                    "in-progress",
                    "blocked",
                    "completed",
                    "cancelled",
                  ],
                },
                assignee: { type: "string", description: "Assigned person" },
                estimatedHours: {
                  type: "number",
                  description: "Estimated hours",
                },
                actualHours: {
                  type: "number",
                  description: "Actual hours spent",
                },
                dueDate: {
                  type: "string",
                  description: "Due date (ISO string)",
                },
                dependencies: { type: "array", items: { type: "string" } },
                relatedFeatures: { type: "array", items: { type: "string" } },
                relatedBugs: { type: "array", items: { type: "string" } },
                tags: { type: "array", items: { type: "string" } },
              },
              required: ["id"],
            },
          },
          {
            name: "get_task",
            description: "Get a specific task by ID",
            inputSchema: {
              type: "object",
              properties: {
                id: { type: "string", description: "Task ID" },
              },
              required: ["id"],
            },
          },
          {
            name: "list_tasks",
            description: "List tasks with optional filtering",
            inputSchema: {
              type: "object",
              properties: {
                status: {
                  type: "string",
                  enum: [
                    "todo",
                    "in-progress",
                    "blocked",
                    "completed",
                    "cancelled",
                  ],
                },
                priority: {
                  type: "string",
                  enum: ["low", "medium", "high", "critical"],
                },
                assignee: { type: "string", description: "Assigned person" },
                tags: { type: "array", items: { type: "string" } },
                limit: { type: "number", minimum: 1, maximum: 100 },
                offset: { type: "number", minimum: 0 },
              },
            },
          },
          {
            name: "delete_task",
            description: "Delete a task",
            inputSchema: {
              type: "object",
              properties: {
                id: { type: "string", description: "Task ID" },
              },
              required: ["id"],
            },
          },

          // Feature tools
          {
            name: "create_feature",
            description: "Create a new feature",
            inputSchema: {
              type: "object",
              properties: {
                title: { type: "string", description: "Feature title" },
                description: {
                  type: "string",
                  description: "Feature description",
                },
                priority: {
                  type: "string",
                  enum: ["low", "medium", "high", "critical"],
                },
                status: {
                  type: "string",
                  enum: [
                    "draft",
                    "planned",
                    "in-progress",
                    "testing",
                    "completed",
                    "cancelled",
                  ],
                },
                assignee: { type: "string", description: "Assigned person" },
                estimatedHours: {
                  type: "number",
                  description: "Estimated hours",
                },
                dueDate: {
                  type: "string",
                  description: "Due date (ISO string)",
                },
                acceptanceCriteria: {
                  type: "array",
                  items: { type: "string" },
                },
                userStory: { type: "string", description: "User story format" },
                relatedTasks: { type: "array", items: { type: "string" } },
                relatedBugs: { type: "array", items: { type: "string" } },
                tags: { type: "array", items: { type: "string" } },
              },
              required: ["title", "description"],
            },
          },
          {
            name: "update_feature",
            description: "Update an existing feature",
            inputSchema: {
              type: "object",
              properties: {
                id: { type: "string", description: "Feature ID" },
                title: { type: "string", description: "Feature title" },
                description: {
                  type: "string",
                  description: "Feature description",
                },
                priority: {
                  type: "string",
                  enum: ["low", "medium", "high", "critical"],
                },
                status: {
                  type: "string",
                  enum: [
                    "draft",
                    "planned",
                    "in-progress",
                    "testing",
                    "completed",
                    "cancelled",
                  ],
                },
                assignee: { type: "string", description: "Assigned person" },
                estimatedHours: {
                  type: "number",
                  description: "Estimated hours",
                },
                actualHours: {
                  type: "number",
                  description: "Actual hours spent",
                },
                dueDate: {
                  type: "string",
                  description: "Due date (ISO string)",
                },
                acceptanceCriteria: {
                  type: "array",
                  items: { type: "string" },
                },
                userStory: { type: "string", description: "User story format" },
                relatedTasks: { type: "array", items: { type: "string" } },
                relatedBugs: { type: "array", items: { type: "string" } },
                tags: { type: "array", items: { type: "string" } },
              },
              required: ["id"],
            },
          },
          {
            name: "get_feature",
            description: "Get a specific feature by ID",
            inputSchema: {
              type: "object",
              properties: {
                id: { type: "string", description: "Feature ID" },
              },
              required: ["id"],
            },
          },
          {
            name: "list_features",
            description: "List features with optional filtering",
            inputSchema: {
              type: "object",
              properties: {
                status: {
                  type: "string",
                  enum: [
                    "draft",
                    "planned",
                    "in-progress",
                    "testing",
                    "completed",
                    "cancelled",
                  ],
                },
                priority: {
                  type: "string",
                  enum: ["low", "medium", "high", "critical"],
                },
                assignee: { type: "string", description: "Assigned person" },
                tags: { type: "array", items: { type: "string" } },
                limit: { type: "number", minimum: 1, maximum: 100 },
                offset: { type: "number", minimum: 0 },
              },
            },
          },
          {
            name: "delete_feature",
            description: "Delete a feature",
            inputSchema: {
              type: "object",
              properties: {
                id: { type: "string", description: "Feature ID" },
              },
              required: ["id"],
            },
          },

          // Bug tools
          {
            name: "create_bug",
            description: "Create a new bug report",
            inputSchema: {
              type: "object",
              properties: {
                title: { type: "string", description: "Bug title" },
                description: { type: "string", description: "Bug description" },
                severity: {
                  type: "string",
                  enum: ["low", "medium", "high", "critical"],
                },
                priority: {
                  type: "string",
                  enum: ["low", "medium", "high", "critical"],
                },
                status: {
                  type: "string",
                  enum: [
                    "open",
                    "in-progress",
                    "resolved",
                    "closed",
                    "wont-fix",
                  ],
                },
                assignee: { type: "string", description: "Assigned person" },
                reporter: { type: "string", description: "Bug reporter" },
                estimatedHours: {
                  type: "number",
                  description: "Estimated hours to fix",
                },
                stepsToReproduce: { type: "array", items: { type: "string" } },
                expectedBehavior: {
                  type: "string",
                  description: "Expected behavior",
                },
                actualBehavior: {
                  type: "string",
                  description: "Actual behavior",
                },
                environment: {
                  type: "string",
                  description: "Environment where bug occurs",
                },
                relatedTasks: { type: "array", items: { type: "string" } },
                relatedFeatures: { type: "array", items: { type: "string" } },
                tags: { type: "array", items: { type: "string" } },
              },
              required: ["title", "description", "severity"],
            },
          },
          {
            name: "update_bug",
            description: "Update an existing bug",
            inputSchema: {
              type: "object",
              properties: {
                id: { type: "string", description: "Bug ID" },
                title: { type: "string", description: "Bug title" },
                description: { type: "string", description: "Bug description" },
                severity: {
                  type: "string",
                  enum: ["low", "medium", "high", "critical"],
                },
                priority: {
                  type: "string",
                  enum: ["low", "medium", "high", "critical"],
                },
                status: {
                  type: "string",
                  enum: [
                    "open",
                    "in-progress",
                    "resolved",
                    "closed",
                    "wont-fix",
                  ],
                },
                assignee: { type: "string", description: "Assigned person" },
                reporter: { type: "string", description: "Bug reporter" },
                estimatedHours: {
                  type: "number",
                  description: "Estimated hours to fix",
                },
                actualHours: {
                  type: "number",
                  description: "Actual hours spent",
                },
                stepsToReproduce: { type: "array", items: { type: "string" } },
                expectedBehavior: {
                  type: "string",
                  description: "Expected behavior",
                },
                actualBehavior: {
                  type: "string",
                  description: "Actual behavior",
                },
                environment: {
                  type: "string",
                  description: "Environment where bug occurs",
                },
                resolution: {
                  type: "string",
                  description: "Resolution description",
                },
                relatedTasks: { type: "array", items: { type: "string" } },
                relatedFeatures: { type: "array", items: { type: "string" } },
                tags: { type: "array", items: { type: "string" } },
              },
              required: ["id"],
            },
          },
          {
            name: "get_bug",
            description: "Get a specific bug by ID",
            inputSchema: {
              type: "object",
              properties: {
                id: { type: "string", description: "Bug ID" },
              },
              required: ["id"],
            },
          },
          {
            name: "list_bugs",
            description: "List bugs with optional filtering",
            inputSchema: {
              type: "object",
              properties: {
                status: {
                  type: "string",
                  enum: [
                    "open",
                    "in-progress",
                    "resolved",
                    "closed",
                    "wont-fix",
                  ],
                },
                severity: {
                  type: "string",
                  enum: ["low", "medium", "high", "critical"],
                },
                priority: {
                  type: "string",
                  enum: ["low", "medium", "high", "critical"],
                },
                assignee: { type: "string", description: "Assigned person" },
                reporter: { type: "string", description: "Bug reporter" },
                tags: { type: "array", items: { type: "string" } },
                limit: { type: "number", minimum: 1, maximum: 100 },
                offset: { type: "number", minimum: 0 },
              },
            },
          },
          {
            name: "delete_bug",
            description: "Delete a bug",
            inputSchema: {
              type: "object",
              properties: {
                id: { type: "string", description: "Bug ID" },
              },
              required: ["id"],
            },
          },

          // Search tools
          {
            name: "search",
            description: "Search across all items (tasks, features, bugs)",
            inputSchema: {
              type: "object",
              properties: {
                query: { type: "string", description: "Search query" },
                types: {
                  type: "array",
                  items: { type: "string", enum: ["task", "feature", "bug"] },
                },
                limit: { type: "number", minimum: 1, maximum: 100 },
                offset: { type: "number", minimum: 0 },
              },
              required: ["query"],
            },
          },
          {
            name: "advanced_search",
            description: "Advanced search with filters",
            inputSchema: {
              type: "object",
              properties: {
                query: { type: "string", description: "Search query" },
                types: {
                  type: "array",
                  items: { type: "string", enum: ["task", "feature", "bug"] },
                },
                status: { type: "array", items: { type: "string" } },
                priority: { type: "array", items: { type: "string" } },
                assignee: { type: "array", items: { type: "string" } },
                tags: { type: "array", items: { type: "string" } },
                dateFrom: {
                  type: "string",
                  description: "Search from this date (ISO string)",
                },
                dateTo: {
                  type: "string",
                  description: "Search to this date (ISO string)",
                },
                limit: { type: "number", minimum: 1, maximum: 100 },
                offset: { type: "number", minimum: 0 },
              },
              required: ["query"],
            },
          },

          // Persistence tools
          {
            name: "backup_database",
            description: "Create a backup of the database",
            inputSchema: {
              type: "object",
              properties: {
                path: {
                  type: "string",
                  description: "Backup file path (optional)",
                },
              },
            },
          },
          {
            name: "restore_database",
            description: "Restore database from backup",
            inputSchema: {
              type: "object",
              properties: {
                path: { type: "string", description: "Backup file path" },
              },
              required: ["path"],
            },
          },
          {
            name: "sync_filesystem",
            description: "Sync database with filesystem",
            inputSchema: {
              type: "object",
              properties: {
                direction: {
                  type: "string",
                  enum: ["to-fs", "from-fs", "both"],
                  description: "Sync direction",
                },
              },
            },
          },

          // Include message tools
          ...MESSAGE_TOOLS,
        ],
      };
    },

    // Task handlers
    createTask: async (args: any) => {
      try {
        const task = await taskService.createTask(args);
        return {
          content: [
            {
              type: "text",
              text: `Task created successfully with ID: ${task.id}`,
            },
          ],
        };
      } catch (error) {
        throw new Error(
          `Failed to create task: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    },

    updateTask: async (args: any) => {
      try {
        const task = await taskService.updateTask(args.id, args);
        return {
          content: [
            {
              type: "text",
              text: `Task ${task.id} updated successfully`,
            },
          ],
        };
      } catch (error) {
        throw new Error(
          `Failed to update task: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    },

    getTask: async (args: any) => {
      try {
        const task = await taskService.getTask(args.id);
        if (!task) {
          throw new Error(`Task with ID ${args.id} not found`);
        }
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(task, null, 2),
            },
          ],
        };
      } catch (error) {
        throw new Error(
          `Failed to get task: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    },

    listTasks: async (args: any) => {
      try {
        const tasks = await taskService.listTasks(args);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(tasks, null, 2),
            },
          ],
        };
      } catch (error) {
        throw new Error(
          `Failed to list tasks: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    },

    deleteTask: async (args: any) => {
      try {
        await taskService.deleteTask(args.id);
        return {
          content: [
            {
              type: "text",
              text: `Task ${args.id} deleted successfully`,
            },
          ],
        };
      } catch (error) {
        throw new Error(
          `Failed to delete task: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    },

    // Feature handlers
    createFeature: async (args: any) => {
      try {
        const feature = await featureService.createFeature(args);
        return {
          content: [
            {
              type: "text",
              text: `Feature created successfully with ID: ${feature.id}`,
            },
          ],
        };
      } catch (error) {
        throw new Error(
          `Failed to create feature: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    },

    updateFeature: async (args: any) => {
      try {
        const feature = await featureService.updateFeature(args.id, args);
        return {
          content: [
            {
              type: "text",
              text: `Feature ${feature.id} updated successfully`,
            },
          ],
        };
      } catch (error) {
        throw new Error(
          `Failed to update feature: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    },

    getFeature: async (args: any) => {
      try {
        const feature = await featureService.getFeature(args.id);
        if (!feature) {
          throw new Error(`Feature with ID ${args.id} not found`);
        }
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(feature, null, 2),
            },
          ],
        };
      } catch (error) {
        throw new Error(
          `Failed to get feature: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    },

    listFeatures: async (args: any) => {
      try {
        const features = await featureService.listFeatures(args);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(features, null, 2),
            },
          ],
        };
      } catch (error) {
        throw new Error(
          `Failed to list features: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    },

    deleteFeature: async (args: any) => {
      try {
        await featureService.deleteFeature(args.id);
        return {
          content: [
            {
              type: "text",
              text: `Feature ${args.id} deleted successfully`,
            },
          ],
        };
      } catch (error) {
        throw new Error(
          `Failed to delete feature: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    },

    // Bug handlers
    createBug: async (args: any) => {
      try {
        const bug = await bugService.createBug(args);
        return {
          content: [
            {
              type: "text",
              text: `Bug created successfully with ID: ${bug.id}`,
            },
          ],
        };
      } catch (error) {
        throw new Error(
          `Failed to create bug: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    },

    updateBug: async (args: any) => {
      try {
        const bug = await bugService.updateBug(args.id, args);
        if (!bug) {
          throw new Error(`Bug with ID ${args.id} not found`);
        }
        return {
          content: [
            {
              type: "text",
              text: `Bug ${bug.id} updated successfully`,
            },
          ],
        };
      } catch (error) {
        throw new Error(
          `Failed to update bug: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    },

    getBug: async (args: any) => {
      try {
        const bug = await bugService.getBug(args.id);
        if (!bug) {
          throw new Error(`Bug with ID ${args.id} not found`);
        }
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(bug, null, 2),
            },
          ],
        };
      } catch (error) {
        throw new Error(
          `Failed to get bug: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    },

    listBugs: async (args: any) => {
      try {
        const bugs = await bugService.listBugs(args);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(bugs, null, 2),
            },
          ],
        };
      } catch (error) {
        throw new Error(
          `Failed to list bugs: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    },

    deleteBug: async (args: any) => {
      try {
        await bugService.deleteBug(args.id);
        return {
          content: [
            {
              type: "text",
              text: `Bug ${args.id} deleted successfully`,
            },
          ],
        };
      } catch (error) {
        throw new Error(
          `Failed to delete bug: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    },

    // Search handlers
    search: async (args: any) => {
      try {
        const results = await searchService.search(args.query, args);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(results, null, 2),
            },
          ],
        };
      } catch (error) {
        throw new Error(
          `Failed to search: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    },

    advancedSearch: async (args: any) => {
      try {
        const results = await searchService.advancedSearch(args);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(results, null, 2),
            },
          ],
        };
      } catch (error) {
        throw new Error(
          `Failed to perform advanced search: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    },

    // Persistence handlers
    backupDatabase: async (args: any) => {
      try {
        const backupPath = await persistenceService.backupDatabase(args.path);
        return {
          content: [
            {
              type: "text",
              text: `Database backed up to: ${backupPath}`,
            },
          ],
        };
      } catch (error) {
        throw new Error(
          `Failed to backup database: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    },

    restoreDatabase: async (args: any) => {
      try {
        await persistenceService.restoreDatabase(args.path);
        return {
          content: [
            {
              type: "text",
              text: `Database restored from: ${args.path}`,
            },
          ],
        };
      } catch (error) {
        throw new Error(
          `Failed to restore database: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    },

    syncFilesystem: async (args: any) => {
      try {
        const result = await persistenceService.syncWithFilesystem(
          args.direction || "both"
        );
        return {
          content: [
            {
              type: "text",
              text: `Filesystem sync completed: ${JSON.stringify(result, null, 2)}`,
            },
          ],
        };
      } catch (error) {
        throw new Error(
          `Failed to sync filesystem: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    },
  };
}
