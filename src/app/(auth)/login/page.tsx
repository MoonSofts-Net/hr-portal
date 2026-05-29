"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PlatformIcons } from "@/components/icons";
import { login } from "@/lib/api/auth";
import { useAuthStore } from "@/features/auth/store";
import { loginSchema, type LoginFormValues } from "@/lib/validation/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/forms/form-field";
import { LoadingState } from "@/components/status/loading-state";

const DEMO_ACCOUNTS = [
  { email: "admin@portalrh.com", password: "admin123", role: "Super Admin", color: "border-violet-500/30 bg-violet-500/5" },
  { email: "rh@moonsofts.com", password: "rh123", role: "HR", color: "border-primary/30 bg-primary/5" },
  { email: "gestor@moonsofts.com", password: "gestor123", role: "Manager", color: "border-emerald-500/30 bg-emerald-500/5" },
  { email: "colaborador@moonsofts.com", password: "colab123", role: "Employee", color: "border-amber-500/30 bg-amber-500/5" },
];

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuth, session, isHydrated } = useAuthStore();
  const [error, setError] = useState<string | null>(null);

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
      setAuth(result.session, result.user, result.tenantName);
      const redirect = searchParams.get("redirect") || "/dashboard";
      router.push(redirect);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login failed");
    }
  };

  if (!isHydrated) return <LoadingState />;

  return (
    <div className="w-full max-w-[440px] space-y-[24px] animate-fade-in">
      <Card variant="elevated" className="border-border/60 overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-primary via-primary/80 to-primary/40" />
        <CardHeader className="pb-[8px]">
          <CardTitle className="text-xl">Welcome back</CardTitle>
          <CardDescription>Sign in with your corporate email or CPF</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-[18px]">
            <FormField label="Email or CPF" error={errors.identifier?.message} required>
              <div className="relative">
                <PlatformIcons.mail className="absolute left-[12px] top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-[40px]"
                  placeholder="email@company.com"
                  autoComplete="username"
                  {...register("identifier")}
                />
              </div>
            </FormField>
            <FormField label="Password" error={errors.password?.message} required>
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
            <Button type="submit" className="w-full h-11" disabled={isSubmitting}>
              {isSubmitting ? "Signing in..." : "Sign in to Portal RH"}
            </Button>
            <p className="text-center text-sm">
              <Link
                href="/forgot-password"
                className="font-medium text-primary hover:text-primary/80 transition-colors"
              >
                Forgot your password?
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>

      <Card variant="outline" className="bg-card/80">
        <CardHeader className="pb-[8px]">
          <CardTitle className="text-sm font-semibold">Quick demo access</CardTitle>
          <CardDescription className="text-xs">Click a role to fill credentials</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-[8px]">
          {DEMO_ACCOUNTS.map((acc) => (
            <button
              key={acc.email}
              type="button"
              className={`text-left rounded-lg border p-[12px] transition-all hover:shadow-soft hover:-translate-y-0.5 ${acc.color}`}
              onClick={() => {
                setValue("identifier", acc.email);
                setValue("password", acc.password);
              }}
            >
              <span className="text-xs font-bold uppercase tracking-wide">{acc.role}</span>
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

export default function LoginPage() {
  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-[52%] auth-gradient-panel auth-grid-pattern relative flex-col justify-between p-[48px] text-[white]">
        <div>
          <div className="flex items-center gap-[14px]">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[white]/10 backdrop-blur border border-[white]/20">
              <PlatformIcons.shield className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Portal RH</h1>
              <p className="text-sm text-[white]/70">Enterprise HR Platform</p>
            </div>
          </div>
          <p className="mt-[48px] text-3xl font-bold leading-tight max-w-md">
            Centralize HR operations with confidence and compliance.
          </p>
          <p className="mt-[16px] text-[white]/75 max-w-md leading-relaxed">
            Onboarding, documents, time mirror, requests, and audit — built for
            modern teams and LGPD-ready workflows.
          </p>
        </div>
        <ul className="space-y-[16px]">
          {[
            { icon: PlatformIcons.users, text: "Onboarding & employee lifecycle" },
            { icon: PlatformIcons.fileCheck, text: "Secure document management" },
            { icon: PlatformIcons.briefcase, text: "HR requests & communication" },
          ].map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-[14px] text-sm text-[white]/90">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[white]/10">
                <Icon className="h-[18px] w-[18px]" />
              </span>
              {text}
            </li>
          ))}
        </ul>
        <p className="text-xs text-[white]/50">© Portal RH · Secure workforce management</p>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center p-[24px] portal-shell-bg">
        <div className="lg:hidden text-center mb-[32px]">
          <Link href="/" className="inline-block">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-glow mb-[16px]">
              <PlatformIcons.shield className="h-7 w-7 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-gradient-primary">Portal RH</h1>
            <p className="text-muted-foreground text-sm mt-[6px]">Corporate HR self-service</p>
          </Link>
        </div>
        <Suspense fallback={<LoadingState />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
