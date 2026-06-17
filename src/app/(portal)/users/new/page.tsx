"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createUserFormSchema, type CreateUserFormValues } from "@/lib/validation/user";
import { createUser, getRolesForTenant } from "@/lib/api/users";
import { getBranches } from "@/lib/api/branches";
import { useRequestContext } from "@/features/auth/store";
import { useConfirm } from "@/components/feedback/confirm-provider";
import { useToast } from "@/components/feedback/toast-provider";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { FormField } from "@/components/forms/form-field";
import { useTranslations } from "@/hooks/use-translations";
import type { ApiError } from "@/types";

export default function NewUserPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const context = useRequestContext();
  const confirm = useConfirm();
  const toast = useToast();
  const { t } = useTranslations();
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

  const {
    data: branchesData,
    isLoading: branchesLoading,
    isError: branchesError,
    error: branchesQueryError,
  } = useQuery({
    queryKey: ["branches-select", context.tenantId],
    queryFn: () => getBranches(context, { activeOnly: true, pageSize: 100 }),
    enabled: Boolean(context.tenantId),
  });

  const branches = branchesData?.data ?? [];
  const assignableRoles = roles.filter((r) => !r.isSystem);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserFormSchema),
    defaultValues: { status: "active" },
  });

  const onSubmit = async (values: CreateUserFormValues) => {
    const approved = await confirm({
      title: t("users.createConfirmTitle"),
      description: t("users.createConfirmDescription"),
      confirmLabel: t("users.createConfirmLabel"),
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
        branchId: values.branchId,
        department: values.department,
        status: values.status,
      });
      await queryClient.invalidateQueries({ queryKey: ["users", context.tenantId] });
      toast.success(t("users.created"), values.name);
      router.push(`/users/${user.id}`);
    } catch (err) {
      const apiErr = err as ApiError;
      const message = apiErr.message ?? t("users.createFailed");
      setSubmitError(message);
      toast.error(t("users.createFailed"), message);
    }
  };

  return (
    <div>
      <PageHeader title={t("users.createTitle")} description={t("users.createDescription")} />
      <Card className="max-w-xl">
        <CardContent className="pt-[24px]">
          {submitError && (
            <p className="mb-[16px] rounded-md border border-destructive/30 bg-destructive/10 px-[12px] py-[8px] text-sm text-destructive">
              {submitError}
            </p>
          )}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-[16px]">
            <FormField label={t("users.fullName")} error={errors.name?.message} required>
              <Input {...register("name")} />
            </FormField>
            <FormField label={t("users.email")} error={errors.email?.message} required>
              <Input type="email" {...register("email")} />
            </FormField>
            <FormField label={t("users.cpf")} error={errors.cpf?.message} required hint={t("users.cpfHint")}>
              <Input {...register("cpf")} inputMode="numeric" placeholder="52998227253" />
            </FormField>
            <p className="text-sm text-muted-foreground rounded-md border border-border/60 bg-muted/30 px-[12px] py-[10px]">
              {t("users.defaultPasswordHint")}
            </p>
            <FormField label={t("users.role")} error={errors.roleId?.message} required>
              {rolesError && (
                <p className="mb-[8px] text-sm text-destructive">
                  {(rolesQueryError as ApiError)?.message ?? t("users.noRoles")}
                </p>
              )}
              {!rolesLoading && !rolesError && assignableRoles.length === 0 && (
                <p className="mb-[8px] text-sm text-muted-foreground">{t("users.noRoles")}</p>
              )}
              <Select {...register("roleId")} disabled={rolesLoading || rolesError}>
                <option value="">{t("users.selectRole")}</option>
                {assignableRoles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label={t("users.branch")} error={errors.branchId?.message} required>
              {branchesError && (
                <p className="mb-[8px] text-sm text-destructive">
                  {(branchesQueryError as ApiError)?.message ?? t("users.noBranches")}
                </p>
              )}
              {!branchesLoading && !branchesError && branches.length === 0 && (
                <p className="mb-[8px] text-sm text-muted-foreground">
                  {t("users.noBranches")}{" "}
                  <a href="/admin/branches/new" className="underline">
                    {t("users.createBranchLink")}
                  </a>
                </p>
              )}
              <Select {...register("branchId")} disabled={branchesLoading || branchesError}>
                <option value="">{t("users.selectBranch")}</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.code} — {b.name}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label={t("users.department")} error={errors.department?.message}>
              <Input {...register("department")} />
            </FormField>
            <FormField label={t("users.status")} error={errors.status?.message} required>
              <Select {...register("status")}>
                <option value="active">{t("users.statusActive")}</option>
                <option value="inactive">{t("users.statusInactive")}</option>
              </Select>
            </FormField>
            <div className="flex gap-[8px]">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? t("users.saving") : t("users.save")}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                {t("users.cancel")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
