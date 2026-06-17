"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { changePassword } from "@/lib/api/auth";
import { useAuthStore } from "@/features/auth/store";
import { changePasswordSchema, type ChangePasswordFormValues } from "@/lib/validation/auth";
import { useTranslations } from "@/hooks/use-translations";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { FormField } from "@/components/forms/form-field";

export default function ChangePasswordPage() {
  const router = useRouter();
  const { t } = useTranslations();
  const { setMustChangePassword } = useAuthStore();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
  });

  const onSubmit = async (values: ChangePasswordFormValues) => {
    setError(null);
    try {
      await changePassword(values.currentPassword, values.newPassword);
      setMustChangePassword(false);
      router.push("/dashboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : t("auth.changePassword.fail"));
    }
  };

  return (
    <div className="max-w-xl">
      <PageHeader
        title={t("auth.changePassword.title")}
        description={t("auth.changePassword.description")}
      />
      <Card>
        <CardContent className="pt-[24px]">
          {error && (
            <p className="mb-[16px] rounded-md border border-destructive/30 bg-destructive/10 px-[12px] py-[8px] text-sm text-destructive">
              {error}
            </p>
          )}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-[16px]">
            <FormField
              label={t("auth.changePassword.current")}
              error={errors.currentPassword?.message}
              required
            >
              <Input type="password" autoComplete="current-password" {...register("currentPassword")} />
            </FormField>
            <FormField
              label={t("auth.changePassword.new")}
              error={errors.newPassword?.message}
              required
              hint={t("auth.changePassword.newHint")}
            >
              <Input type="password" autoComplete="new-password" {...register("newPassword")} />
            </FormField>
            <FormField
              label={t("auth.changePassword.confirm")}
              error={errors.confirmPassword?.message}
              required
            >
              <Input type="password" autoComplete="new-password" {...register("confirmPassword")} />
            </FormField>
            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
              {isSubmitting ? t("auth.changePassword.submitting") : t("auth.changePassword.submit")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
