"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BrandLogo } from "@/components/brand/brand-logo";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { resetPassword } from "@/lib/api/auth";
import { resetPasswordSchema, type ResetPasswordFormValues } from "@/lib/validation/auth";
import { useTranslations } from "@/hooks/use-translations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/forms/form-field";
import { LoadingState } from "@/components/status/loading-state";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslations();
  const token = searchParams.get("token");
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
  });

  if (!token) {
    return (
      <p className="text-sm text-destructive text-center">{t("auth.resetPassword.invalidToken")}</p>
    );
  }

  const onSubmit = async (values: ResetPasswordFormValues) => {
    setError(null);
    try {
      await resetPassword(token, values.newPassword);
      router.push("/login?reset=success");
    } catch (e) {
      setError(e instanceof Error ? e.message : t("auth.resetPassword.fail"));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-[16px]">
      <FormField label={t("auth.resetPassword.new")} error={errors.newPassword?.message} required>
        <Input type="password" autoComplete="new-password" {...register("newPassword")} />
      </FormField>
      <FormField label={t("auth.resetPassword.confirm")} error={errors.confirmPassword?.message} required>
        <Input type="password" autoComplete="new-password" {...register("confirmPassword")} />
      </FormField>
      {error && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-[12px] py-[8px] text-sm text-destructive">
          {error}
        </p>
      )}
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? t("auth.resetPassword.submitting") : t("auth.resetPassword.submit")}
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  const { t } = useTranslations();

  return (
    <div className="min-h-screen flex items-center justify-center portal-shell-bg p-[24px]">
      <div className="w-full max-w-md animate-fade-in">
        <div className="flex items-center justify-between mb-[28px]">
          <Link href="/">
            <BrandLogo size="sm" subtitle={t("brand.portalSubtitle")} />
          </Link>
          <LanguageSwitcher />
        </div>
        <Card variant="elevated">
          <div className="h-[4px] coral-top-bar rounded-t-xl" />
          <CardHeader>
            <CardTitle className="text-lg">{t("auth.resetPassword.title")}</CardTitle>
            <CardDescription>{t("auth.resetPassword.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<LoadingState />}>
              <ResetPasswordForm />
            </Suspense>
            <Button asChild variant="ghost" className="w-full mt-[12px]">
              <Link href="/login">{t("auth.forgot.backToLogin")}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
