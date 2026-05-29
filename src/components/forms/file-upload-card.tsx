"use client";

import { useCallback, useState } from "react";
import { PlatformIcons } from "@/components/icons";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status/status-badge";
import type { DocumentUploadStatus } from "@/types";
import { cn } from "@/lib/utils";

interface FileUploadCardProps {
  title: string;
  description?: string;
  status: DocumentUploadStatus;
  rejectionReason?: string;
  onUpload?: (file: File) => void;
}

const STATUS_ICONS = {
  pending: PlatformIcons.point,
  submitted: PlatformIcons.upload,
  approved: PlatformIcons.check,
  rejected: PlatformIcons.alert,
};

export function FileUploadCard({
  title,
  description,
  status,
  rejectionReason,
  onUpload,
}: FileUploadCardProps) {
  const [fileName, setFileName] = useState<string | null>(null);
  const StatusIcon = STATUS_ICONS[status];

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        setFileName(file.name);
        onUpload?.(file);
      }
    },
    [onUpload]
  );

  return (
    <Card
      variant="outline"
      className={cn(
        "transition-all hover:shadow-soft",
        status === "rejected" && "border-destructive/40 bg-destructive/[0.02]"
      )}
    >
      <CardContent className="p-[18px]">
        <div className="flex items-start justify-between gap-[16px]">
          <div className="flex gap-[14px] min-w-0">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted">
              <PlatformIcons.file className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm">{title}</p>
              {description && (
                <p className="text-xs text-muted-foreground mt-[4px]">{description}</p>
              )}
              {fileName && (
                <p className="text-xs text-primary font-medium mt-[6px] truncate">{fileName}</p>
              )}
              {rejectionReason && (
                <p className="text-xs text-destructive mt-[6px]">Reason: {rejectionReason}</p>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-[8px] shrink-0">
            <StatusBadge status={status} />
            <StatusIcon
              className={cn(
                "h-[18px] w-[18px]",
                status === "approved" && "text-[hsl(var(--success))]",
                status === "rejected" && "text-destructive",
                (status === "pending" || status === "submitted") && "text-muted-foreground"
              )}
            />
          </div>
        </div>
        {(status === "pending" || status === "rejected") && (
          <div className="mt-[14px] pt-[14px] border-t border-border/60">
            <input
              type="file"
              id={`upload-${title}`}
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleChange}
            />
            <Button variant="outline" size="sm" asChild className="w-full sm:w-auto">
              <label htmlFor={`upload-${title}`} className="cursor-pointer">
                <PlatformIcons.upload className="h-4 w-4 mr-[8px]" />
                Upload file
              </label>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
