import { z } from "zod";

export const attendanceSchema = z.object({
  classId: z.string().min(1),
  date: z.string().min(1),
  entries: z.array(z.object({
    studentId: z.string().min(1),
    status: z.enum(["present","absent","leave","holiday"])
  }))
});
