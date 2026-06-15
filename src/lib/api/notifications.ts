import { apiFetch, apiRequest, useMockApi, type RequestContext } from "./client";
import { MOCK_NOTIFICATIONS } from "@/mocks/seed";
import type { Notification } from "@/types";

function mapNotification(raw: Record<string, unknown>): Notification {
  return {
    id: String(raw.id),
    tenantId: String(raw.tenantId),
    userId: String(raw.userId),
    title: String(raw.title),
    body: String(raw.body),
    read: Boolean(raw.read),
    createdAt: String(raw.createdAt ?? new Date().toISOString()),
    link: raw.link ? String(raw.link) : undefined,
  };
}

export async function getNotifications(
  context: RequestContext
): Promise<Notification[]> {
  if (useMockApi()) {
    return apiRequest(() => {
      if (!context.userId) return [];
      return MOCK_NOTIFICATIONS.filter(
        (n) => n.tenantId === context.tenantId && n.userId === context.userId
      );
    }, context);
  }

  const data = await apiFetch<Array<Record<string, unknown>>>("/notifications", {
    context,
  });

  return data.map(mapNotification);
}
