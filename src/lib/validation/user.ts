import { z } from "zod";
import { UUID_REGEX } from "@/lib/constants/ids";
import { normalizeCpf } from "@/lib/utils/cpf";

const roleIdField = z
  .string()
  .min(1, "validation.users.roleRequired")
  .regex(UUID_REGEX, "validation.users.roleFromList");

const cpfField = z
  .string()
  .min(1, "validation.users.cpfRequired")
  .refine((value) => normalizeCpf(value).length === 11, "validation.users.cpfElevenDigits");

export const userFormSchema = z.object({
  name: z.string().min(2, "validation.users.nameRequired"),
  email: z.string().email("validation.users.invalidEmail"),
  cpf: cpfField,
  roleId: roleIdField,
  branchId: z
    .string()
    .min(1, "validation.users.branchRequired")
    .regex(UUID_REGEX, "validation.users.branchFromList"),
  department: z.string().optional(),
  status: z.enum(["active", "inactive", "pending"]),
});

export type UserFormValues = z.infer<typeof userFormSchema>;

export const createUserFormSchema = userFormSchema;

export type CreateUserFormValues = z.infer<typeof createUserFormSchema>;
