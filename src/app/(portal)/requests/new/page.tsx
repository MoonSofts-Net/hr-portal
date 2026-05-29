"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { hrRequestSchema, type HRRequestFormValues } from "@/lib/validation/requests";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { FormField } from "@/components/forms/form-field";

export default function NewRequestPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<HRRequestFormValues>({
    resolver: zodResolver(hrRequestSchema),
    defaultValues: { priority: "medium" },
  });

  const onSubmit = async () => {
    await new Promise((r) => setTimeout(r, 500));
    router.push("/requests");
  };

  return (
    <div>
      <PageHeader title="New HR request" />
      <Card className="max-w-xl">
        <CardContent className="pt-[24px]">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-[16px]">
            <FormField label="Subject" error={errors.subject?.message} required>
              <Input {...register("subject")} />
            </FormField>
            <FormField label="Category" error={errors.category?.message} required>
              <Input {...register("category")} placeholder="Benefits, Payroll, etc." />
            </FormField>
            <FormField label="Priority" required>
              <Select {...register("priority")}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </Select>
            </FormField>
            <FormField label="Message" error={errors.body?.message} required>
              <Textarea rows={5} {...register("body")} />
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
