export type Priority = "low" | "medium" | "high" | "critical";
export type Status = "todo" | "in-progress" | "done" | "blocked";

export interface BaseItem {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  updatedAt?: string;
}
