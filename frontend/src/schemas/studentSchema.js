// import { z } from "zod";

// // schemas/studentSchema.js
// export const studentSchema = z.object({
//   name: z.string().min(2, "Name must be at least 2 characters"),
//   rollNumber: z.string().min(1, "Roll number is required"),
//   password: z.string().min(6, "Password must be at least 6 characters").optional().or(z.literal("")),
//   contact: z.string().optional(),
//   gender: z.enum(['male', 'female', 'other']).optional(),
//   dateOfBirth: z.string().optional(),
//   classId: z.string().optional(),
//   gradeId: z.string().optional(),
//   parentId: z.string().optional(),
// });

// schemas/studentSchema.js
import { z } from 'zod';

export const updatedStudentSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  rollNumber: z.string().min(1, "Roll number is required"),
  guardianContact: z.string().optional(), // Changed from contact
  gender: z.enum(['male', 'female', 'other']).optional(),
  dateOfBirth: z.string().optional(),
  classId: z.string().optional(),
  gradeId: z.string().optional(),
  parentId: z.string().optional(),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
  
  // New fields
  session: z.string().min(4, "Session is required"),
  birthRegNo: z.string().optional(),
  fathersName: z.string().optional(),
  mothersName: z.string().optional(),
  religion: z.string().optional(),
  isPhysicallyDisabled: z.boolean().optional().default(false),
  disabilityDescription: z.string().optional(),
  lastExamResult: z.object({
    examName: z.string().optional(),
    achievedMarks: z.string().optional(),
    totalMarks: z.string().optional()
  }).optional()
});

// For student self-update (limited fields)
export const studentProfileSchema = updatedStudentSchema.pick({
  name: true,
  guardianContact: true,
  gender: true,
  dateOfBirth: true,
  religion: true,
  disabilityDescription: true
});
