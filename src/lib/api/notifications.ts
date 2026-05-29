import { apiRequest } from "./client";
import { MOCK_NOTIFICATIONS } from "@/mocks/seed";
import type { Notification } from "@/types";
import type { RequestContext } from "./client";

export async function getNotifications(
  context: RequestContext
): Promise<Notification[]> {
  return apiRequest(() => {
    if (!context.userId) return [];
    return MOCK_NOTIFICATIONS.filter(
      (n) => n.tenantId === context.tenantId && n.userId === context.userId
    );
  }, context);
}
