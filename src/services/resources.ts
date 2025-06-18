import { TaskService } from "./tasks.js";
import { FeatureService } from "./features.js";
import { BugService } from "./bugs.js";
import { SearchService } from "./search.js";
import type { PlanStructure } from "../types/index.js";

/**
 * Generate statistics about tasks, features, and bugs
 */
async function generateStats(
  taskService: TaskService,
  featureService: FeatureService,
  bugService: BugService
) {
  // Use try/catch for each service to handle potential missing methods
  let totalTasks = 0;
  let totalFeatures = 0;
  let totalBugs = 0;

  try {
    // For TaskService (which is currently a stub)
    if (typeof taskService.findMany === "function") {
      const tasks = await taskService.findMany();
      totalTasks = tasks?.length || 0;
    }
  } catch (error) {
    console.error("Error getting task stats:", error);
  }

  try {
    // For FeatureService
    if (typeof featureService.findMany === "function") {
      const features = await featureService.findMany();
      totalFeatures = features?.length || 0;
    }
  } catch (error) {
    console.error("Error getting feature stats:", error);
  }

  try {
    // For BugService
    if (typeof bugService.findMany === "function") {
      const bugs = await bugService.findMany();
      totalBugs = bugs?.length || 0;
    }
  } catch (error) {
    console.error("Error getting bug stats:", error);
  }

  return {
    totalTasks,
    totalFeatures,
    totalBugs,
  };
}

/**
 * Resource handlers for MCP server
 */
export function createResourceHandlers(
  taskService: TaskService,
  featureService: FeatureService,
  bugService: BugService,
  searchService: SearchService,
  planStructure: PlanStructure
) {
  return {
    listResources: async () => {
      return {
        resources: [
          {
            uri: "plan://index",
            name: "Project Plan Index",
            description: "Main project plan overview",
            mimeType: "text/markdown",
          },
          {
            uri: "plan://tasks",
            name: "All Tasks",
            description: "Complete list of project tasks",
            mimeType: "application/json",
          },
          {
            uri: "plan://features",
            name: "All Features",
            description: "Complete list of project features",
            mimeType: "application/json",
          },
          {
            uri: "plan://bugs",
            name: "All Bugs",
            description: "Complete list of project bugs",
            mimeType: "application/json",
          },
          {
            uri: "plan://rules",
            name: "All Rules",
            description: "Complete list of project rules",
            mimeType: "application/json",
          },
          {
            uri: "plan://stats",
            name: "Project Statistics",
            description: "Project overview and statistics",
            mimeType: "application/json",
          },
        ],
      };
    },

    readResource: async (uri: string) => {
      const url = new URL(uri);

      switch (url.host) {
        case "index":
          return {
            contents: [
              {
                uri,
                mimeType: "text/markdown",
                text: await generateIndexMarkdown(
                  taskService,
                  featureService,
                  bugService
                ),
              },
            ],
          };

        case "tasks":
          const tasks = await taskService.findMany();
          return {
            contents: [
              {
                uri,
                mimeType: "application/json",
                text: JSON.stringify(tasks, null, 2),
              },
            ],
          };

        case "features":
          const features = await featureService.findMany();
          return {
            contents: [
              {
                uri,
                mimeType: "application/json",
                text: JSON.stringify(features, null, 2),
              },
            ],
          };

        case "bugs":
          const bugs = await bugService.findMany();
          return {
            contents: [
              {
                uri,
                mimeType: "application/json",
                text: JSON.stringify(bugs, null, 2),
              },
            ],
          };

        case "stats":
          return {
            contents: [
              {
                uri,
                mimeType: "application/json",
                text: JSON.stringify(
                  await generateStats(taskService, featureService, bugService),
                  null,
                  2
                ),
              },
            ],
          };

        default:
          throw new Error(`Unknown resource: ${uri}`);
      }
    },
  };
}

async function generateIndexMarkdown(
  taskService: TaskService,
  featureService: FeatureService,
  bugService: BugService
): Promise<string> {
  const tasks = await taskService.findMany({ limit: 10 });
  const features = await featureService.findMany({ limit: 10 });
  const bugs = await bugService.findMany(undefined, 10);

  const stats = await generateStats(taskService, featureService, bugService);

  // Generate markdown content
  return `# Project Plan

## Overview

${stats.totalTasks} tasks, ${stats.totalFeatures} features, ${stats.totalBugs} bugs

## Recent Tasks

${tasks.map((task: { title: string; status: string }) => `- ${task.title} (${task.status})`).join("\n")}

## Recent Features

${features.map((feature: { title: string; status: string }) => `- ${feature.title} (${feature.status})`).join("\n")}

## Recent Bugs

${bugs.map((bug: { title: string; status: string }) => `- ${bug.title} (${bug.status})`).join("\n")}`;
}
