"use client";

import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { getUserById, getRolesForTenant } from "@/lib/api/users";
import { userFormSchema, type UserFormValues } from "@/lib/validation/user";
import { useRequestContext } from "@/features/auth/store";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { FormField } from "@/components/forms/form-field";
import { LoadingState } from "@/components/status/loading-state";

export default function EditUserPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const context = useRequestContext();

  const { data: user, isLoading } = useQuery({
    queryKey: ["user", id],
    queryFn: () => getUserById(id, context),
  });

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
    values: user
      ? {
          name: user.name,
          email: user.email,
          cpf: user.cpf,
          roleId: user.roleId,
          department: user.department,
          status: user.status,
        }
      : undefined,
  });

  const onSubmit = async () => {
    await new Promise((r) => setTimeout(r, 500));
    router.push(`/users/${id}`);
  };

  if (isLoading) return <LoadingState />;

  return (
    <div>
      <PageHeader title="Edit user" />
      <Card className="max-w-xl">
        <CardContent className="pt-[24px]">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-[16px]">
            <FormField label="Full name" error={errors.name?.message} required>
              <Input {...register("name")} />
            </FormField>
            <FormField label="Email" error={errors.email?.message} required>
              <Input type="email" {...register("email")} />
            </FormField>
            <FormField label="CPF" error={errors.cpf?.message} required>
              <Input {...register("cpf")} />
            </FormField>
            <FormField label="Role" error={errors.roleId?.message} required>
              <Select {...register("roleId")}>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Department">
              <Input {...register("department")} />
            </FormField>
            <FormField label="Status" required>
              <Select {...register("status")}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
              </Select>
            </FormField>
            <div className="flex gap-[8px]">
              <Button type="submit" disabled={isSubmitting}>
                Save changes
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
