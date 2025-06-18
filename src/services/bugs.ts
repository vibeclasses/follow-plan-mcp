import { DatabaseService } from "./database.js";
import { generateId } from "../utils/id-generator.js";
import { logger } from "../utils/logger.js";
import type {
  Bug,
  BugCreateInput,
  BugUpdateInput,
  BugFilter,
} from "../types/index.js";

/**
 * Service for managing bugs
 */
export class BugService {
  constructor(private db: DatabaseService) {}

  async create(input: BugCreateInput): Promise<Bug> {
    const now = new Date().toISOString();
    const id = generateId();

    const bug: Bug = {
      id,
      title: input.title,
      description: input.description,
      status: "todo",
      priority: input.priority || "medium",
      severity: input.severity,
      component: input.component,
      reporter: input.reporter,
      stepsToReproduce: input.stepsToReproduce || [],
      expectedBehavior: input.expectedBehavior,
      actualBehavior: input.actualBehavior,
      relatedTasks: [],
      relatedFeatures: [],
      attachments: [],
      testCases: [],
      tags: input.tags || [],
      metadata: input.metadata || {},
      created: now,
      updated: now,
      ...(input.version !== undefined && { version: input.version }),
      ...(input.environment !== undefined && { environment: input.environment }),
      ...(input.assignee !== undefined && { assignee: input.assignee }),
      ...(input.workaround !== undefined && { workaround: input.workaround }),
    };

    const dbRecord = {
      id: bug.id,
      title: bug.title,
      description: bug.description,
      status: bug.status,
      priority: bug.priority,
      severity: bug.severity,
      component: bug.component,
      version: bug.version,
      environment: bug.environment,
      reporter: bug.reporter,
      assignee: bug.assignee,
      steps_to_reproduce: JSON.stringify(bug.stepsToReproduce),
      expected_behavior: bug.expectedBehavior,
      actual_behavior: bug.actualBehavior,
      workaround: bug.workaround,
      related_tasks: JSON.stringify(bug.relatedTasks),
      related_features: JSON.stringify(bug.relatedFeatures),
      duplicate_of: bug.duplicateOf,
      attachments: JSON.stringify(bug.attachments),
      test_cases: JSON.stringify(bug.testCases),
      tags: JSON.stringify(bug.tags),
      metadata: JSON.stringify(bug.metadata),
      created: bug.created,
      updated: bug.updated,
    };

    await this.db.create("bugs", dbRecord);

    logger.info(`Created bug: ${bug.title} (${bug.id})`);
    return bug;
  }

  async update(id: string, input: BugUpdateInput): Promise<Bug | null> {
    const existing = await this.findById(id);
    if (!existing) {
      return null;
    }

    const now = new Date().toISOString();
    const updated: Bug = {
      ...existing,
      ...input,
      id,
      updated: now,
    };

    const dbRecord = {
      title: updated.title,
      description: updated.description,
      status: updated.status,
      priority: updated.priority,
      severity: updated.severity,
      component: updated.component,
      version: updated.version,
      environment: updated.environment,
      reporter: updated.reporter,
      assignee: updated.assignee,
      steps_to_reproduce: JSON.stringify(updated.stepsToReproduce),
      expected_behavior: updated.expectedBehavior,
      actual_behavior: updated.actualBehavior,
      workaround: updated.workaround,
      related_tasks: JSON.stringify(updated.relatedTasks),
      related_features: JSON.stringify(updated.relatedFeatures),
      duplicate_of: updated.duplicateOf,
      attachments: JSON.stringify(updated.attachments),
      test_cases: JSON.stringify(updated.testCases),
      tags: JSON.stringify(updated.tags),
      metadata: JSON.stringify(updated.metadata),
      updated: updated.updated,
    };

    const success = await this.db.update("bugs", id, dbRecord);

    if (success) {
      logger.info(`Updated bug: ${updated.title} (${id})`);
      return updated;
    }

    return null;
  }

  async delete(id: string): Promise<boolean> {
    const bug = await this.findById(id);
    if (!bug) {
      return false;
    }

    const success = await this.db.delete("bugs", id);

    if (success) {
      logger.info(`Deleted bug: ${bug.title} (${id})`);
    }

    return success;
  }

  async findById(id: string): Promise<Bug | null> {
    const record = await this.db.findById("bugs", id);
    if (!record) {
      return null;
    }

    return this.mapDbRecordToBug(record);
  }

  async findMany(
    filter?: BugFilter,
    limit?: number,
    offset?: number
  ): Promise<Bug[]> {
    const where: Record<string, unknown> = {};

    if (filter?.status) {
      if (Array.isArray(filter.status)) {
        where.status = filter.status[0];
      } else {
        where.status = filter.status;
      }
    }

    if (filter?.priority) {
      if (Array.isArray(filter.priority)) {
        where.priority = filter.priority[0];
      } else {
        where.priority = filter.priority;
      }
    }

    if (filter?.severity) {
      if (Array.isArray(filter.severity)) {
        where.severity = filter.severity[0];
      } else {
        where.severity = filter.severity;
      }
    }

    if (filter?.component) {
      where.component = filter.component;
    }

    if (filter?.reporter) {
      where.reporter = filter.reporter;
    }

    if (filter?.assignee) {
      where.assignee = filter.assignee;
    }

    const records = await this.db.findMany(
      "bugs",
      where,
      "updated DESC",
      limit,
      offset
    );
    return records.map((record) => this.mapDbRecordToBug(record));
  }

  // Aliases for compatibility with handlers
  async createBug(input: BugCreateInput): Promise<Bug> {
    return this.create(input);
  }

  async updateBug(id: string, input: BugUpdateInput): Promise<Bug | null> {
    return this.update(id, input);
  }

  async deleteBug(id: string): Promise<boolean> {
    return this.delete(id);
  }

  async getBug(id: string): Promise<Bug | null> {
    return this.findById(id);
  }

  async listBugs(
    filter?: BugFilter,
    limit?: number,
    offset?: number
  ): Promise<Bug[]> {
    return this.findMany(filter, limit, offset);
  }

  private mapDbRecordToBug(record: any): Bug {
    const bug: Bug = {
      id: record.id as string,
      title: record.title as string,
      description: record.description as string,
      status: record.status as Bug["status"],
      priority: record.priority as Bug["priority"],
      severity: record.severity as Bug["severity"],
      component: record.component as string,
      reporter: record.reporter as string,
      stepsToReproduce: JSON.parse(
        (record.steps_to_reproduce as string) || "[]"
      ),
      expectedBehavior: record.expected_behavior as string,
      actualBehavior: record.actual_behavior as string,
      relatedTasks: JSON.parse((record.related_tasks as string) || "[]"),
      relatedFeatures: JSON.parse((record.related_features as string) || "[]"),
      attachments: JSON.parse((record.attachments as string) || "[]"),
      testCases: JSON.parse((record.test_cases as string) || "[]"),
      tags: JSON.parse((record.tags as string) || "[]"),
      metadata: JSON.parse((record.metadata as string) || "{}"),
      created: record.created as string,
      updated: record.updated as string,
    };

    // Only add optional properties if they have values
    if (record.version !== null && record.version !== undefined) {
      bug.version = record.version as string;
    }
    if (record.environment !== null && record.environment !== undefined) {
      bug.environment = record.environment as string;
    }
    if (record.assignee !== null && record.assignee !== undefined) {
      bug.assignee = record.assignee as string;
    }
    if (record.workaround !== null && record.workaround !== undefined) {
      bug.workaround = record.workaround as string;
    }
    if (record.duplicate_of !== null && record.duplicate_of !== undefined) {
      bug.duplicateOf = record.duplicate_of as string;
    }

    return bug;
  }
}
