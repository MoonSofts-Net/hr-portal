import { apiFetch, apiRequest, useMockApi, type RequestContext } from "./client";

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  status: string;
  department?: string;
  jobTitle?: string;
  hireDate?: string;
  birthDate?: string;
  cpfMasked?: string;
  phone?: string;
  address?: string;
  branch?: { id: string; code: string; name: string };
  company?: { id: string; name: string };
  pendingRequestsCount: number;
  recentRequests: {
    id: string;
    subject: string;
    status: string;
    createdAt: string;
    updatedAt: string;
  }[];
}

export interface UpdateProfileInput {
  name?: string;
  phone?: string;
  address?: string;
}

export async function getMyProfile(context: RequestContext): Promise<UserProfile> {
  if (useMockApi()) {
    return apiRequest(
      () => ({
        id: context.userId ?? "",
        email: "colaborador@moonsofts.com",
        name: "Colaborador Demo",
        status: "ACTIVE",
        department: "Operações",
        jobTitle: "Assistente",
        pendingRequestsCount: 1,
        recentRequests: [],
      }),
      context,
    );
  }

  return apiFetch<UserProfile>("/profile/me", { context });
}

export async function updateMyProfile(
  context: RequestContext,
  input: UpdateProfileInput,
): Promise<UserProfile> {
  if (useMockApi()) {
    return apiRequest(() => getMyProfile(context), context);
  }

  return apiFetch<UserProfile>("/profile/me", {
    method: "PATCH",
    context,
    body: JSON.stringify(input),
  });
}

export async function uploadAvatar(
  context: RequestContext,
  file: File,
): Promise<{ avatarUrl: string }> {
  if (useMockApi()) {
    return apiRequest(() => ({ avatarUrl: URL.createObjectURL(file) }), context);
  }

  const form = new FormData();
  form.append("file", file);

  return apiFetch<{ avatarUrl: string }>("/profile/avatar", {
    method: "POST",
    context,
    body: form,
  });
}
