"use client";

import { useParams, useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { getRoleById } from "@/lib/api/roles";
import { roleFormSchema, type RoleFormValues } from "@/lib/validation/role";
import { useRequestContext } from "@/features/auth/store";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { FormField } from "@/components/forms/form-field";
import { PermissionMatrix } from "@/features/roles/permission-matrix";
import { LoadingState } from "@/components/status/loading-state";

export default function EditRolePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const context = useRequestContext();

  const { data: role, isLoading } = useQuery({
    queryKey: ["role", id],
    queryFn: () => getRoleById(id, context),
  });

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RoleFormValues>({
    resolver: zodResolver(roleFormSchema),
    values: role
      ? {
          name: role.name,
          description: role.description,
          permissionIds: role.permissionIds.filter((p) => p !== "*"),
        }
      : undefined,
  });

  const onSubmit = async () => {
    await new Promise((r) => setTimeout(r, 500));
    router.push(`/roles/${id}`);
  };

  if (isLoading) return <LoadingState />;
  if (role?.isSystem) {
    router.replace(`/roles/${id}`);
    return null;
  }

  return (
    <div>
      <PageHeader title={`Edit ${role?.name}`} />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-[24px]">
        <Card className="max-w-xl">
          <CardContent className="pt-[24px] space-y-[16px]">
            <FormField label="Role name" error={errors.name?.message} required>
              <Input {...register("name")} />
            </FormField>
            <FormField label="Description">
              <Textarea {...register("description")} />
            </FormField>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-[24px]">
            <Controller
              control={control}
              name="permissionIds"
              render={({ field }) => (
                <PermissionMatrix selectedIds={field.value} onChange={field.onChange} />
              )}
            />
          </CardContent>
        </Card>
        <Button type="submit" disabled={isSubmitting}>
          Save changes
        </Button>
      </form>
    </div>
  );
}
