"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { PlatformIcons } from "@/components/icons";
import { downloadDocument, getDocuments } from "@/lib/api/documents";
import { useRequestContext } from "@/features/auth/store";
import { useToast } from "@/components/feedback/toast-provider";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { DataTable } from "@/components/tables/data-table";
import { StatusBadge } from "@/components/status/status-badge";
import { LoadingState } from "@/components/status/loading-state";
import { PermissionGuard } from "@/components/guards/permission-guard";
import type { ApiError, Document, DocumentCategory } from "@/types";
import { formatDate } from "@/lib/utils";

const CATEGORIES: { value: DocumentCategory | ""; label: string }[] = [
  { value: "", label: "All categories" },
  { value: "personal", label: "Personal documents" },
  { value: "contracts", label: "Contracts" },
  { value: "payslips", label: "Payslips" },
  { value: "internal", label: "Internal communications" },
  { value: "other", label: "Other" },
];

export default function DocumentsPage() {
  const context = useRequestContext();
  const toast = useToast();
  const [category, setCategory] = useState<DocumentCategory | "">("");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["documents", context.tenantId, category],
    queryFn: () =>
      getDocuments(context, category ? { category } : undefined),
    enabled: Boolean(context.tenantId),
  });

  const handleDownload = async (doc: Document) => {
    setDownloadingId(doc.id);
    try {
      await downloadDocument(doc, context);
      toast.success("Download complete", doc.name);
    } catch (err) {
      const apiErr = err as ApiError;
      toast.error("Download failed", apiErr.message ?? "Could not download file");
    } finally {
      setDownloadingId(null);
    }
  };

  const columns = [
    { key: "name", header: "Document", cell: (d: Document) => d.name },
    { key: "category", header: "Category", cell: (d: Document) => d.category },
    { key: "version", header: "Version", cell: (d: Document) => `v${d.version}` },
    { key: "status", header: "Status", cell: (d: Document) => <StatusBadge status={d.status} /> },
    {
      key: "access",
      header: "Access",
      cell: (d: Document) => (
        <span className="text-xs text-muted-foreground">{d.accessLevel}</span>
      ),
    },
    {
      key: "date",
      header: "Uploaded",
      cell: (d: Document) => formatDate(d.uploadedAt),
    },
    {
      key: "actions",
      header: "",
      cell: (d: Document) => (
        <PermissionGuard permission="documents.download">
          <Button
            variant="ghost"
            size="sm"
            disabled={downloadingId === d.id}
            onClick={(event) => {
              event.stopPropagation();
              void handleDownload(d);
            }}
          >
            {downloadingId === d.id ? (
              <PlatformIcons.loader className="h-4 w-4 animate-spin" />
            ) : (
              <PlatformIcons.download className="h-4 w-4" />
            )}
          </Button>
        </PermissionGuard>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Documents"
        description="Secure document repository"
        actions={
          <PermissionGuard permission="documents.upload">
            <Button asChild>
              <Link href="/documents/upload">
                <PlatformIcons.upload className="h-4 w-4 mr-[8px]" />
                Upload
              </Link>
            </Button>
          </PermissionGuard>
        }
      />
      <div className="mb-[16px] max-w-xs">
        <Select
          value={category}
          onChange={(e) => setCategory(e.target.value as DocumentCategory | "")}
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </Select>
      </div>
      {isLoading ? (
        <LoadingState />
      ) : (
        <DataTable columns={columns} data={data?.data ?? []} keyExtractor={(d) => d.id} />
      )}
    </div>
  );
}
