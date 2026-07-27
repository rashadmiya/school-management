import { z } from "zod";

export const resultSchema = z.object({
  student: z.string().min(1),
  subject: z.string().min(1),
  type: z.enum(["exam","assignment"]),
  score: z.number(),
  exam: z.string().optional(),
  assignment: z.string().optional(),
  term: z.string().optional(),
  year: z.number().optional(),
});
