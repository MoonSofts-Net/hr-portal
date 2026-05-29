import { z } from "zod";

export const roleFormSchema = z.object({
  name: z.string().min(2, "Role name is required"),
  description: z.string().optional(),
  permissionIds: z.array(z.string()).min(1, "Select at least one permission"),
});

export type RoleFormValues = z.infer<typeof roleFormSchema>;
