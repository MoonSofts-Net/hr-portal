"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PlatformIcons } from "@/components/icons";
import { BrandLogo } from "@/components/brand/brand-logo";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { requestPasswordReset } from "@/lib/api/auth";
import { forgotPasswordSchema, type ForgotPasswordFormValues } from "@/lib/validation/auth";
import { useTranslations } from "@/hooks/use-translations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/forms/form-field";

export default function ForgotPasswordPage() {
  const { t } = useTranslations();
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    await requestPasswordReset(data.email);
    setSent(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center portal-shell-bg p-[24px]">
      <div className="w-full max-w-md animate-fade-in">
        <div className="flex items-center justify-between mb-[28px]">
          <Link href="/" className="inline-flex flex-col">
            <BrandLogo size="sm" subtitle={t("brand.portalSubtitle")} />
          </Link>
          <LanguageSwitcher />
        </div>
        <h1 className="text-xl font-bold mb-[20px] text-[hsl(var(--brand-navy))]">{t("auth.forgot.title")}</h1>

        <Card variant="elevated">
          <div className="h-[4px] coral-top-bar rounded-t-xl" />
          <CardHeader>
            <CardTitle className="text-lg">{t("auth.forgot.cardTitle")}</CardTitle>
            <CardDescription>{t("auth.forgot.cardDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="space-y-[20px] text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[hsl(var(--success-bg))]">
                  <PlatformIcons.mail className="h-6 w-6 text-[hsl(var(--success))]" />
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{t("auth.forgot.success")}</p>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/login">
                    <PlatformIcons.arrowLeft className="h-4 w-4 mr-[8px]" />
                    {t("auth.forgot.backToLogin")}
                  </Link>
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-[16px]">
                <FormField label={t("auth.forgot.email")} error={errors.email?.message} required>
                  <div className="relative">
                    <PlatformIcons.mail className="absolute left-[12px] top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground" />
                    <Input className="pl-[40px]" type="email" {...register("email")} />
                  </div>
                </FormField>
                <Button type="submit" className="w-full bg-[hsl(var(--brand-red))] hover:bg-[hsl(var(--brand-red)/0.9)]" disabled={isSubmitting}>
                  {t("auth.forgot.submit")}
                </Button>
                <Button asChild variant="ghost" className="w-full">
                  <Link href="/login">
                    <PlatformIcons.arrowLeft className="h-4 w-4 mr-[8px]" />
                    {t("auth.forgot.backToLogin")}
                  </Link>
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
