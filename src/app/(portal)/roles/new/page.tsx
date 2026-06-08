"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { createRole } from "@/lib/api/roles";
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
import type { ApiError } from "@/types";

export default function NewRolePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const context = useRequestContext();
  const confirm = useConfirm();
  const toast = useToast();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RoleFormValues>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: { permissionIds: [] },
  });

  const onSubmit = async (values: RoleFormValues) => {
    const approved = await confirm({
      title: "Create role?",
      description: "Users assigned to this role will receive the selected permissions.",
      confirmLabel: "Create role",
      variant: "success",
      details: `${values.name}\n${values.permissionIds.length} permissions selected`,
    });
    if (!approved) return;

    setSubmitError(null);
    try {
      const role = await createRole(context, values);
      await queryClient.invalidateQueries({ queryKey: ["roles", context.tenantId] });
      toast.success("Role created", values.name);
      router.push(`/roles/${role.id}`);
    } catch (err) {
      const apiErr = err as ApiError;
      const message = apiErr.message ?? "Failed to create role";
      setSubmitError(message);
      toast.error("Creation failed", message);
    }
  };

  return (
    <div>
      <PageHeader title="Create role" description="Define a new configurable role" />
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
            <FormField label="Description" error={errors.description?.message}>
              <Textarea {...register("description")} />
            </FormField>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-[24px]">
            <h3 className="font-medium mb-[16px]">Permission matrix</h3>
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
        <div className="flex gap-[8px]">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save role"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
