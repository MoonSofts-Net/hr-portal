"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PlatformIcons } from "@/components/icons";
import { requestPasswordReset } from "@/lib/api/auth";
import { forgotPasswordSchema, type ForgotPasswordFormValues } from "@/lib/validation/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/forms/form-field";

export default function ForgotPasswordPage() {
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
        <div className="text-center mb-[28px]">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary shadow-glow mb-[14px]">
            <PlatformIcons.shield className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold">Reset password</h1>
        </div>

        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="text-lg">Recover access</CardTitle>
            <CardDescription>
              Enter your email. If an account exists, you will receive instructions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="space-y-[20px] text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[hsl(var(--success-bg))]">
                  <PlatformIcons.mail className="h-6 w-6 text-[hsl(var(--success))]" />
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  If the email is registered, a reset link will be sent. Check your inbox.
                </p>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/login">
                    <PlatformIcons.arrowLeft className="h-4 w-4 mr-[8px]" />
                    Back to login
                  </Link>
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-[16px]">
                <FormField label="Email" error={errors.email?.message} required>
                  <div className="relative">
                    <PlatformIcons.mail className="absolute left-[12px] top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground" />
                    <Input className="pl-[40px]" type="email" {...register("email")} />
                  </div>
                </FormField>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  Send reset link
                </Button>
                <Button asChild variant="ghost" className="w-full">
                  <Link href="/login">
                    <PlatformIcons.arrowLeft className="h-4 w-4 mr-[8px]" />
                    Back to login
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
