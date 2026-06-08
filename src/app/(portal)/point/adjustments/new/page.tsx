"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { createPointAdjustment } from "@/lib/api/point";
import {
  pointAdjustmentSchema,
  type PointAdjustmentFormValues,
} from "@/lib/validation/requests";
import { useRequestContext } from "@/features/auth/store";
import { useConfirm } from "@/components/feedback/confirm-provider";
import { useToast } from "@/components/feedback/toast-provider";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { FormField } from "@/components/forms/form-field";
import type { ApiError } from "@/types";

export default function NewPointAdjustmentPage() {
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
  } = useForm<PointAdjustmentFormValues>({
    resolver: zodResolver(pointAdjustmentSchema),
  });

  const onSubmit = async (values: PointAdjustmentFormValues) => {
    const approved = await confirm({
      title: "Submit adjustment request?",
      description: "Your manager or HR will review this correction before it is applied.",
      confirmLabel: "Submit request",
      variant: "success",
      details: `Date: ${values.date}\n${values.requestedChanges}`,
    });
    if (!approved) return;

    setSubmitError(null);
    try {
      const adjustment = await createPointAdjustment(context, values);
      await queryClient.invalidateQueries({ queryKey: ["point-adjustments", context.tenantId] });
      toast.success("Request submitted", "You will be notified when it is reviewed.");
      router.push(`/point/adjustments/${adjustment.id}`);
    } catch (err) {
      const apiErr = err as ApiError;
      const message = apiErr.message ?? "Failed to submit adjustment request";
      setSubmitError(message);
      toast.error("Submission failed", message);
    }
  };

  return (
    <div>
      <PageHeader
        title="Request point adjustment"
        description="Submit a correction request for HR/manager approval"
      />
      <Card className="max-w-xl">
        <CardContent className="pt-[24px]">
          {submitError && (
            <p className="mb-[16px] rounded-md border border-destructive/30 bg-destructive/10 px-[12px] py-[8px] text-sm text-destructive">
              {submitError}
            </p>
          )}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-[16px]">
            <FormField label="Date" error={errors.date?.message} required>
              <Input type="date" {...register("date")} />
            </FormField>
            <FormField label="Reason" error={errors.reason?.message} required>
              <Textarea rows={3} {...register("reason")} />
            </FormField>
            <FormField
              label="Requested changes"
              error={errors.requestedChanges?.message}
              required
              hint="Describe entries to add or correct"
            >
              <Textarea rows={3} {...register("requestedChanges")} />
            </FormField>
            <div className="flex gap-[8px]">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit request"}
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
