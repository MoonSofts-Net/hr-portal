import { apiFetch, apiFetchPaginated, apiRequest, useMockApi as isMockApiEnabled, type RequestContext } from "./client";
import { MOCK_NOTIFICATIONS } from "@/mocks/seed";
import type { Notification } from "@/types";

function mapNotification(raw: Record<string, unknown>): Notification {
  return {
    id: String(raw.id),
    tenantId: String(raw.tenantId),
    userId: String(raw.userId),
    type: String(raw.type ?? "system.general"),
    category: String(raw.category ?? "system"),
    messageKey: String(raw.messageKey ?? "notifications.system.general"),
    actorUserId: raw.actorUserId ? String(raw.actorUserId) : undefined,
    metadata: raw.metadata && typeof raw.metadata === "object" ? (raw.metadata as Record<string, unknown>) : undefined,
    title: String(raw.title),
    body: String(raw.body),
    read: Boolean(raw.read),
    createdAt: String(raw.createdAt ?? new Date().toISOString()),
    link: raw.link ? String(raw.link) : undefined,
  };
}

export interface NotificationsQuery {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
  category?: string;
  type?: string;
}

export async function getNotifications(
  context: RequestContext,
  query?: NotificationsQuery
): Promise<Notification[]> {
  if (isMockApiEnabled()) {
    return apiRequest(() => {
      if (!context.userId) return [];
      return MOCK_NOTIFICATIONS.filter(
        (n) => n.tenantId === context.tenantId && n.userId === context.userId
      );
    }, context);
  }

  const params = new URLSearchParams();
  if (query?.page) params.set("page", String(query.page));
  if (query?.limit) params.set("limit", String(query.limit));
  if (query?.unreadOnly) params.set("unreadOnly", "true");
  if (query?.category) params.set("category", query.category);
  if (query?.type) params.set("type", query.type);
  const suffix = params.toString();

  const data = await apiFetchPaginated<Array<Record<string, unknown>>>(`/notifications${suffix ? `?${suffix}` : ""}`, {
    context,
  });

  return data.data.map(mapNotification);
}

export async function getUnreadNotificationsCount(
  context: RequestContext
): Promise<number> {
  if (isMockApiEnabled()) {
    return apiRequest(() => {
      if (!context.userId) return 0;
      return MOCK_NOTIFICATIONS.filter(
        (n) => n.tenantId === context.tenantId && n.userId === context.userId && !n.read
      ).length;
    }, context);
  }

  const data = await apiFetch<{ unread: number }>("/notifications/unread-count", {
    context,
  });
  return Number(data.unread ?? 0);
}

export async function markNotificationRead(
  context: RequestContext,
  id: string,
): Promise<void> {
  if (isMockApiEnabled()) {
    return apiRequest(() => {
      const n = MOCK_NOTIFICATIONS.find((item) => item.id === id);
      if (n) n.read = true;
    }, context);
  }

  await apiFetch(`/notifications/${id}/read`, { method: "PATCH", context });
}

export async function markAllNotificationsRead(context: RequestContext): Promise<void> {
  if (isMockApiEnabled()) {
    return apiRequest(() => {
      MOCK_NOTIFICATIONS.forEach((n) => {
        if (n.tenantId === context.tenantId && n.userId === context.userId) {
          n.read = true;
        }
      });
    }, context);
  }

  await apiFetch("/notifications/read-all", { method: "POST", context });
}
