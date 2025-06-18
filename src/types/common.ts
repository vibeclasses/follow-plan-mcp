export type Priority = "low" | "medium" | "high" | "critical";
export type Status =
  | "todo"
  | "in-progress"
  | "blocked"
  | "completed"
  | "cancelled";
export type Severity = "minor" | "major" | "critical" | "blocker";
export type RuleType = "validation" | "automation" | "guideline" | "constraint";

export interface BaseItem {
  id: string;
  title: string;
  description: string;
  tags: string[];
  created: string;
  updated: string;
  metadata: Record<string, unknown>;
}

export interface TimestampedItem {
  created: string;
  updated: string;
}

export interface TaggedItem {
  tags: string[];
}

export interface PrioritizedItem {
  priority: Priority;
}

export interface SearchResult {
  id: string;
  type: "task" | "feature" | "bug" | "rule" | "message" | "prompt";
  title: string;
  description: string;
  relevance: number;
  highlights: string[];
  path: string;
}

export interface SearchOptions {
  query: string;
  type?: "task" | "feature" | "bug" | "rule" | "message" | "prompt";
  tags?: string[];
  priority?: Priority;
  status?: Status;
  limit?: number;
  offset?: number;
  sortBy?: "relevance" | "created" | "updated" | "priority";
  sortOrder?: "asc" | "desc";
}

export interface DatabaseConfig {
  path: string;
  enableWAL?: boolean;
  enableFTS?: boolean;
  backupInterval?: number;
  maxBackups?: number;
}

export interface PlanStructure {
  indexPath: string;
  tasksDir: string;
  featuresDir: string;
  bugsDir: string;
  rulesDir: string;
  workflowsDir: string;
  changelogDir: string;
  tmpDir: string;
  databasePath: string;
}
