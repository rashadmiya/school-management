import { z } from "zod";

export const examSchema = z.object({
  title: z.string().min(2, "Title required"),
  classId: z.string().min(1),
  subjectId: z.string().min(1),
  date: z.string().min(1),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  totalMarks: z.number().optional(),
});
