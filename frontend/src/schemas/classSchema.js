import { z } from "zod";
export const classSchema = z.object({
  name: z.string().min(1, "Class name required"),
  supervisor: z.string().optional(),
  grade: z.string().optional()
});
