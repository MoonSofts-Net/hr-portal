"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { FormField } from "@/components/forms/form-field";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.enum(["personal", "contracts", "payslips", "internal", "other"]),
});

type FormValues = z.infer<typeof schema>;

export default function UploadDocumentPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { category: "personal" },
  });

  const onSubmit = async () => {
    await new Promise((r) => setTimeout(r, 500));
    router.push("/documents");
  };

  return (
    <div>
      <PageHeader title="Upload document" description="Files are sent securely to the API (mock)" />
      <Card className="max-w-xl">
        <CardContent className="pt-[24px]">
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
            <FormField label="File" hint="PDF, JPG, PNG — mock upload only">
              <Input type="file" accept=".pdf,.jpg,.jpeg,.png" />
            </FormField>
            <Button type="submit" disabled={isSubmitting}>
              Upload
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
