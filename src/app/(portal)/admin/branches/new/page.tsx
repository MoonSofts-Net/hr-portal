"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { branchFormSchema, type BranchFormValues } from "@/lib/validation/branch";
import { createBranch } from "@/lib/api/branches";
import { useRequestContext } from "@/features/auth/store";
import { useConfirm } from "@/components/feedback/confirm-provider";
import { useToast } from "@/components/feedback/toast-provider";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { FormField } from "@/components/forms/form-field";
import type { ApiError } from "@/types";

export default function NewBranchPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const context = useRequestContext();
  const confirm = useConfirm();
  const toast = useToast();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<BranchFormValues>({
    resolver: zodResolver(branchFormSchema),
    defaultValues: { isContracted: true, isActive: true },
  });

  const onSubmit = async (values: BranchFormValues) => {
    const approved = await confirm({
      title: "Create branch?",
      description: "A new branch will be added to this company.",
      confirmLabel: "Create branch",
      variant: "success",
      details: `${values.code} — ${values.name}`,
    });
    if (!approved) return;

    setSubmitError(null);
    try {
      const branch = await createBranch(context, values);
      await queryClient.invalidateQueries({ queryKey: ["branches", context.tenantId] });
      toast.success("Branch created", branch.name);
      router.push("/admin/branches");
    } catch (err) {
      const apiErr = err as ApiError;
      const message = apiErr.message ?? "Failed to create branch";
      setSubmitError(message);
      toast.error("Creation failed", message);
    }
  };

  return (
    <div>
      <PageHeader title="New branch" description="Add a branch (filial) to the company" />
      <Card className="max-w-xl">
        <CardContent className="pt-[24px]">
          {submitError && (
            <p className="mb-[16px] rounded-md border border-destructive/30 bg-destructive/10 px-[12px] py-[8px] text-sm text-destructive">
              {submitError}
            </p>
          )}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-[16px]">
            <FormField label="Code" error={errors.code?.message} required hint="Unique within the company (e.g. LOJA-25)">
              <Input {...register("code")} placeholder="LOJA-25" />
            </FormField>
            <FormField label="Name" error={errors.name?.message} required>
              <Input {...register("name")} placeholder="Recife — Nova Filial" />
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
              <FormField label="State" error={errors.state?.message} hint="UF (e.g. PE)">
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
                {isSubmitting ? "Saving..." : "Save branch"}
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
