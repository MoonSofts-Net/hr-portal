"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { createHRRequest } from "@/lib/api/communication";
import {
  HR_REQUEST_CATEGORIES,
  hrRequestSchema,
  type HRRequestFormValues,
} from "@/lib/validation/requests";
import { useAuthStore, useRequestContext } from "@/features/auth/store";
import { useConfirm } from "@/components/feedback/confirm-provider";
import { useToast } from "@/components/feedback/toast-provider";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { FormField } from "@/components/forms/form-field";
import { LoadingState } from "@/components/status/loading-state";
import type { ApiError } from "@/types";

function formatSubmitError(err: ApiError): string {
  if (err.statusCode === 403) {
    return "You do not have permission to create HR requests. Contact your administrator.";
  }
  return err.message ?? "Failed to create request";
}

export default function NewRequestPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const context = useRequestContext();
  const confirm = useConfirm();
  const toast = useToast();
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<HRRequestFormValues>({
    resolver: zodResolver(hrRequestSchema),
    defaultValues: { priority: "medium", category: "Benefits" },
  });

  const submitRequest = async (values: HRRequestFormValues) => {
    setSubmitError(null);
    try {
      const request = await createHRRequest(context, values);
      queryClient.setQueryData(["request", request.id, context.tenantId], request);
      await queryClient.invalidateQueries({ queryKey: ["requests"] });
      toast.success("Request submitted", "Your HR team will respond shortly.");
      router.push(`/requests/${request.id}`);
    } catch (err) {
      const message = formatSubmitError(err as ApiError);
      setSubmitError(message);
      toast.error("Could not submit request", message);
    }
  };

  const onSubmit = async (values: HRRequestFormValues) => {
    const approved = await confirm({
      title: "Submit HR request?",
      description: "Your message will be sent to the HR team. You can track replies on the request page.",
      confirmLabel: "Submit request",
      variant: "success",
      details: `Subject: ${values.subject}\nCategory: ${values.category}\nPriority: ${values.priority}`,
    });
    if (!approved) return;
    await submitRequest(values);
  };

  const onInvalid = (formErrors: FieldErrors<HRRequestFormValues>) => {
    const firstError =
      formErrors.subject?.message ??
      formErrors.category?.message ??
      formErrors.priority?.message ??
      formErrors.body?.message;
    if (firstError) setSubmitError(String(firstError));
  };

  if (!isHydrated || !context.tenantId) {
    return <LoadingState message="Loading workspace..." />;
  }

  return (
    <div>
      <PageHeader
        title="New HR request"
        description="Submit a question or request to the HR team"
      />
      <Card className="max-w-xl">
        <CardContent className="pt-[24px]">
          {submitError && (
            <p className="mb-[16px] rounded-md border border-destructive/30 bg-destructive/10 px-[12px] py-[8px] text-sm text-destructive">
              {submitError}
            </p>
          )}
          <form
            onSubmit={handleSubmit(onSubmit, onInvalid)}
            className="space-y-[16px]"
            noValidate
          >
            <FormField label="Subject" error={errors.subject?.message} required>
              <Input
                {...register("subject")}
                placeholder="Brief summary of your request"
              />
            </FormField>
            <FormField label="Category" error={errors.category?.message} required>
              <Select {...register("category")}>
                {HR_REQUEST_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Priority" error={errors.priority?.message} required>
              <Select {...register("priority")}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </Select>
            </FormField>
            <FormField
              label="Message"
              error={errors.body?.message}
              required
              hint="Include relevant details so HR can help you faster"
            >
              <Textarea
                rows={5}
                {...register("body")}
                placeholder="Describe your request..."
              />
            </FormField>
            <div className="flex gap-[8px]">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit request"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={async () => {
                  const values = getValues();
                  const hasContent =
                    values.subject?.trim() ||
                    values.body?.trim();
                  if (hasContent) {
                    const approved = await confirm({
                      title: "Discard changes?",
                      description: "Unsaved content will be lost.",
                      confirmLabel: "Discard",
                      variant: "warning",
                    });
                    if (!approved) return;
                  }
                  router.back();
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
