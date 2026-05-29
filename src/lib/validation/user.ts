import { z } from "zod";

export const userFormSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email"),
  cpf: z.string().min(11, "CPF must have 11 digits").max(14),
  roleId: z.string().min(1, "Role is required"),
  department: z.string().optional(),
  status: z.enum(["active", "inactive", "pending"]),
});

export type UserFormValues = z.infer<typeof userFormSchema>;
