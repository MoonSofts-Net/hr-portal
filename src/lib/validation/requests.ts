import { z } from "zod";

export const HR_REQUEST_CATEGORIES = [
  "Benefits",
  "Payroll",
  "Time off",
  "Onboarding",
  "Documents",
  "Workplace",
  "Other",
] as const;

export const hrRequestSchema = z.object({
  subject: z.string().min(3, "Subject must be at least 3 characters"),
  category: z.enum(HR_REQUEST_CATEGORIES, {
    error: "Select a category",
  }),
  body: z.string().min(10, "Describe your request (min 10 characters)"),
  priority: z.enum(["low", "medium", "high"], {
    error: "Select a priority",
  }),
});

export type HRRequestFormValues = z.infer<typeof hrRequestSchema>;

export const pointAdjustmentSchema = z.object({
  date: z.string().min(1, "Date is required"),
  reason: z.string().min(10, "Explain the reason (min 10 characters)"),
  requestedChanges: z.string().min(5, "Describe the requested changes"),
});

export type PointAdjustmentFormValues = z.infer<typeof pointAdjustmentSchema>;
