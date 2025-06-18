import { Prompt } from "../types/index.js";

export interface Cascade {
  id: string;
  prompts: Prompt[];
  createdAt: string;
}
