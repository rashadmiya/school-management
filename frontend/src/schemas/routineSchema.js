import { z } from "zod";
export const routineSchema = z.object({
  day: z.string().min(1),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  class: z.string().min(1),
  subject: z.string().min(1),
  teacher: z.string().min(1),
});
