import type { DatabaseService } from './database.js';
import type { Feature, FeatureCreateInput, FeatureUpdateInput } from '../types/feature.js';
import { randomUUID } from 'crypto';

/**
 * Service for managing features
 */
export class FeatureService {
  constructor(private db: DatabaseService) {}

  async createFeature(data: FeatureCreateInput): Promise<Feature> {
    const id = randomUUID();
    const now = new Date().toISOString();
    
    const feature: Feature = {
      id,
      title: data.title,
      description: data.description,
      priority: data.priority || 'medium',
      status: data.status || 'todo',
      category: data.category,
      ...(data.epic !== undefined && { epic: data.epic }),
      userStory: data.userStory,
      acceptanceCriteria: data.acceptanceCriteria || [],
      ...(data.estimatedStoryPoints !== undefined && { estimatedStoryPoints: data.estimatedStoryPoints }),
      actualStoryPoints: 0,
      relatedTasks: [],
      relatedBugs: [],
      stakeholders: data.stakeholders || [],
      businessValue: data.businessValue || '',
      technicalNotes: [],
      designNotes: [],
      testingNotes: [],
      tags: data.tags || [],
      created: now,
      updated: now,
      metadata: data.metadata || {}
    };

    const stmt = this.db.database.prepare(`
      INSERT INTO features (
        id, title, description, priority, status, category, epic,
        user_story, acceptance_criteria, estimated_story_points, actual_story_points,
        related_tasks, related_bugs, stakeholders, business_value,
        technical_notes, design_notes, testing_notes, tags, metadata,
        created, updated
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      feature.id,
      feature.title,
      feature.description,
      feature.priority,
      feature.status,
      feature.category,
      feature.epic,
      feature.userStory,
      JSON.stringify(feature.acceptanceCriteria),
      feature.estimatedStoryPoints,
      feature.actualStoryPoints,
      JSON.stringify(feature.relatedTasks),
      JSON.stringify(feature.relatedBugs),
      JSON.stringify(feature.stakeholders),
      feature.businessValue,
      JSON.stringify(feature.technicalNotes),
      JSON.stringify(feature.designNotes),
      JSON.stringify(feature.testingNotes),
      JSON.stringify(feature.tags),
      JSON.stringify(feature.metadata),
      feature.created,
      feature.updated
    );

    return feature;
  }

  async getFeature(id: string): Promise<Feature | null> {
    const stmt = this.db.database.prepare('SELECT * FROM features WHERE id = ?');
    const row = stmt.get(id) as any;
    
    if (!row) {
      return null;
    }

    return this.mapRowToFeature(row);
  }

  async updateFeature(id: string, data: FeatureUpdateInput): Promise<Feature> {
    const existing = await this.getFeature(id);
    if (!existing) {
      throw new Error(`Feature with ID ${id} not found`);
    }

    const updated: Feature = {
      ...existing,
      ...data,
      id,
      updated: new Date().toISOString()
    };

    const stmt = this.db.database.prepare(`
      UPDATE features SET
        title = ?, description = ?, priority = ?, status = ?, category = ?, epic = ?,
        user_story = ?, acceptance_criteria = ?, estimated_story_points = ?, actual_story_points = ?, 
        related_tasks = ?, related_bugs = ?, stakeholders = ?, business_value = ?,
        technical_notes = ?, design_notes = ?, testing_notes = ?, tags = ?, metadata = ?, updated = ?
      WHERE id = ?
    `);

    stmt.run(
      updated.title,
      updated.description,
      updated.priority,
      updated.status,
      updated.category,
      updated.epic,
      updated.userStory,
      JSON.stringify(updated.acceptanceCriteria),
      updated.estimatedStoryPoints,
      updated.actualStoryPoints,
      JSON.stringify(updated.relatedTasks),
      JSON.stringify(updated.relatedBugs),
      JSON.stringify(updated.stakeholders),
      updated.businessValue,
      JSON.stringify(updated.technicalNotes),
      JSON.stringify(updated.designNotes),
      JSON.stringify(updated.testingNotes),
      JSON.stringify(updated.tags),
      JSON.stringify(updated.metadata),
      updated.updated,
      id
    );

    return updated;
  }

  async deleteFeature(id: string): Promise<void> {
    const stmt = this.db.database.prepare('DELETE FROM features WHERE id = ?');
    const result = stmt.run(id);
    
    if (result.changes === 0) {
      throw new Error(`Feature with ID ${id} not found`);
    }
  }

  async listFeatures(options: {
    status?: string;
    priority?: string;
    tags?: string[];
    limit?: number;
    offset?: number;
  } = {}): Promise<Feature[]> {
    let query = 'SELECT * FROM features WHERE 1=1';
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

    return rows.map(row => this.mapRowToFeature(row));
  }

  async findMany(options: {
    status?: string;
    priority?: string;
    assignee?: string;
    tags?: string[];
    limit?: number;
    offset?: number;
  } = {}): Promise<Feature[]> {
    return this.listFeatures(options);
  }

  async searchFeatures(query: string, options: {
    limit?: number;
    offset?: number;
  } = {}): Promise<Feature[]> {
    const stmt = this.db.database.prepare(`
      SELECT * FROM features_fts
      WHERE features_fts MATCH ?
      ORDER BY rank
      LIMIT ? OFFSET ?
    `);

    const limit = options.limit || 50;
    const offset = options.offset || 0;

    const rows = stmt.all(query, limit, offset) as any[];
    const featureIds = rows.map(row => row.id);

    if (featureIds.length === 0) {
      return [];
    }

    const placeholders = featureIds.map(() => '?').join(',');
    const featuresStmt = this.db.database.prepare(`SELECT * FROM features WHERE id IN (${placeholders})`);
    const featureRows = featuresStmt.all(...featureIds) as any[];

    return featureRows.map(row => this.mapRowToFeature(row));
  }

  async getFeatureStats(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
  }> {
    const totalStmt = this.db.database.prepare('SELECT COUNT(*) as count FROM features');
    const total = (totalStmt.get() as any).count;

    const statusStmt = this.db.database.prepare(`
      SELECT status, COUNT(*) as count 
      FROM features 
      GROUP BY status
    `);
    const statusRows = statusStmt.all() as any[];
    const byStatus = statusRows.reduce((acc, row) => {
      acc[row.status] = row.count;
      return acc;
    }, {});

    const priorityStmt = this.db.database.prepare(`
      SELECT priority, COUNT(*) as count 
      FROM features 
      GROUP BY priority
    `);
    const priorityRows = priorityStmt.all() as any[];
    const byPriority = priorityRows.reduce((acc, row) => {
      acc[row.priority] = row.count;
      return acc;
    }, {});

    return { total, byStatus, byPriority };
  }

  private mapRowToFeature(row: any): Feature {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      priority: row.priority,
      status: row.status,
      category: row.category,
      epic: row.epic,
      userStory: row.user_story,
      acceptanceCriteria: row.acceptance_criteria ? JSON.parse(row.acceptance_criteria) : [],
      estimatedStoryPoints: row.estimated_story_points,
      actualStoryPoints: row.actual_story_points,
      relatedTasks: row.related_tasks ? JSON.parse(row.related_tasks) : [],
      relatedBugs: row.related_bugs ? JSON.parse(row.related_bugs) : [],
      stakeholders: row.stakeholders ? JSON.parse(row.stakeholders) : [],
      businessValue: row.business_value,
      technicalNotes: row.technical_notes ? JSON.parse(row.technical_notes) : [],
      designNotes: row.design_notes ? JSON.parse(row.design_notes) : [],
      testingNotes: row.testing_notes ? JSON.parse(row.testing_notes) : [],
      tags: row.tags ? JSON.parse(row.tags) : [],
      created: row.created,
      updated: row.updated,
      metadata: row.metadata ? JSON.parse(row.metadata) : {}
    };
  }
}