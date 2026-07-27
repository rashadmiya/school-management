import { z } from "zod";

export const assignmentSchema = z.object({
  title: z.string().min(2, "Title required"),
  description: z.string().optional(),
  subjectId: z.string().min(1),
  classId: z.string().min(1),
  dueDate: z.string().optional(),
});
