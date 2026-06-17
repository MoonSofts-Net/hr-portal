"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PlatformIcons } from "@/components/icons";
import { BrandLogo } from "@/components/brand/brand-logo";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { login } from "@/lib/api/auth";
import { useAuthStore } from "@/features/auth/store";
import { loginSchema, type LoginFormValues } from "@/lib/validation/auth";
import { BRAND } from "@/lib/landing/content";
import { useTranslations } from "@/hooks/use-translations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/forms/form-field";
import { LoadingState } from "@/components/status/loading-state";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuth, session, isHydrated } = useAuthStore();
  const { t } = useTranslations();
  const [error, setError] = useState<string | null>(null);

  const demoAccounts = [
    { email: "admin@portalrh.com", password: "admin123", roleKey: "superAdmin", color: "border-violet-500/30 bg-violet-500/5" },
    { email: "rh@moonsofts.com", password: "rh123", roleKey: "hr", color: "border-[hsl(var(--brand-red)/0.3)] bg-[hsl(var(--brand-red)/0.05)]" },
    { email: "gestor@moonsofts.com", password: "gestor123", roleKey: "manager", color: "border-emerald-500/30 bg-emerald-500/5" },
    { email: "colaborador@moonsofts.com", password: "colab123", roleKey: "employee", color: "border-[hsl(var(--brand-yellow)/0.5)] bg-[hsl(var(--brand-yellow)/0.12)]" },
  ] as const;

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    if (isHydrated && session) {
      router.replace("/dashboard");
    }
  }, [isHydrated, session, router]);

  const onSubmit = async (data: LoginFormValues) => {
    setError(null);
    try {
      const result = await login(data);
      setAuth(result.session, result.user, result.tenantName, result.requiresPasswordChange);
      if (result.requiresPasswordChange) {
        router.push("/change-password");
        return;
      }
      const redirect = searchParams.get("redirect") || "/dashboard";
      router.push(redirect);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("auth.login.fail"));
    }
  };

  if (!isHydrated) return <LoadingState />;

  return (
    <div className="w-full max-w-[440px] space-y-[24px] animate-fade-in">
      <Card variant="elevated" className="border-border/60 overflow-hidden">
        <div className="h-[4px] coral-top-bar" />
        <CardHeader className="pb-[8px]">
          <CardTitle className="text-xl text-[hsl(var(--brand-navy))]">{t("auth.login.welcome")}</CardTitle>
          <CardDescription>{t("auth.login.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-[18px]">
            <FormField label={t("auth.login.emailOrCpf")} error={errors.identifier?.message} required>
              <div className="relative">
                <PlatformIcons.mail className="absolute left-[12px] top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-[40px]"
                  placeholder="email@armazemcoral.com.br"
                  autoComplete="username"
                  {...register("identifier")}
                />
              </div>
            </FormField>
            <FormField label={t("auth.login.password")} error={errors.password?.message} required>
              <div className="relative">
                <PlatformIcons.lock className="absolute left-[12px] top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-[40px]"
                  type="password"
                  autoComplete="current-password"
                  {...register("password")}
                />
              </div>
            </FormField>
            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-[12px] py-[10px] text-sm text-destructive">
                {error}
              </div>
            )}
            <Button type="submit" className="w-full h-11 bg-[hsl(var(--brand-red))] hover:bg-[hsl(var(--brand-red)/0.9)]" disabled={isSubmitting}>
              {isSubmitting ? t("auth.login.submitting") : t("auth.login.submit")}
            </Button>
            <p className="text-center text-sm">
              <Link
                href="/forgot-password"
                className="font-medium text-[hsl(var(--brand-red))] hover:text-[hsl(var(--brand-red)/0.8)] transition-colors"
              >
                {t("auth.login.forgotPassword")}
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>

      <Card variant="outline" className="bg-card/80">
        <CardHeader className="pb-[8px]">
          <CardTitle className="text-sm font-semibold">{t("auth.login.demoTitle")}</CardTitle>
          <CardDescription className="text-xs">{t("auth.login.demoHint")}</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-[8px]">
          {demoAccounts.map((acc) => (
            <button
              key={acc.email}
              type="button"
              className={`text-left rounded-lg border p-[12px] transition-all hover:shadow-soft hover:-translate-y-0.5 ${acc.color}`}
              onClick={() => {
                setValue("identifier", acc.email);
                setValue("password", acc.password);
              }}
            >
              <span className="text-xs font-bold uppercase tracking-wide">
                {t(`auth.roles.${acc.roleKey}`)}
              </span>
              <span className="text-[11px] text-muted-foreground block mt-[4px] truncate">
                {acc.email}
              </span>
            </button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function LoginBrandPanel() {
  const { t, messages } = useTranslations();
  const features = messages.auth.login.features;

  return (
    <div className="hidden lg:flex lg:w-[52%] relative flex-col justify-between p-[48px] overflow-hidden">
      <div className="absolute inset-0 auth-gradient-panel" />
      <div className="absolute inset-0 auth-grid-pattern opacity-50 pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.15),rgba(0,0,0,0.35))] pointer-events-none" />

      <div className="relative z-[1] flex items-start justify-between gap-[16px]">
        <BrandLogo size="md" theme="dark" subtitle={t("brand.portalSubtitle")} />
        <LanguageSwitcher />
      </div>

      <div className="relative z-[1] mt-[48px]">
        <h2 className="text-3xl font-bold leading-tight max-w-md text-[white]">
          {t("auth.login.panelTitle")}
        </h2>
        <p className="mt-[16px] max-w-md leading-relaxed text-[white]/90">
          {t("auth.login.panelDescription", { brand: BRAND.name })}
        </p>
      </div>

      <ul className="relative z-[1] space-y-[16px]">
        {features.map((text, index) => {
          const icons = [PlatformIcons.users, PlatformIcons.fileCheck, PlatformIcons.briefcase];
          const Icon = icons[index] ?? PlatformIcons.users;
          return (
            <li key={text} className="flex items-center gap-[14px] text-sm text-[white]">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[white]/15 border border-[white]/20">
                <Icon className="h-[18px] w-[18px] text-[white]" />
              </span>
              {text}
            </li>
          );
        })}
      </ul>

      <p className="relative z-[1] text-xs text-[white]/70">
        © {BRAND.name} · {t("brand.segment")}
      </p>
    </div>
  );
}

export default function LoginPage() {
  const { t } = useTranslations();

  return (
    <div className="min-h-screen flex">
      <LoginBrandPanel />

      <div className="flex flex-1 flex-col items-center justify-center p-[24px] portal-shell-bg">
        <div className="lg:hidden w-full max-w-[440px] flex items-center justify-between mb-[24px]">
          <Link href="/">
            <BrandLogo size="md" subtitle={t("brand.portalSubtitle")} />
          </Link>
          <LanguageSwitcher />
        </div>
        <Suspense fallback={<LoadingState />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
