export interface Rule {
  id: string;
  title: string;
  description: string;
  category: "coding" | "architecture" | "testing" | "deployment" | "general";
  createdAt: string;
}
