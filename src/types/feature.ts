export interface Feature {
  id: string;
  title: string;
  description: string;
  status: "planned" | "in-progress" | "implemented" | "testing" | "done";
  priority: "low" | "medium" | "high" | "critical";
  linkedTasks?: string[];
  createdAt: string;
  updatedAt: string;
}
