import { z } from "zod";

export const hrRequestSchema = z.object({
  subject: z.string().min(3, "Subject is required"),
  category: z.string().min(1, "Category is required"),
  body: z.string().min(10, "Describe your request (min 10 characters)"),
  priority: z.enum(["low", "medium", "high"]),
});

export type HRRequestFormValues = z.infer<typeof hrRequestSchema>;

export const pointAdjustmentSchema = z.object({
  date: z.string().min(1, "Date is required"),
  reason: z.string().min(10, "Explain the reason (min 10 characters)"),
  requestedChanges: z.string().min(5, "Describe the requested changes"),
});

export type PointAdjustmentFormValues = z.infer<typeof pointAdjustmentSchema>;
