"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  pointAdjustmentSchema,
  type PointAdjustmentFormValues,
} from "@/lib/validation/requests";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { FormField } from "@/components/forms/form-field";

export default function NewPointAdjustmentPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PointAdjustmentFormValues>({
    resolver: zodResolver(pointAdjustmentSchema),
  });

  const onSubmit = async () => {
    await new Promise((r) => setTimeout(r, 500));
    router.push("/point/adjustments");
  };

  return (
    <div>
      <PageHeader
        title="Request point adjustment"
        description="Submit a correction request for HR/manager approval"
      />
      <Card className="max-w-xl">
        <CardContent className="pt-[24px]">
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
            <Button type="submit" disabled={isSubmitting}>
              Submit request
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
