import type { Notification } from "@/types";

type Translate = (key: string, params?: Record<string, string>) => string;

const NOTIFICATION_TEXT_MAP: Record<
  string,
  { title: string; body: string }
> = {
  "notifications.user.created": {
    title: "notifications.user.createdTitle",
    body: "notifications.user.createdBody",
  },
  "notifications.user.updated": {
    title: "notifications.user.updatedTitle",
    body: "notifications.user.updatedBody",
  },
  "notifications.user.roleChanged": {
    title: "notifications.user.roleChangedTitle",
    body: "notifications.user.roleChangedBody",
  },
  "notifications.user.statusChanged": {
    title: "notifications.user.statusChangedTitle",
    body: "notifications.user.statusChangedBody",
  },
  "notifications.auth.passwordResetRequested": {
    title: "notifications.auth.passwordResetRequestedTitle",
    body: "notifications.auth.passwordResetRequestedBody",
  },
  "notifications.auth.passwordResetCompleted": {
    title: "notifications.auth.passwordResetCompletedTitle",
    body: "notifications.auth.passwordResetCompletedBody",
  },
  "notifications.auth.passwordChanged": {
    title: "notifications.auth.passwordChangedTitle",
    body: "notifications.auth.passwordChangedBody",
  },
  "notifications.profile.updated": {
    title: "notifications.profile.updatedTitle",
    body: "notifications.profile.updatedBody",
  },
  "notifications.profile.avatarUpdated": {
    title: "notifications.profile.avatarUpdatedTitle",
    body: "notifications.profile.avatarUpdatedBody",
  },
  "notifications.hrRequest.created": {
    title: "notifications.hrRequest.createdTitle",
    body: "notifications.hrRequest.createdBody",
  },
  "notifications.hrRequest.statusChanged": {
    title: "notifications.hrRequest.statusChangedTitle",
    body: "notifications.hrRequest.statusChangedBody",
  },
  "notifications.hrRequest.messageAdded": {
    title: "notifications.hrRequest.messageAddedTitle",
    body: "notifications.hrRequest.messageAddedBody",
  },
};

export function getNotificationText(
  notification: Notification,
  t: Translate
): { title: string; body: string; categoryLabel: string } {
  const mapping = NOTIFICATION_TEXT_MAP[notification.messageKey];
  const metadata = notification.metadata ?? {};
  const statusParam =
    typeof metadata.status === "string" ? metadata.status : t("common.unknown");

  const title = mapping ? t(mapping.title) : notification.title || t("notifications.fallbackTitle");
  const body = mapping
    ? t(mapping.body, { status: statusParam })
    : notification.body || t("notifications.fallbackBody");
  const categoryLabel = t(`notifications.categories.${notification.category}`);

  return { title, body, categoryLabel };
}
