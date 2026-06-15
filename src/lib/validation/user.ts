import { z } from "zod";
import { UUID_REGEX } from "@/lib/constants/ids";
import { normalizeCpf } from "@/lib/utils/cpf";

const roleIdField = z
  .string()
  .min(1, "Role is required")
  .regex(UUID_REGEX, "Select a role from the list");

const cpfField = z
  .string()
  .min(1, "CPF is required")
  .refine((value) => normalizeCpf(value).length === 11, "CPF must have 11 digits");

export const userFormSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email"),
  cpf: cpfField,
  roleId: roleIdField,
  branchId: z
    .string()
    .min(1, "Branch is required")
    .regex(UUID_REGEX, "Select a branch from the list"),
  department: z.string().optional(),
  status: z.enum(["active", "inactive", "pending"]),
});

export type UserFormValues = z.infer<typeof userFormSchema>;

export const createUserFormSchema = userFormSchema.extend({
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type CreateUserFormValues = z.infer<typeof createUserFormSchema>;
