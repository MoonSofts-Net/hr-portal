"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { userFormSchema, type UserFormValues } from "@/lib/validation/user";
import { getRolesForTenant } from "@/lib/api/users";
import { useRequestContext } from "@/features/auth/store";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { FormField } from "@/components/forms/form-field";

export default function NewUserPage() {
  const router = useRouter();
  const context = useRequestContext();
  const { data: roles = [] } = useQuery({
    queryKey: ["roles-select", context.tenantId],
    queryFn: () => getRolesForTenant(context),
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: { status: "pending" },
  });

  const onSubmit = async () => {
    await new Promise((r) => setTimeout(r, 500));
    router.push("/users");
  };

  return (
    <div>
      <PageHeader title="Create user" description="Add a new user to the tenant" />
      <Card className="max-w-xl">
        <CardContent className="pt-[24px]">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-[16px]">
            <FormField label="Full name" error={errors.name?.message} required>
              <Input {...register("name")} />
            </FormField>
            <FormField label="Email" error={errors.email?.message} required>
              <Input type="email" {...register("email")} />
            </FormField>
            <FormField label="CPF" error={errors.cpf?.message} required hint="Stored securely on backend">
              <Input {...register("cpf")} placeholder="00000000000" />
            </FormField>
            <FormField label="Role" error={errors.roleId?.message} required>
              <Select {...register("roleId")}>
                <option value="">Select role</option>
                {roles
                  .filter((r) => !r.isSystem || r.name !== "Super Administrator")
                  .map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
              </Select>
            </FormField>
            <FormField label="Department" error={errors.department?.message}>
              <Input {...register("department")} />
            </FormField>
            <FormField label="Status" error={errors.status?.message} required>
              <Select {...register("status")}>
                <option value="pending">Pending</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Select>
            </FormField>
            <div className="flex gap-[8px]">
              <Button type="submit" disabled={isSubmitting}>
                Save user
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
