export interface Task {
  id: string;
  title: string;
  description: string;
  status: "todo" | "in-progress" | "done" | "blocked";
  priority: "low" | "medium" | "high" | "critical";
  assignee?: string;
  createdAt: string;
  updatedAt: string;
  linkedFeatures?: string[];
  linkedBugs?: string[];
}
