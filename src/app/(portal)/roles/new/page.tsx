"use client";

import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { roleFormSchema, type RoleFormValues } from "@/lib/validation/role";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { FormField } from "@/components/forms/form-field";
import { PermissionMatrix } from "@/features/roles/permission-matrix";

export default function NewRolePage() {
  const router = useRouter();
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RoleFormValues>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: { permissionIds: [] },
  });

  const onSubmit = async () => {
    await new Promise((r) => setTimeout(r, 500));
    router.push("/roles");
  };

  return (
    <div>
      <PageHeader title="Create role" description="Define a new configurable role" />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-[24px]">
        <Card className="max-w-xl">
          <CardContent className="pt-[24px] space-y-[16px]">
            <FormField label="Role name" error={errors.name?.message} required>
              <Input {...register("name")} />
            </FormField>
            <FormField label="Description" error={errors.description?.message}>
              <Textarea {...register("description")} />
            </FormField>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-[24px]">
            <h3 className="font-medium mb-[16px]">Permission matrix</h3>
            {errors.permissionIds && (
              <p className="text-sm text-destructive mb-[8px]">{errors.permissionIds.message}</p>
            )}
            <Controller
              control={control}
              name="permissionIds"
              render={({ field }) => (
                <PermissionMatrix selectedIds={field.value} onChange={field.onChange} />
              )}
            />
          </CardContent>
        </Card>
        <div className="flex gap-[8px]">
          <Button type="submit" disabled={isSubmitting}>
            Save role
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
