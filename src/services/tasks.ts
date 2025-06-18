import type { DatabaseService } from './database.js';
import type { Task, TaskCreateInput, TaskUpdateInput } from '../types/task.js';
import { randomUUID } from 'crypto';

/**
 * Service for managing tasks
 */
export class TaskService {
  constructor(private db: DatabaseService) {}

  async createTask(data: TaskCreateInput): Promise<Task> {
    const id = randomUUID();
    const now = new Date().toISOString();
    
    const task: Task = {
      id,
      title: data.title,
      description: data.description,
      priority: data.priority || 'medium',
      status: data.status || 'todo',
      ...(data.estimatedHours !== undefined && { estimatedHours: data.estimatedHours }),
      actualHours: 0,
      ...(data.dueDate !== undefined && { dueDate: data.dueDate }),
      dependencies: data.dependencies || [],
      blockers: [],
      relatedFeatures: data.relatedFeatures || [],
      relatedBugs: data.relatedBugs || [],
      progress: 0,
      notes: [],
      attachments: [],
      tags: data.tags || [],
      created: now,
      updated: now,
      metadata: data.metadata || {}
    };

    const stmt = this.db.database.prepare(`
      INSERT INTO tasks (
        id, title, description, priority, status,
        estimated_hours, actual_hours, due_date, dependencies, blockers,
        related_features, related_bugs, progress, notes, attachments,
        tags, metadata, created, updated
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      task.id,
      task.title,
      task.description,
      task.priority,
      task.status,
      task.estimatedHours,
      task.actualHours,
      task.dueDate,
      JSON.stringify(task.dependencies),
      JSON.stringify(task.blockers),
      JSON.stringify(task.relatedFeatures),
      JSON.stringify(task.relatedBugs),
      task.progress,
      JSON.stringify(task.notes),
      JSON.stringify(task.attachments),
      JSON.stringify(task.tags),
      JSON.stringify(task.metadata),
      task.created,
      task.updated
    );

    return task;
  }

  async getTask(id: string): Promise<Task | null> {
    const stmt = this.db.database.prepare('SELECT * FROM tasks WHERE id = ?');
    const row = stmt.get(id) as any;
    
    if (!row) {
      return null;
    }

    return this.mapRowToTask(row);
  }

  async updateTask(id: string, data: TaskUpdateInput): Promise<Task> {
    const existing = await this.getTask(id);
    if (!existing) {
      throw new Error(`Task with ID ${id} not found`);
    }

    const updated: Task = {
      ...existing,
      ...data,
      id,
      updated: new Date().toISOString()
    };

    const stmt = this.db.database.prepare(`
      UPDATE tasks SET
        title = ?, description = ?, priority = ?, status = ?,
        estimated_hours = ?, actual_hours = ?, due_date = ?, 
        dependencies = ?, blockers = ?, related_features = ?,
        related_bugs = ?, progress = ?, notes = ?, attachments = ?,
        tags = ?, metadata = ?, updated = ?
      WHERE id = ?
    `);

    stmt.run(
      updated.title,
      updated.description,
      updated.priority,
      updated.status,
      updated.estimatedHours,
      updated.actualHours,
      updated.dueDate,
      JSON.stringify(updated.dependencies),
      JSON.stringify(updated.blockers),
      JSON.stringify(updated.relatedFeatures),
      JSON.stringify(updated.relatedBugs),
      updated.progress,
      JSON.stringify(updated.notes),
      JSON.stringify(updated.attachments),
      JSON.stringify(updated.tags),
      JSON.stringify(updated.metadata),
      updated.updated,
      id
    );

    return updated;
  }

  async deleteTask(id: string): Promise<void> {
    const stmt = this.db.database.prepare('DELETE FROM tasks WHERE id = ?');
    const result = stmt.run(id);
    
    if (result.changes === 0) {
      throw new Error(`Task with ID ${id} not found`);
    }
  }

  async listTasks(options: {
    status?: string;
    priority?: string;
    tags?: string[];
    limit?: number;
    offset?: number;
  } = {}): Promise<Task[]> {
    let query = 'SELECT * FROM tasks WHERE 1=1';
    const params: any[] = [];

    if (options.status) {
      query += ' AND status = ?';
      params.push(options.status);
    }

    if (options.priority) {
      query += ' AND priority = ?';
      params.push(options.priority);
    }

    if (options.tags && options.tags.length > 0) {
      const tagConditions = options.tags.map(() => 'JSON_EXTRACT(tags, "$") LIKE ?').join(' OR ');
      query += ` AND (${tagConditions})`;
      options.tags.forEach(tag => params.push(`%"${tag}"%`));
    }

    query += ' ORDER BY created DESC';

    if (options.limit) {
      query += ' LIMIT ?';
      params.push(options.limit);
    }

    if (options.offset) {
      query += ' OFFSET ?';
      params.push(options.offset);
    }

    const stmt = this.db.database.prepare(query);
    const rows = stmt.all(...params) as any[];

    return rows.map(row => this.mapRowToTask(row));
  }

  async findMany(options: {
    status?: string;
    priority?: string;
    assignee?: string;
    tags?: string[];
    limit?: number;
    offset?: number;
  } = {}): Promise<Task[]> {
    return this.listTasks(options);
  }

  async searchTasks(query: string, options: {
    limit?: number;
    offset?: number;
  } = {}): Promise<Task[]> {
    const stmt = this.db.database.prepare(`
      SELECT * FROM tasks_fts
      WHERE tasks_fts MATCH ?
      ORDER BY rank
      LIMIT ? OFFSET ?
    `);

    const limit = options.limit || 50;
    const offset = options.offset || 0;

    const rows = stmt.all(query, limit, offset) as any[];
    const taskIds = rows.map(row => row.id);

    if (taskIds.length === 0) {
      return [];
    }

    const placeholders = taskIds.map(() => '?').join(',');
    const tasksStmt = this.db.database.prepare(`SELECT * FROM tasks WHERE id IN (${placeholders})`);
    const taskRows = tasksStmt.all(...taskIds) as any[];

    return taskRows.map(row => this.mapRowToTask(row));
  }

  async getTasksByDependency(dependencyId: string): Promise<Task[]> {
    const stmt = this.db.database.prepare(`
      SELECT * FROM tasks 
      WHERE JSON_EXTRACT(dependencies, '$') LIKE ?
    `);
    
    const rows = stmt.all(`%"${dependencyId}"%`) as any[];
    return rows.map(row => this.mapRowToTask(row));
  }

  async getTasksByFeature(featureId: string): Promise<Task[]> {
    const stmt = this.db.database.prepare(`
      SELECT * FROM tasks 
      WHERE JSON_EXTRACT(related_features, '$') LIKE ?
    `);
    
    const rows = stmt.all(`%"${featureId}"%`) as any[];
    return rows.map(row => this.mapRowToTask(row));
  }

  async getTasksByBug(bugId: string): Promise<Task[]> {
    const stmt = this.db.database.prepare(`
      SELECT * FROM tasks 
      WHERE JSON_EXTRACT(related_bugs, '$') LIKE ?
    `);
    
    const rows = stmt.all(`%"${bugId}"%`) as any[];
    return rows.map(row => this.mapRowToTask(row));
  }

  async getTaskStats(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
    overdue: number;
  }> {
    const totalStmt = this.db.database.prepare('SELECT COUNT(*) as count FROM tasks');
    const total = (totalStmt.get() as any).count;

    const statusStmt = this.db.database.prepare(`
      SELECT status, COUNT(*) as count 
      FROM tasks 
      GROUP BY status
    `);
    const statusRows = statusStmt.all() as any[];
    const byStatus = statusRows.reduce((acc, row) => {
      acc[row.status] = row.count;
      return acc;
    }, {});

    const priorityStmt = this.db.database.prepare(`
      SELECT priority, COUNT(*) as count 
      FROM tasks 
      GROUP BY priority
    `);
    const priorityRows = priorityStmt.all() as any[];
    const byPriority = priorityRows.reduce((acc, row) => {
      acc[row.priority] = row.count;
      return acc;
    }, {});

    const overdueStmt = this.db.database.prepare(`
      SELECT COUNT(*) as count 
      FROM tasks 
      WHERE due_date IS NOT NULL 
        AND due_date < datetime('now') 
        AND status NOT IN ('completed', 'cancelled')
    `);
    const overdue = (overdueStmt.get() as any).count;

    return { total, byStatus, byPriority, overdue };
  }

  async updateTaskProgress(id: string, actualHours: number): Promise<Task> {
    const task = await this.getTask(id);
    if (!task) {
      throw new Error(`Task with ID ${id} not found`);
    }

    return this.updateTask(id, { id, actualHours });
  }

  async addTaskDependency(taskId: string, dependencyId: string): Promise<Task> {
    const task = await this.getTask(taskId);
    if (!task) {
      throw new Error(`Task with ID ${taskId} not found`);
    }

    if (task.dependencies.includes(dependencyId)) {
      return task; // Already exists
    }

    const updatedDependencies = [...task.dependencies, dependencyId];
    return this.updateTask(taskId, { id: taskId, dependencies: updatedDependencies });
  }

  async removeTaskDependency(taskId: string, dependencyId: string): Promise<Task> {
    const task = await this.getTask(taskId);
    if (!task) {
      throw new Error(`Task with ID ${taskId} not found`);
    }

    const updatedDependencies = task.dependencies.filter(dep => dep !== dependencyId);
    return this.updateTask(taskId, { id: taskId, dependencies: updatedDependencies });
  }

  private mapRowToTask(row: any): Task {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      priority: row.priority,
      status: row.status,
      estimatedHours: row.estimated_hours,
      actualHours: row.actual_hours,
      dueDate: row.due_date,
      dependencies: row.dependencies ? JSON.parse(row.dependencies) : [],
      blockers: row.blockers ? JSON.parse(row.blockers) : [],
      relatedFeatures: row.related_features ? JSON.parse(row.related_features) : [],
      relatedBugs: row.related_bugs ? JSON.parse(row.related_bugs) : [],
      progress: row.progress || 0,
      notes: row.notes ? JSON.parse(row.notes) : [],
      attachments: row.attachments ? JSON.parse(row.attachments) : [],
      tags: row.tags ? JSON.parse(row.tags) : [],
      created: row.created,
      updated: row.updated,
      metadata: row.metadata ? JSON.parse(row.metadata) : {}
    };
  }
}