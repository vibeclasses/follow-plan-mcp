export interface Bug {
  id: string;
  title: string;
  description: string;
  status: "open" | "in-progress" | "resolved" | "closed";
  severity: "low" | "medium" | "high" | "critical";
  reproduction?: string;
  linkedTasks?: string[];
  createdAt: string;
  updatedAt: string;
}
