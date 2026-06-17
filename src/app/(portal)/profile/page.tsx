"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { getMyProfile, updateMyProfile, uploadAvatar } from "@/lib/api/profile";
import { useRequestContext } from "@/features/auth/store";
import { useTranslations } from "@/hooks/use-translations";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/forms/form-field";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LoadingState } from "@/components/status/loading-state";
import { ErrorState } from "@/components/status/error-state";
import { StatusBadge } from "@/components/status/status-badge";
import { formatDate } from "@/lib/utils";

const profileSchema = z.object({
  name: z.string().min(2),
  phone: z.string().optional(),
  address: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const context = useRequestContext();
  const queryClient = useQueryClient();
  const { t } = useTranslations();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const { data: profile, isLoading, error, refetch } = useQuery({
    queryKey: ["profile", context.userId],
    queryFn: () => getMyProfile(context),
    enabled: Boolean(context.userId),
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    values: profile
      ? { name: profile.name, phone: profile.phone ?? "", address: profile.address ?? "" }
      : undefined,
  });

  const saveMutation = useMutation({
    mutationFn: (values: ProfileFormValues) =>
      updateMyProfile(context, {
        name: values.name,
        phone: values.phone || undefined,
        address: values.address || undefined,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["profile", context.userId] }),
  });

  const onAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await uploadAvatar(context, file);
      await queryClient.invalidateQueries({ queryKey: ["profile", context.userId] });
    } finally {
      setUploading(false);
    }
  };

  const initials = profile?.name
    ?.split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (isLoading) return <LoadingState />;
  if (error || !profile) {
    return <ErrorState message={t("profile.loadError")} onRetry={() => refetch()} />;
  }

  return (
    <div className="space-y-[24px]">
      <PageHeader title={t("profile.title")} description={t("profile.description")} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-[20px]">
        <Card className="lg:col-span-1">
          <CardContent className="pt-[24px] flex flex-col items-center text-center gap-[16px]">
            <Avatar className="h-24 w-24 ring-4 ring-primary/10">
              {profile.avatarUrl ? <AvatarImage src={profile.avatarUrl} alt={profile.name} /> : null}
              <AvatarFallback className="text-lg font-bold">{initials}</AvatarFallback>
            </Avatar>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onAvatarChange} />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
            >
              {uploading ? t("profile.uploadingPhoto") : t("profile.changePhoto")}
            </Button>
            <div>
              <p className="font-semibold text-lg">{profile.name}</p>
              <p className="text-sm text-muted-foreground">{profile.email}</p>
              {profile.branch && (
                <p className="text-xs text-muted-foreground mt-[4px]">
                  {profile.branch.code} — {profile.branch.name}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t("profile.personalInfo")}</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleSubmit((values) => saveMutation.mutate(values))}
              className="space-y-[16px]"
            >
              <FormField label={t("profile.fullName")} error={errors.name?.message} required>
                <Input {...register("name")} />
              </FormField>
              <FormField label={t("profile.phone")} error={errors.phone?.message}>
                <Input {...register("phone")} />
              </FormField>
              <FormField label={t("profile.address")} error={errors.address?.message}>
                <Input {...register("address")} />
              </FormField>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-[12px] text-sm">
                <div>
                  <p className="text-muted-foreground">{t("profile.cpf")}</p>
                  <p className="font-medium">{profile.cpfMasked ?? "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t("profile.department")}</p>
                  <p className="font-medium">{profile.department ?? "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t("profile.jobTitle")}</p>
                  <p className="font-medium">{profile.jobTitle ?? "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t("profile.company")}</p>
                  <p className="font-medium">{profile.company?.name ?? "—"}</p>
                </div>
              </div>
              <Button type="submit" disabled={isSubmitting || saveMutation.isPending}>
                {saveMutation.isPending ? t("common.loading") : t("common.save")}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t("profile.myRequests")}</CardTitle>
          <Button asChild variant="outline" size="sm">
            <Link href="/requests">{t("profile.viewAll")}</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-[16px]">
            {t("profile.pendingCount", { count: String(profile.pendingRequestsCount) })}
          </p>
          {profile.recentRequests.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("profile.noRequests")}</p>
          ) : (
            <ul className="divide-y divide-border/60">
              {profile.recentRequests.map((req) => (
                <li key={req.id} className="py-[12px] flex items-center justify-between gap-[12px]">
                  <div className="min-w-0">
                    <Link href={`/requests/${req.id}`} className="font-medium text-sm hover:underline truncate block">
                      {req.subject}
                    </Link>
                    <p className="text-xs text-muted-foreground">{formatDate(req.updatedAt)}</p>
                  </div>
                  <StatusBadge status={req.status.toLowerCase()} />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
