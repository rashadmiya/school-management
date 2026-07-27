import { z } from "zod";

export const feeTemplateSchema = z.object({
  title: z.string().min(1),
  amount: z.number().positive(),
  appliesTo: z.object({
    scope: z.enum(["school", "class", "section"]),
    class: z.string().optional(),
    section: z.string().optional()
  })
});

export const paymentSchema = z.object({
  studentId: z.string().min(1),
  amount: z.number().positive(),
  method: z.enum(["cash", "bank", "mobile"])
});
