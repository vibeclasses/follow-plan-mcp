import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { promises as fs } from "fs";
import path from "path";

// TODO: Import types, handlers, and services
// import { Task, Feature, Bug, Rule } from "./types/index.js";
// import { setupResourceHandlers } from "./handlers/resources.js";
// import { setupToolHandlers } from "./handlers/tools.js";

export class FollowPlanServer {
  private server: Server;
  private projectRoot: string;
  private planDir: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
    this.planDir = path.join(projectRoot, ".plan");
    
    this.server = new Server(
      {
        name: "follow-plan",
        version: "1.0.0",
        description: "AI implementation plan tracking and context management",
      },
      {
        capabilities: {
          resources: {},
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers(): void {
    // TODO: Setup request handlers
    console.log("Setting up handlers...");
  }

  public async ensureDirectoryStructure(): Promise<void> {
    const dirs = [
      this.planDir,
      path.join(this.planDir, "bugs"),
      path.join(this.planDir, "features"),
      path.join(this.planDir, "tasks"),
      path.join(this.planDir, "workflows"),
      path.join(this.planDir, "rules"),
      path.join(this.planDir, "changelog"),
      path.join(this.planDir, "tmp"),
    ];

    for (const dir of dirs) {
      await fs.mkdir(dir, { recursive: true });
    }

    // Create index.md if it doesn't exist
    const indexPath = path.join(this.planDir, "index.md");
    try {
      await fs.access(indexPath);
    } catch {
      await fs.writeFile(indexPath, this.generateIndexTemplate());
    }
  }

  private generateIndexTemplate(): string {
    return `# Project Implementation Plan

## Overview
This is the main index for the project implementation plan.

## Features
- [View all features](./features/)

## Tasks
- [View all tasks](./tasks/)

## Bugs
- [View all bugs](./bugs/)

## Rules
- [View all rules](./rules/)

---
*Last updated: ${new Date().toISOString()}*
`;
  }

  public async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Follow Plan MCP server running on stdio");
  }
}

// Entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  const projectRoot = process.argv[2] || process.cwd();
  const server = new FollowPlanServer(projectRoot);
  server.run().catch(console.error);
}
