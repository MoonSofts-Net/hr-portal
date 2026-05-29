import { Badge } from "@/components/ui/badge";

const STATUS_MAP: Record<string, { label: string; variant: "default" | "success" | "warning" | "danger" | "muted" | "secondary" }> = {
  active: { label: "Active", variant: "success" },
  inactive: { label: "Inactive", variant: "muted" },
  pending: { label: "Pending", variant: "warning" },
  not_started: { label: "Not started", variant: "muted" },
  in_progress: { label: "In progress", variant: "warning" },
  submitted: { label: "Submitted", variant: "default" },
  under_review: { label: "Under review", variant: "warning" },
  approved: { label: "Approved", variant: "success" },
  rejected: { label: "Rejected", variant: "danger" },
  open: { label: "Open", variant: "default" },
  waiting_employee: { label: "Waiting employee", variant: "warning" },
  resolved: { label: "Resolved", variant: "success" },
  closed: { label: "Closed", variant: "muted" },
  normal: { label: "Normal", variant: "success" },
  incomplete: { label: "Incomplete", variant: "warning" },
  holiday: { label: "Holiday", variant: "secondary" },
  absence: { label: "Absence", variant: "danger" },
  cancelled: { label: "Cancelled", variant: "muted" },
};

export function StatusBadge({ status }: { status: string }) {
  const config = STATUS_MAP[status] ?? { label: status, variant: "secondary" as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
