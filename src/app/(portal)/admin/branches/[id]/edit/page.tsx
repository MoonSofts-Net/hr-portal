"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { branchFormSchema, type BranchFormValues } from "@/lib/validation/branch";
import { getBranchById, updateBranch } from "@/lib/api/branches";
import { useRequestContext } from "@/features/auth/store";
import { useConfirm } from "@/components/feedback/confirm-provider";
import { useToast } from "@/components/feedback/toast-provider";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { FormField } from "@/components/forms/form-field";
import { LoadingState } from "@/components/status/loading-state";
import type { ApiError } from "@/types";

export default function EditBranchPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const context = useRequestContext();
  const confirm = useConfirm();
  const toast = useToast();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { data: branch, isLoading } = useQuery({
    queryKey: ["branch", id, context.tenantId],
    queryFn: () => getBranchById(id, context),
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<BranchFormValues>({
    resolver: zodResolver(branchFormSchema),
    values: branch
      ? {
          code: branch.code,
          name: branch.name,
          legalName: branch.legalName ?? "",
          taxId: branch.taxId ?? "",
          address: branch.address ?? "",
          city: branch.city ?? "",
          state: branch.state ?? "",
          isContracted: branch.isContracted,
          isActive: branch.isActive,
        }
      : undefined,
  });

  const onSubmit = async (values: BranchFormValues) => {
    const isDeactivating = branch?.isActive && !values.isActive;
    const approved = await confirm({
      title: isDeactivating ? "Deactivate branch?" : "Save changes?",
      description: isDeactivating
        ? "Inactive branches cannot receive new employee assignments."
        : "Branch details will be updated.",
      confirmLabel: isDeactivating ? "Deactivate" : "Save changes",
      variant: isDeactivating ? "destructive" : "default",
      details: `${values.code} — ${values.name}`,
    });
    if (!approved) return;

    setSubmitError(null);
    try {
      await updateBranch(context, id, values);
      await queryClient.invalidateQueries({ queryKey: ["branches", context.tenantId] });
      await queryClient.invalidateQueries({ queryKey: ["branch", id, context.tenantId] });
      toast.success(isDeactivating ? "Branch deactivated" : "Branch updated", values.name);
      router.push("/admin/branches");
    } catch (err) {
      const apiErr = err as ApiError;
      const message = apiErr.message ?? "Failed to update branch";
      setSubmitError(message);
      toast.error("Update failed", message);
    }
  };

  if (isLoading) return <LoadingState />;
  if (!branch) return <p>Branch not found</p>;

  return (
    <div>
      <PageHeader
        title={`Edit branch — ${branch.name}`}
        description={`${branch.userCount ?? 0} employees linked`}
      />
      <Card className="max-w-xl">
        <CardContent className="pt-[24px]">
          {submitError && (
            <p className="mb-[16px] rounded-md border border-destructive/30 bg-destructive/10 px-[12px] py-[8px] text-sm text-destructive">
              {submitError}
            </p>
          )}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-[16px]">
            <FormField label="Code" error={errors.code?.message} required>
              <Input {...register("code")} />
            </FormField>
            <FormField label="Name" error={errors.name?.message} required>
              <Input {...register("name")} />
            </FormField>
            <FormField label="Legal name" error={errors.legalName?.message}>
              <Input {...register("legalName")} />
            </FormField>
            <FormField label="CNPJ" error={errors.taxId?.message}>
              <Input {...register("taxId")} />
            </FormField>
            <FormField label="Address" error={errors.address?.message}>
              <Input {...register("address")} />
            </FormField>
            <div className="grid grid-cols-2 gap-[12px]">
              <FormField label="City" error={errors.city?.message}>
                <Input {...register("city")} />
              </FormField>
              <FormField label="State" error={errors.state?.message}>
                <Input {...register("state")} maxLength={2} />
              </FormField>
            </div>
            <FormField label="Contract status">
              <label className="flex items-center gap-[8px] text-sm">
                <input type="checkbox" {...register("isContracted")} className="rounded" />
                Company has an active contract with this branch
              </label>
            </FormField>
            <FormField label="Operational status">
              <label className="flex items-center gap-[8px] text-sm">
                <input type="checkbox" {...register("isActive")} className="rounded" />
                Branch is active and can receive employees
              </label>
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
