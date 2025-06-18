import type { TaskService } from '../services/tasks.js';
import type { FeatureService } from '../services/features.js';
import type { BugService } from '../services/bugs.js';
import type { SearchService } from '../services/search.js';
import type { PlanStructure } from '../types/index.js';

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
      const resources = [];

      // Add static resources
      resources.push({
        uri: 'plan://tasks',
        name: 'Tasks',
        description: 'List all tasks in the project',
        mimeType: 'application/json'
      });

      resources.push({
        uri: 'plan://features', 
        name: 'Features',
        description: 'List all features in the project',
        mimeType: 'application/json'
      });

      resources.push({
        uri: 'plan://bugs',
        name: 'Bugs', 
        description: 'List all bugs in the project',
        mimeType: 'application/json'
      });

      resources.push({
        uri: 'plan://search/stats',
        name: 'Search Statistics',
        description: 'Search index statistics',
        mimeType: 'application/json'
      });

      // Add dynamic task resources
      const tasks = await taskService.findMany();
      tasks.forEach(task => {
        resources.push({
          uri: `plan://task/${task.id}`,
          name: `Task: ${task.title}`,
          description: task.description,
          mimeType: 'application/json'
        });
      });

      // Add dynamic feature resources  
      const features = await featureService.findMany();
      features.forEach(feature => {
        resources.push({
          uri: `plan://feature/${feature.id}`,
          name: `Feature: ${feature.title}`,
          description: feature.description,
          mimeType: 'application/json'
        });
      });

      return { resources };
    },

    readResource: async (uri: string) => {
      if (uri === 'plan://tasks') {
        const tasks = await taskService.findMany();
        return {
          contents: [{
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(tasks, null, 2)
          }]
        };
      }

      if (uri === 'plan://features') {
        const features = await featureService.findMany();
        return {
          contents: [{
            uri,
            mimeType: 'application/json', 
            text: JSON.stringify(features, null, 2)
          }]
        };
      }

      if (uri === 'plan://bugs') {
        const bugs = await bugService.findMany();
        return {
          contents: [{
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(bugs, null, 2)
          }]
        };
      }

      if (uri === 'plan://search/stats') {
        const stats = await searchService.getSearchStats();
        return {
          contents: [{
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(stats, null, 2)
          }]
        };
      }

      // Handle specific task resources
      const taskMatch = uri.match(/^plan:\/\/task\/(.+)$/);
      if (taskMatch && taskMatch[1]) {
        const taskId = taskMatch[1];
        const task = await taskService.getTask(taskId);
        if (!task) {
          throw new Error(`Task with ID ${taskId} not found`);
        }
        return {
          contents: [{
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(task, null, 2)
          }]
        };
      }

      // Handle specific feature resources
      const featureMatch = uri.match(/^plan:\/\/feature\/(.+)$/);
      if (featureMatch && featureMatch[1]) {
        const featureId = featureMatch[1];
        const feature = await featureService.getFeature(featureId);
        if (!feature) {
          throw new Error(`Feature with ID ${featureId} not found`);
        }
        return {
          contents: [{
            uri,
            mimeType: 'application/json', 
            text: JSON.stringify(feature, null, 2)
          }]
        };
      }

      // Handle specific bug resources
      const bugMatch = uri.match(/^plan:\/\/bug\/(.+)$/);
      if (bugMatch && bugMatch[1]) {
        const bugId = bugMatch[1];
        const bug = await bugService.getBug(bugId);
        if (!bug) {
          throw new Error(`Bug with ID ${bugId} not found`);
        }
        return {
          contents: [{
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(bug, null, 2)
          }]
        };
      }

      throw new Error(`Resource not found: ${uri}`);
    }
  };
}

// Keep search handlers for compatibility
export function createSearchHandlers(searchService: SearchService) {
  return {
    search: async (args: any) => {
      const results = await searchService.search(args.query, args);

      if (results.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `No results found for query: "${args.query}"`,
            },
          ],
        };
      }

      const resultText = results
        .map(
          (result) =>
            `**${result.title}** (${result.type})\n${result.description}\nScore: ${Math.round(result.score * 100)}%\nSnippet: ${result.snippet}\n`
        )
        .join("\n");

      return {
        content: [
          {
            type: "text",
            text: `Found ${results.length} results for "${args.query}":\n\n${resultText}`,
          },
        ],
      };
    },

    advancedSearch: async (args: any) => {
      const results = await searchService.advancedSearch(args);

      if (results.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `No results found for advanced search: "${args.query}"`,
            },
          ],
        };
      }

      const resultText = results
        .map(
          (result) =>
            `**${result.title}** (${result.type})\n${result.description}\nScore: ${Math.round(result.score * 100)}%\nSnippet: ${result.snippet}\n`
        )
        .join("\n");

      return {
        content: [
          {
            type: "text",
            text: `Advanced search found ${results.length} results:\n\n${resultText}`,
          },
        ],
      };
    },
  };
}