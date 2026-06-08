"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createUserFormSchema, type CreateUserFormValues } from "@/lib/validation/user";
import { createUser, getRolesForTenant } from "@/lib/api/users";
import { useRequestContext } from "@/features/auth/store";
import { useConfirm } from "@/components/feedback/confirm-provider";
import { useToast } from "@/components/feedback/toast-provider";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { FormField } from "@/components/forms/form-field";
import type { ApiError } from "@/types";

export default function NewUserPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const context = useRequestContext();
  const confirm = useConfirm();
  const toast = useToast();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    data: roles = [],
    isLoading: rolesLoading,
    isError: rolesError,
    error: rolesQueryError,
  } = useQuery({
    queryKey: ["roles-select", context.tenantId],
    queryFn: () => getRolesForTenant(context),
    enabled: Boolean(context.tenantId),
  });

  const assignableRoles = roles.filter((r) => !r.isSystem);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserFormSchema),
    defaultValues: { status: "pending" },
  });

  const onSubmit = async (values: CreateUserFormValues) => {
    const approved = await confirm({
      title: "Create user?",
      description: "A new account will be created with the selected role and permissions.",
      confirmLabel: "Create user",
      variant: "success",
      details: `${values.name}\n${values.email}`,
    });
    if (!approved) return;

    setSubmitError(null);
    try {
      const user = await createUser(context, {
        name: values.name,
        email: values.email,
        cpf: values.cpf,
        roleId: values.roleId,
        password: values.password,
        department: values.department,
        status: values.status,
      });
      await queryClient.invalidateQueries({ queryKey: ["users", context.tenantId] });
      toast.success("User created", values.name);
      router.push(`/users/${user.id}`);
    } catch (err) {
      const apiErr = err as ApiError;
      const message = apiErr.message ?? "Failed to create user";
      setSubmitError(message);
      toast.error("Creation failed", message);
    }
  };

  return (
    <div>
      <PageHeader title="Create user" description="Add a new user to the tenant" />
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
            <FormField label="CPF" error={errors.cpf?.message} required hint="11 digits — formatting optional">
              <Input {...register("cpf")} inputMode="numeric" placeholder="52998227253 or 529.982.272-53" />
            </FormField>
            <FormField
              label="Initial password"
              error={errors.password?.message}
              required
              hint="Minimum 8 characters — user can change after first login"
            >
              <Input type="password" autoComplete="new-password" {...register("password")} />
            </FormField>
            <FormField label="Role" error={errors.roleId?.message} required>
              {rolesError && (
                <p className="mb-[8px] text-sm text-destructive">
                  {(rolesQueryError as ApiError)?.message ??
                    "Could not load roles. Check your permissions and try again."}
                </p>
              )}
              {!rolesLoading && !rolesError && assignableRoles.length === 0 && (
                <p className="mb-[8px] text-sm text-muted-foreground">
                  No roles available for this tenant. Ask an administrator to configure roles.
                </p>
              )}
              <Select {...register("roleId")} disabled={rolesLoading || rolesError}>
                <option value="">Select role</option>
                {assignableRoles.map((r) => (
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
                <option value="pending">Pending (invited)</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Select>
            </FormField>
            <div className="flex gap-[8px]">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save user"}
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
