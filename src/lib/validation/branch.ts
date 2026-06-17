import { z } from "zod";

export const branchFormSchema = z.object({
  code: z
    .string()
    .min(2, "Code is required")
    .max(32, "Code must be at most 32 characters"),
  name: z.string().min(2, "Name is required").max(120),
  legalName: z.string().max(200).optional(),
  taxId: z.string().max(18).optional(),
  address: z.string().max(300).optional(),
  city: z.string().max(80).optional(),
  state: z.string().max(2).optional(),
  isContracted: z.boolean(),
  isActive: z.boolean(),
});

export type BranchFormValues = z.infer<typeof branchFormSchema>;
