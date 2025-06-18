import Database from "better-sqlite3";
import { logger } from "../utils/logger.js";
import type {
  Task,
  Feature,
  Bug,
  Rule,
  Message,
  Prompt,
  Cascade,
  SearchResult,
  SearchOptions,
  DatabaseConfig,
} from "../types/index.js";

/**
 * Database service providing SQLite + FTS5 storage for all plan items
 */
export class DatabaseService {
  private db: Database.Database;
  private readonly dbPath: string;
  private isInitialized = false;

  constructor(dbPath: string, config?: Partial<DatabaseConfig>) {
    this.dbPath = dbPath;
    this.db = new Database(dbPath, {
      verbose: config?.enableWAL !== false ? console.log : undefined,
    });

    // Enable WAL mode for better concurrency
    if (config?.enableWAL !== false) {
      this.db.pragma("journal_mode = WAL");
    }

    // Optimize for performance
    this.db.pragma("synchronous = NORMAL");
    this.db.pragma("cache_size = 1000");
    this.db.pragma("temp_store = memory");
    this.db.pragma("mmap_size = 268435456"); // 256MB
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      logger.info("Initializing database...");

      // Create all tables
      this.createTables();

      // Create indexes
      this.createIndexes();

      // Create FTS5 tables
      this.createFTSTables();

      // Create triggers for automatic FTS updates
      this.createTriggers();

      this.isInitialized = true;
      logger.info("Database initialized successfully");
    } catch (error) {
      logger.error("Failed to initialize database", error);
      throw error;
    }
  }

  private createTables(): void {
    // Tasks table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'todo',
        priority TEXT NOT NULL DEFAULT 'medium',
        assignee TEXT,
        estimated_hours REAL,
        actual_hours REAL,
        due_date TEXT,
        dependencies TEXT DEFAULT '[]',
        blockers TEXT DEFAULT '[]',
        related_features TEXT DEFAULT '[]',
        related_bugs TEXT DEFAULT '[]',
        progress INTEGER DEFAULT 0,
        notes TEXT DEFAULT '[]',
        attachments TEXT DEFAULT '[]',
        tags TEXT DEFAULT '[]',
        metadata TEXT DEFAULT '{}',
        created TEXT NOT NULL,
        updated TEXT NOT NULL
      )
    `);

    // Features table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS features (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'todo',
        priority TEXT NOT NULL DEFAULT 'medium',
        category TEXT NOT NULL,
        epic TEXT,
        user_story TEXT NOT NULL,
        acceptance_criteria TEXT DEFAULT '[]',
        estimated_story_points REAL,
        actual_story_points REAL,
        related_tasks TEXT DEFAULT '[]',
        related_bugs TEXT DEFAULT '[]',
        stakeholders TEXT DEFAULT '[]',
        business_value TEXT,
        technical_notes TEXT DEFAULT '[]',
        design_notes TEXT DEFAULT '[]',
        testing_notes TEXT DEFAULT '[]',
        tags TEXT DEFAULT '[]',
        metadata TEXT DEFAULT '{}',
        created TEXT NOT NULL,
        updated TEXT NOT NULL
      )
    `);

    // Bugs table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS bugs (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'todo',
        priority TEXT NOT NULL DEFAULT 'medium',
        severity TEXT NOT NULL,
        component TEXT NOT NULL,
        version TEXT,
        environment TEXT,
        reporter TEXT NOT NULL,
        assignee TEXT,
        steps_to_reproduce TEXT DEFAULT '[]',
        expected_behavior TEXT NOT NULL,
        actual_behavior TEXT NOT NULL,
        workaround TEXT,
        related_tasks TEXT DEFAULT '[]',
        related_features TEXT DEFAULT '[]',
        duplicate_of TEXT,
        attachments TEXT DEFAULT '[]',
        test_cases TEXT DEFAULT '[]',
        tags TEXT DEFAULT '[]',
        metadata TEXT DEFAULT '{}',
        created TEXT NOT NULL,
        updated TEXT NOT NULL
      )
    `);

    // Rules table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS rules (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        type TEXT NOT NULL,
        category TEXT NOT NULL,
        condition_text TEXT NOT NULL,
        action_text TEXT NOT NULL,
        enabled INTEGER DEFAULT 1,
        scope TEXT DEFAULT '[]',
        exceptions TEXT DEFAULT '[]',
        validation_script TEXT,
        automation_script TEXT,
        trigger_events TEXT DEFAULT '[]',
        last_triggered TEXT,
        trigger_count INTEGER DEFAULT 0,
        tags TEXT DEFAULT '[]',
        metadata TEXT DEFAULT '{}',
        created TEXT NOT NULL,
        updated TEXT NOT NULL
      )
    `);

    // Messages table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        title TEXT,
        content TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'note',
        sender TEXT NOT NULL,
        sender_name TEXT,
        thread_id TEXT,
        reply_to TEXT,
        mentions TEXT DEFAULT '[]',
        attachments TEXT DEFAULT '[]',
        reactions TEXT DEFAULT '{}',
        edited TEXT,
        edit_history TEXT DEFAULT '[]',
        related_items TEXT DEFAULT '[]',
        tags TEXT DEFAULT '[]',
        metadata TEXT DEFAULT '{}',
        created TEXT NOT NULL,
        updated TEXT NOT NULL
      )
    `);

    // Prompts table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS prompts (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        type TEXT NOT NULL,
        scope TEXT NOT NULL,
        content TEXT NOT NULL,
        variables TEXT DEFAULT '[]',
        conditions TEXT DEFAULT '[]',
        priority INTEGER DEFAULT 50,
        enabled INTEGER DEFAULT 1,
        usage_count INTEGER DEFAULT 0,
        last_used TEXT,
        success_rate REAL,
        parent_prompt TEXT,
        child_prompts TEXT DEFAULT '[]',
        tags TEXT DEFAULT '[]',
        metadata TEXT DEFAULT '{}',
        created TEXT NOT NULL,
        updated TEXT NOT NULL
      )
    `);

    // Cascades table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS cascades (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        type TEXT NOT NULL,
        source_type TEXT NOT NULL,
        source_id TEXT,
        target_type TEXT NOT NULL,
        target_id TEXT,
        trigger_action TEXT NOT NULL,
        cascade_actions TEXT NOT NULL,
        conditions TEXT DEFAULT '[]',
        enabled INTEGER DEFAULT 1,
        execution_count INTEGER DEFAULT 0,
        last_executed TEXT,
        success_rate REAL DEFAULT 1.0,
        retry_attempts INTEGER DEFAULT 0,
        max_retries INTEGER DEFAULT 3,
        tags TEXT DEFAULT '[]',
        metadata TEXT DEFAULT '{}',
        created TEXT NOT NULL,
        updated TEXT NOT NULL
      )
    `);
  }

  private createIndexes(): void {
    // Task indexes
    this.db.exec(
      "CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status)"
    );
    this.db.exec(
      "CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority)"
    );
    this.db.exec(
      "CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee)"
    );
    this.db.exec(
      "CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date)"
    );
    this.db.exec(
      "CREATE INDEX IF NOT EXISTS idx_tasks_created ON tasks(created)"
    );
    this.db.exec(
      "CREATE INDEX IF NOT EXISTS idx_tasks_updated ON tasks(updated)"
    );

    // Feature indexes
    this.db.exec(
      "CREATE INDEX IF NOT EXISTS idx_features_status ON features(status)"
    );
    this.db.exec(
      "CREATE INDEX IF NOT EXISTS idx_features_priority ON features(priority)"
    );
    this.db.exec(
      "CREATE INDEX IF NOT EXISTS idx_features_category ON features(category)"
    );
    this.db.exec(
      "CREATE INDEX IF NOT EXISTS idx_features_epic ON features(epic)"
    );

    // Bug indexes
    this.db.exec("CREATE INDEX IF NOT EXISTS idx_bugs_status ON bugs(status)");
    this.db.exec(
      "CREATE INDEX IF NOT EXISTS idx_bugs_priority ON bugs(priority)"
    );
    this.db.exec(
      "CREATE INDEX IF NOT EXISTS idx_bugs_severity ON bugs(severity)"
    );
    this.db.exec(
      "CREATE INDEX IF NOT EXISTS idx_bugs_component ON bugs(component)"
    );
    this.db.exec(
      "CREATE INDEX IF NOT EXISTS idx_bugs_reporter ON bugs(reporter)"
    );
    this.db.exec(
      "CREATE INDEX IF NOT EXISTS idx_bugs_assignee ON bugs(assignee)"
    );

    // Rule indexes
    this.db.exec("CREATE INDEX IF NOT EXISTS idx_rules_type ON rules(type)");
    this.db.exec(
      "CREATE INDEX IF NOT EXISTS idx_rules_category ON rules(category)"
    );
    this.db.exec(
      "CREATE INDEX IF NOT EXISTS idx_rules_enabled ON rules(enabled)"
    );

    // Message indexes
    this.db.exec(
      "CREATE INDEX IF NOT EXISTS idx_messages_type ON messages(type)"
    );
    this.db.exec(
      "CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender)"
    );
    this.db.exec(
      "CREATE INDEX IF NOT EXISTS idx_messages_thread_id ON messages(thread_id)"
    );

    // Prompt indexes
    this.db.exec(
      "CREATE INDEX IF NOT EXISTS idx_prompts_type ON prompts(type)"
    );
    this.db.exec(
      "CREATE INDEX IF NOT EXISTS idx_prompts_scope ON prompts(scope)"
    );
    this.db.exec(
      "CREATE INDEX IF NOT EXISTS idx_prompts_enabled ON prompts(enabled)"
    );

    // Cascade indexes
    this.db.exec(
      "CREATE INDEX IF NOT EXISTS idx_cascades_type ON cascades(type)"
    );
    this.db.exec(
      "CREATE INDEX IF NOT EXISTS idx_cascades_source_type ON cascades(source_type)"
    );
    this.db.exec(
      "CREATE INDEX IF NOT EXISTS idx_cascades_target_type ON cascades(target_type)"
    );
    this.db.exec(
      "CREATE INDEX IF NOT EXISTS idx_cascades_enabled ON cascades(enabled)"
    );
  }

  private createFTSTables(): void {
    // Create FTS5 table for full-text search across all items
    this.db.exec(`
      CREATE VIRTUAL TABLE IF NOT EXISTS fts_search USING fts5(
        id UNINDEXED,
        type UNINDEXED,
        title,
        description,
        content,
        tags,
        metadata,
        content='',
        contentless_delete=1
      )
    `);
  }

  private createTriggers(): void {
    // Tasks FTS triggers
    this.db.exec(`
      CREATE TRIGGER IF NOT EXISTS tasks_fts_insert AFTER INSERT ON tasks BEGIN
        INSERT INTO fts_search(id, type, title, description, content, tags, metadata)
        VALUES (NEW.id, 'task', NEW.title, NEW.description, 
                NEW.title || ' ' || NEW.description || ' ' || COALESCE(NEW.assignee, ''),
                NEW.tags, NEW.metadata);
      END
    `);

    this.db.exec(`
      CREATE TRIGGER IF NOT EXISTS tasks_fts_update AFTER UPDATE ON tasks BEGIN
        UPDATE fts_search SET 
          title = NEW.title,
          description = NEW.description,
          content = NEW.title || ' ' || NEW.description || ' ' || COALESCE(NEW.assignee, ''),
          tags = NEW.tags,
          metadata = NEW.metadata
        WHERE id = NEW.id AND type = 'task';
      END
    `);

    this.db.exec(`
      CREATE TRIGGER IF NOT EXISTS tasks_fts_delete AFTER DELETE ON tasks BEGIN
        DELETE FROM fts_search WHERE id = OLD.id AND type = 'task';
      END
    `);

    // Features FTS triggers
    this.db.exec(`
      CREATE TRIGGER IF NOT EXISTS features_fts_insert AFTER INSERT ON features BEGIN
        INSERT INTO fts_search(id, type, title, description, content, tags, metadata)
        VALUES (NEW.id, 'feature', NEW.title, NEW.description,
                NEW.title || ' ' || NEW.description || ' ' || NEW.user_story || ' ' || COALESCE(NEW.business_value, ''),
                NEW.tags, NEW.metadata);
      END
    `);

    this.db.exec(`
      CREATE TRIGGER IF NOT EXISTS features_fts_update AFTER UPDATE ON features BEGIN
        UPDATE fts_search SET 
          title = NEW.title,
          description = NEW.description,
          content = NEW.title || ' ' || NEW.description || ' ' || NEW.user_story || ' ' || COALESCE(NEW.business_value, ''),
          tags = NEW.tags,
          metadata = NEW.metadata
        WHERE id = NEW.id AND type = 'feature';
      END
    `);

    this.db.exec(`
      CREATE TRIGGER IF NOT EXISTS features_fts_delete AFTER DELETE ON features BEGIN
        DELETE FROM fts_search WHERE id = OLD.id AND type = 'feature';
      END
    `);

    // Bugs FTS triggers
    this.db.exec(`
      CREATE TRIGGER IF NOT EXISTS bugs_fts_insert AFTER INSERT ON bugs BEGIN
        INSERT INTO fts_search(id, type, title, description, content, tags, metadata)
        VALUES (NEW.id, 'bug', NEW.title, NEW.description,
                NEW.title || ' ' || NEW.description || ' ' || NEW.expected_behavior || ' ' || NEW.actual_behavior,
                NEW.tags, NEW.metadata);
      END
    `);

    this.db.exec(`
      CREATE TRIGGER IF NOT EXISTS bugs_fts_update AFTER UPDATE ON bugs BEGIN
        UPDATE fts_search SET 
          title = NEW.title,
          description = NEW.description,
          content = NEW.title || ' ' || NEW.description || ' ' || NEW.expected_behavior || ' ' || NEW.actual_behavior,
          tags = NEW.tags,
          metadata = NEW.metadata
        WHERE id = NEW.id AND type = 'bug';
      END
    `);

    this.db.exec(`
      CREATE TRIGGER IF NOT EXISTS bugs_fts_delete AFTER DELETE ON bugs BEGIN
        DELETE FROM fts_search WHERE id = OLD.id AND type = 'bug';
      END
    `);

    // Rules FTS triggers
    this.db.exec(`
      CREATE TRIGGER IF NOT EXISTS rules_fts_insert AFTER INSERT ON rules BEGIN
        INSERT INTO fts_search(id, type, title, description, content, tags, metadata)
        VALUES (NEW.id, 'rule', NEW.title, NEW.description,
                NEW.title || ' ' || NEW.description || ' ' || NEW.condition_text || ' ' || NEW.action_text,
                NEW.tags, NEW.metadata);
      END
    `);

    this.db.exec(`
      CREATE TRIGGER IF NOT EXISTS rules_fts_update AFTER UPDATE ON rules BEGIN
        UPDATE fts_search SET 
          title = NEW.title,
          description = NEW.description,
          content = NEW.title || ' ' || NEW.description || ' ' || NEW.condition_text || ' ' || NEW.action_text,
          tags = NEW.tags,
          metadata = NEW.metadata
        WHERE id = NEW.id AND type = 'rule';
      END
    `);

    this.db.exec(`
      CREATE TRIGGER IF NOT EXISTS rules_fts_delete AFTER DELETE ON rules BEGIN
        DELETE FROM fts_search WHERE id = OLD.id AND type = 'rule';
      END
    `);
  }

  // Generic CRUD operations
  async create(table: string, item: Record<string, unknown>): Promise<string> {
    const columns = Object.keys(item);
    const placeholders = columns.map(() => "?").join(", ");
    const values = Object.values(item);

    const stmt = this.db.prepare(`
      INSERT INTO ${table} (${columns.join(", ")})
      VALUES (${placeholders})
    `);

    const result = stmt.run(...values);
    return item.id as string;
  }

  async update(
    table: string,
    id: string,
    updates: Record<string, unknown>
  ): Promise<boolean> {
    const columns = Object.keys(updates);
    const setClause = columns.map((col) => `${col} = ?`).join(", ");
    const values = [...Object.values(updates), id];

    const stmt = this.db.prepare(`
      UPDATE ${table} SET ${setClause} WHERE id = ?
    `);

    const result = stmt.run(...values);
    return result.changes > 0;
  }

  async delete(table: string, id: string): Promise<boolean> {
    const stmt = this.db.prepare(`DELETE FROM ${table} WHERE id = ?`);
    const result = stmt.run(id);
    return result.changes > 0;
  }

  async findById(
    table: string,
    id: string
  ): Promise<Record<string, unknown> | null> {
    const stmt = this.db.prepare(`SELECT * FROM ${table} WHERE id = ?`);
    const result = stmt.get(id) as Record<string, unknown> | undefined;
    return result || null;
  }

  async findMany(
    table: string,
    where?: Record<string, unknown>,
    orderBy?: string,
    limit?: number,
    offset?: number
  ): Promise<Record<string, unknown>[]> {
    let query = `SELECT * FROM ${table}`;
    const params: unknown[] = [];

    if (where && Object.keys(where).length > 0) {
      const conditions = Object.keys(where).map((key) => `${key} = ?`);
      query += ` WHERE ${conditions.join(" AND ")}`;
      params.push(...Object.values(where));
    }

    if (orderBy) {
      query += ` ORDER BY ${orderBy}`;
    }

    if (limit) {
      query += ` LIMIT ?`;
      params.push(limit);
    }

    if (offset) {
      query += ` OFFSET ?`;
      params.push(offset);
    }

    const stmt = this.db.prepare(query);
    return stmt.all(...params) as Record<string, unknown>[];
  }

  // Full-text search
  async search(options: SearchOptions): Promise<SearchResult[]> {
    let query = `
      SELECT 
        f.id,
        f.type,
        f.title,
        f.description,
        snippet(fts_search, 2, '<mark>', '</mark>', '...', 32) as snippet,
        rank
      FROM fts_search f
      WHERE fts_search MATCH ?
    `;

    const params: unknown[] = [options.query];

    // Add type filter
    if (options.type) {
      query += ` AND f.type = ?`;
      params.push(options.type);
    }

    // Add sorting
    const sortBy = options.sortBy || "relevance";
    if (sortBy === "relevance") {
      query += ` ORDER BY rank`;
    } else {
      // Join with the appropriate table to get sort fields
      const tableMap = {
        task: "tasks",
        feature: "features",
        bug: "bugs",
        rule: "rules",
        message: "messages",
        prompt: "prompts",
      };

      if (options.type && tableMap[options.type]) {
        query = query.replace(
          "FROM fts_search f",
          `FROM fts_search f JOIN ${tableMap[options.type]} t ON f.id = t.id`
        );
        query += ` ORDER BY t.${sortBy === "created" ? "created" : sortBy === "updated" ? "updated" : "priority"}`;
      }
    }

    const sortOrder = options.sortOrder || "desc";
    query += ` ${sortOrder.toUpperCase()}`;

    // Add pagination
    if (options.limit) {
      query += ` LIMIT ?`;
      params.push(options.limit);
    }

    if (options.offset) {
      query += ` OFFSET ?`;
      params.push(options.offset);
    }

    const stmt = this.db.prepare(query);
    const results = stmt.all(...params) as Array<{
      id: string;
      type: string;
      title: string;
      description: string;
      snippet: string;
      rank: number;
    }>;

    return results.map((row) => ({
      id: row.id,
      type: row.type as
        | "task"
        | "feature"
        | "bug"
        | "rule"
        | "message"
        | "prompt",
      title: row.title,
      description: row.description,
      relevance: Math.max(0, Math.min(1, 1 / (1 + Math.abs(row.rank)))),
      highlights: [row.snippet],
      path: `/.plan/${row.type}s/${row.id}.md`,
    }));
  }

  // Advanced search with complex filters
  async advancedSearch(
    query: string,
    filters: Record<string, unknown> = {},
    options: Partial<SearchOptions> = {}
  ): Promise<SearchResult[]> {
    // This would implement more complex search logic
    // For now, delegate to basic search
    return this.search({ query, ...options });
  }

  // Database maintenance
  async vacuum(): Promise<void> {
    this.db.exec("VACUUM");
  }

  async analyze(): Promise<void> {
    this.db.exec("ANALYZE");
  }

  async rebuildFTS(): Promise<void> {
    this.db.exec('INSERT INTO fts_search(fts_search) VALUES("rebuild")');
  }

  // Backup and restore
  async backup(backupPath: string): Promise<void> {
    await this.db.backup(backupPath);
  }

  async getStats(): Promise<Record<string, number>> {
    const stats: Record<string, number> = {};

    const tables = [
      "tasks",
      "features",
      "bugs",
      "rules",
      "messages",
      "prompts",
      "cascades",
    ];

    for (const table of tables) {
      const stmt = this.db.prepare(`SELECT COUNT(*) as count FROM ${table}`);
      const result = stmt.get() as { count: number };
      stats[table] = result.count;
    }

    return stats;
  }

  // Transaction support
  transaction<T>(fn: (db: Database.Database) => T): T {
    return this.db.transaction(fn)(this.db);
  }

  // Close database connection
  async close(): Promise<void> {
    if (this.db && this.db.open) {
      this.db.close();
      logger.info("Database connection closed");
    }
  }

  // Getters
  get database(): Database.Database {
    return this.db;
  }

  get isReady(): boolean {
    return this.isInitialized && this.db.open;
  }
}
