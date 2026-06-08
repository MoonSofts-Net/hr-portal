"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { uploadDocument } from "@/lib/api/documents";
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

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.enum(["personal", "contracts", "payslips", "internal", "other"]),
});

type FormValues = z.infer<typeof schema>;

export default function UploadDocumentPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const context = useRequestContext();
  const confirm = useConfirm();
  const toast = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { category: "personal" },
  });

  const onSubmit = async (values: FormValues) => {
    setSubmitError(null);
    setFileError(null);

    if (!file) {
      setFileError("Select a file to upload");
      return;
    }

    const approved = await confirm({
      title: "Upload document?",
      description: "The file will be stored securely and linked to your profile.",
      confirmLabel: "Upload",
      variant: "success",
      details: `${values.name}\n${file.name} (${Math.round(file.size / 1024)} KB)`,
    });
    if (!approved) return;

    try {
      await uploadDocument(context, {
        file,
        name: values.name,
        category: values.category,
      });
      await queryClient.invalidateQueries({ queryKey: ["documents", context.tenantId] });
      toast.success("Document uploaded", values.name);
      router.push("/documents");
    } catch (err) {
      const apiErr = err as ApiError;
      const message = apiErr.message ?? "Failed to upload document";
      setSubmitError(message);
      toast.error("Upload failed", message);
    }
  };

  return (
    <div>
      <PageHeader title="Upload document" description="Files are stored securely on the server" />
      <Card className="max-w-xl">
        <CardContent className="pt-[24px]">
          {submitError && (
            <p className="mb-[16px] rounded-md border border-destructive/30 bg-destructive/10 px-[12px] py-[8px] text-sm text-destructive">
              {submitError}
            </p>
          )}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-[16px]">
            <FormField label="Document name" error={errors.name?.message} required>
              <Input {...register("name")} />
            </FormField>
            <FormField label="Category" required>
              <Select {...register("category")}>
                <option value="personal">Personal</option>
                <option value="contracts">Contracts</option>
                <option value="payslips">Payslips</option>
                <option value="internal">Internal</option>
                <option value="other">Other</option>
              </Select>
            </FormField>
            <FormField
              label="File"
              error={fileError ?? undefined}
              required
              hint="PDF, JPG, or PNG — max 10 MB"
            >
              <Input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                onChange={(event) => {
                  setFile(event.target.files?.[0] ?? null);
                  setFileError(null);
                }}
              />
            </FormField>
            <div className="flex gap-[8px]">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Uploading..." : "Upload"}
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
