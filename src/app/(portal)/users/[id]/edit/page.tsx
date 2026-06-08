"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getUserById, getRolesForTenant, updateUser } from "@/lib/api/users";
import { userFormSchema, type UserFormValues } from "@/lib/validation/user";
import { useRequestContext } from "@/features/auth/store";
import { useConfirm } from "@/components/feedback/confirm-provider";
import { useToast } from "@/components/feedback/toast-provider";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { FormField } from "@/components/forms/form-field";
import { LoadingState } from "@/components/status/loading-state";
import type { ApiError } from "@/types";

export default function EditUserPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const context = useRequestContext();
  const confirm = useConfirm();
  const toast = useToast();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { data: user, isLoading } = useQuery({
    queryKey: ["user", id, context.tenantId],
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

  const onSubmit = async (values: UserFormValues) => {
    const isDeactivating = user?.status === "active" && values.status === "inactive";
    const approved = await confirm({
      title: isDeactivating ? "Deactivate user?" : "Save changes?",
      description: isDeactivating
        ? "The user will lose access to the portal until reactivated."
        : "User profile and permissions will be updated.",
      confirmLabel: isDeactivating ? "Deactivate" : "Save changes",
      variant: isDeactivating ? "destructive" : "default",
      details: `${values.name} · ${values.email}`,
    });
    if (!approved) return;

    setSubmitError(null);
    try {
      await updateUser(context, id, {
        name: values.name,
        email: values.email,
        roleId: values.roleId,
        department: values.department,
        status: values.status,
      });
      await queryClient.invalidateQueries({ queryKey: ["users", context.tenantId] });
      await queryClient.invalidateQueries({ queryKey: ["user", id, context.tenantId] });
      toast.success(isDeactivating ? "User deactivated" : "User updated", values.name);
      router.push(`/users/${id}`);
    } catch (err) {
      const apiErr = err as ApiError;
      const message = apiErr.message ?? "Failed to update user";
      setSubmitError(message);
      toast.error("Update failed", message);
    }
  };

  if (isLoading) return <LoadingState />;

  return (
    <div>
      <PageHeader title="Edit user" />
      <Card className="max-w-xl">
        <CardContent className="pt-[24px]">
          {submitError && (
            <p className="mb-[16px] rounded-md border border-destructive/30 bg-destructive/10 px-[12px] py-[8px] text-sm text-destructive">
              {submitError}
            </p>
          )}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-[16px]">
            <FormField label="Full name" error={errors.name?.message} required>
              <Input {...register("name")} />
            </FormField>
            <FormField label="Email" error={errors.email?.message} required>
              <Input type="email" {...register("email")} />
            </FormField>
            <FormField label="CPF" error={errors.cpf?.message} required hint="CPF cannot be changed via API after creation">
              <Input {...register("cpf")} disabled />
            </FormField>
            <FormField label="Role" error={errors.roleId?.message} required>
              <Select {...register("roleId")}>
                {roles
                  .filter((r) => !r.isSystem)
                  .map((r) => (
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
                {isSubmitting ? "Saving..." : "Save changes"}
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
