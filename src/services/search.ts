import type { DatabaseService } from './database.js';
import type { Task } from '../types/task.js';
import type { Feature } from '../types/feature.js';
import type { Bug } from '../types/bug.js';

export interface SearchResult {
  id: string;
  type: 'task' | 'feature' | 'bug';
  title: string;
  description: string;
  score: number;
  snippet: string;
}

export interface SearchOptions {
  types?: ('task' | 'feature' | 'bug')[];
  status?: string[];
  priority?: string[];
  assignee?: string[];
  tags?: string[];
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}

/**
 * Service for searching across all entities
 */
export class SearchService {
  constructor(private db: DatabaseService) {}

  async search(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
    const limit = options.limit || 50;
    const offset = options.offset || 0;
    const types = options.types || ['task', 'feature', 'bug'];
    
    const results: SearchResult[] = [];

    // Search tasks
    if (types.includes('task')) {
      const taskResults = await this.searchTasks(query, { limit, offset });
      results.push(...taskResults);
    }

    // Search features
    if (types.includes('feature')) {
      const featureResults = await this.searchFeatures(query, { limit, offset });
      results.push(...featureResults);
    }

    // Search bugs
    if (types.includes('bug')) {
      const bugResults = await this.searchBugs(query, { limit, offset });
      results.push(...bugResults);
    }

    // Sort by relevance score
    results.sort((a, b) => b.score - a.score);

    return results.slice(0, limit);
  }

  async advancedSearch(options: SearchOptions & { query: string }): Promise<SearchResult[]> {
    const { query, types = ['task', 'feature', 'bug'], limit = 50, offset = 0 } = options;
    const results: SearchResult[] = [];

    for (const type of types) {
      const typeResults = await this.searchByType(type, query, options);
      results.push(...typeResults);
    }

    // Sort by relevance score
    results.sort((a, b) => b.score - a.score);

    return results.slice(offset, offset + limit);
  }

  private async searchTasks(query: string, options: { limit: number; offset: number }): Promise<SearchResult[]> {
    const stmt = this.db.database.prepare(`
      SELECT t.*, rank 
      FROM tasks_fts fts
      JOIN tasks t ON t.id = fts.id
      WHERE tasks_fts MATCH ?
      ORDER BY rank
      LIMIT ? OFFSET ?
    `);

    const rows = stmt.all(query, options.limit, options.offset) as any[];
    
    return rows.map(row => ({
      id: row.id,
      type: 'task' as const,
      title: row.title,
      description: row.description,
      score: this.calculateScore(row.rank, 'task'),
      snippet: this.generateSnippet(row.description, query)
    }));
  }

  private async searchFeatures(query: string, options: { limit: number; offset: number }): Promise<SearchResult[]> {
    const stmt = this.db.database.prepare(`
      SELECT f.*, rank 
      FROM features_fts fts
      JOIN features f ON f.id = fts.id
      WHERE features_fts MATCH ?
      ORDER BY rank
      LIMIT ? OFFSET ?
    `);

    const rows = stmt.all(query, options.limit, options.offset) as any[];
    
    return rows.map(row => ({
      id: row.id,
      type: 'feature' as const,
      title: row.title,
      description: row.description,
      score: this.calculateScore(row.rank, 'feature'),
      snippet: this.generateSnippet(row.description, query)
    }));
  }

  private async searchBugs(query: string, options: { limit: number; offset: number }): Promise<SearchResult[]> {
    const stmt = this.db.database.prepare(`
      SELECT b.*, rank 
      FROM bugs_fts fts
      JOIN bugs b ON b.id = fts.id
      WHERE bugs_fts MATCH ?
      ORDER BY rank
      LIMIT ? OFFSET ?
    `);

    const rows = stmt.all(query, options.limit, options.offset) as any[];
    
    return rows.map(row => ({
      id: row.id,
      type: 'bug' as const,
      title: row.title,
      description: row.description,
      score: this.calculateScore(row.rank, 'bug'),
      snippet: this.generateSnippet(row.description, query)
    }));
  }

  private async searchByType(
    type: 'task' | 'feature' | 'bug',
    query: string,
    options: SearchOptions
  ): Promise<SearchResult[]> {
    let tableName = '';
    let ftsTable = '';
    
    switch (type) {
      case 'task':
        tableName = 'tasks';
        ftsTable = 'tasks_fts';
        break;
      case 'feature':
        tableName = 'features';
        ftsTable = 'features_fts';
        break;
      case 'bug':
        tableName = 'bugs';
        ftsTable = 'bugs_fts';
        break;
    }

    let sql = `
      SELECT t.*, rank 
      FROM ${ftsTable} fts
      JOIN ${tableName} t ON t.id = fts.id
      WHERE ${ftsTable} MATCH ?
    `;
    
    const params: any[] = [query];

    // Add filters
    if (options.status && options.status.length > 0) {
      const statusPlaceholders = options.status.map(() => '?').join(',');
      sql += ` AND t.status IN (${statusPlaceholders})`;
      params.push(...options.status);
    }

    if (options.priority && options.priority.length > 0) {
      const priorityPlaceholders = options.priority.map(() => '?').join(',');
      sql += ` AND t.priority IN (${priorityPlaceholders})`;
      params.push(...options.priority);
    }

    if (options.assignee && options.assignee.length > 0) {
      const assigneePlaceholders = options.assignee.map(() => '?').join(',');
      sql += ` AND t.assignee IN (${assigneePlaceholders})`;
      params.push(...options.assignee);
    }

    if (options.tags && options.tags.length > 0) {
      const tagConditions = options.tags.map(() => 'JSON_EXTRACT(t.tags, "$") LIKE ?').join(' OR ');
      sql += ` AND (${tagConditions})`;
      options.tags.forEach(tag => params.push(`%"${tag}"%`));
    }

    if (options.dateFrom) {
      sql += ' AND t.created_at >= ?';
      params.push(options.dateFrom);
    }

    if (options.dateTo) {
      sql += ' AND t.created_at <= ?';
      params.push(options.dateTo);
    }

    sql += ' ORDER BY rank';

    const stmt = this.db.database.prepare(sql);
    const rows = stmt.all(...params) as any[];
    
    return rows.map(row => ({
      id: row.id,
      type,
      title: row.title,
      description: row.description,
      score: this.calculateScore(row.rank, type),
      snippet: this.generateSnippet(row.description, query)
    }));
  }

  private calculateScore(rank: number, type: string): number {
    // Convert FTS5 rank to a 0-1 score
    // FTS5 rank is negative, with higher relevance having values closer to 0
    const baseScore = Math.max(0, 1 + rank / 10);
    
    // Apply type-specific weighting if needed
    const typeWeight = type === 'task' ? 1.0 : type === 'feature' ? 0.9 : 0.8;
    
    return baseScore * typeWeight;
  }

  private generateSnippet(text: string, query: string, maxLength: number = 150): string {
    if (!text) return '';
    
    const queryTerms = query.toLowerCase().split(/\s+/);
    const lowerText = text.toLowerCase();
    
    // Find the first occurrence of any query term
    let bestIndex = -1;
    for (const term of queryTerms) {
      const index = lowerText.indexOf(term);
      if (index !== -1 && (bestIndex === -1 || index < bestIndex)) {
        bestIndex = index;
      }
    }
    
    if (bestIndex === -1) {
      // No query terms found, return beginning of text
      return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }
    
    // Calculate snippet bounds
    const snippetStart = Math.max(0, bestIndex - 50);
    const snippetEnd = Math.min(text.length, snippetStart + maxLength);
    
    let snippet = text.substring(snippetStart, snippetEnd);
    
    // Add ellipsis if we're not at the boundaries
    if (snippetStart > 0) {
      snippet = '...' + snippet;
    }
    if (snippetEnd < text.length) {
      snippet = snippet + '...';
    }
    
    return snippet;
  }

  async getSearchStats(): Promise<{
    totalSearchable: number;
    byType: Record<string, number>;
  }> {
    const taskCount = (this.db.database.prepare('SELECT COUNT(*) as count FROM tasks').get() as any).count;
    const featureCount = (this.db.database.prepare('SELECT COUNT(*) as count FROM features').get() as any).count;
    const bugCount = (this.db.database.prepare('SELECT COUNT(*) as count FROM bugs').get() as any).count;
    
    return {
      totalSearchable: taskCount + featureCount + bugCount,
      byType: {
        task: taskCount,
        feature: featureCount,
        bug: bugCount
      }
    };
  }

  async rebuildSearchIndex(): Promise<void> {
    // Rebuild FTS5 indexes by reinserting all data
    const tables = ['tasks', 'features', 'bugs'];
    
    for (const table of tables) {
      const ftsTable = `${table}_fts`;
      
      // Clear existing FTS data
      this.db.database.prepare(`DELETE FROM ${ftsTable}`).run();
      
      // Reinsert all data
      const stmt = this.db.database.prepare(`SELECT id, title, description FROM ${table}`);
      const rows = stmt.all() as any[];
      
      const insertStmt = this.db.database.prepare(`
        INSERT INTO ${ftsTable} (id, title, description) 
        VALUES (?, ?, ?)
      `);
      
      for (const row of rows) {
        insertStmt.run(row.id, row.title, row.description);
      }
    }
  }
}