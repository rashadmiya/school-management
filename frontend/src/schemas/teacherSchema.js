// src/schemas/teacherSchema.js
import { z } from "zod";

// schemas/teacherSchema.js
export const teacherSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
  phone: z.string().optional(),
  subjectIds: z.array(z.string()).optional().default([]),
  classIds: z.array(z.string()).optional().default([]),
});
