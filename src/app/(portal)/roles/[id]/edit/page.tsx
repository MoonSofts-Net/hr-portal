"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getRoleById, updateRole } from "@/lib/api/roles";
import { roleFormSchema, type RoleFormValues } from "@/lib/validation/role";
import { useRequestContext } from "@/features/auth/store";
import { useConfirm } from "@/components/feedback/confirm-provider";
import { useToast } from "@/components/feedback/toast-provider";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { FormField } from "@/components/forms/form-field";
import { PermissionMatrix } from "@/features/roles/permission-matrix";
import { LoadingState } from "@/components/status/loading-state";
import type { ApiError } from "@/types";

export default function EditRolePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const context = useRequestContext();
  const confirm = useConfirm();
  const toast = useToast();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { data: role, isLoading } = useQuery({
    queryKey: ["role", id],
    queryFn: () => getRoleById(id, context),
  });

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RoleFormValues>({
    resolver: zodResolver(roleFormSchema),
    values: role
      ? {
          name: role.name,
          description: role.description,
          permissionIds: role.permissionIds.filter((p) => p !== "*"),
        }
      : undefined,
  });

  const onSubmit = async (values: RoleFormValues) => {
    const approved = await confirm({
      title: "Save permission changes?",
      description: "All users with this role will immediately receive the updated permissions.",
      confirmLabel: "Save changes",
      variant: "warning",
      details: `${values.name}\n${values.permissionIds.length} permissions`,
    });
    if (!approved) return;

    setSubmitError(null);
    try {
      await updateRole(context, id, values);
      await queryClient.invalidateQueries({ queryKey: ["roles", context.tenantId] });
      await queryClient.invalidateQueries({ queryKey: ["role", id] });
      toast.success("Role updated", values.name);
      router.push(`/roles/${id}`);
    } catch (err) {
      const apiErr = err as ApiError;
      const message = apiErr.message ?? "Failed to update role";
      setSubmitError(message);
      toast.error("Update failed", message);
    }
  };

  if (isLoading) return <LoadingState />;
  if (role?.isSystem) {
    router.replace(`/roles/${id}`);
    return null;
  }

  return (
    <div>
      <PageHeader title={`Edit ${role?.name}`} />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-[24px]">
        {submitError && (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 px-[12px] py-[8px] text-sm text-destructive">
            {submitError}
          </p>
        )}
        <Card className="max-w-xl">
          <CardContent className="pt-[24px] space-y-[16px]">
            <FormField label="Role name" error={errors.name?.message} required>
              <Input {...register("name")} />
            </FormField>
            <FormField label="Description">
              <Textarea {...register("description")} />
            </FormField>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-[24px]">
            {errors.permissionIds && (
              <p className="text-sm text-destructive mb-[8px]">{errors.permissionIds.message}</p>
            )}
            <Controller
              control={control}
              name="permissionIds"
              render={({ field }) => (
                <PermissionMatrix selectedIds={field.value} onChange={field.onChange} />
              )}
            />
          </CardContent>
        </Card>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save changes"}
        </Button>
      </form>
    </div>
  );
}
