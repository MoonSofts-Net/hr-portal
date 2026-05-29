"use client";

import { getPermissionsByModule, MODULE_LABELS } from "@/lib/permissions/definitions";
import type { Permission } from "@/types";

interface PermissionMatrixProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
  readOnly?: boolean;
}

export function PermissionMatrix({
  selectedIds,
  onChange,
  disabled,
  readOnly,
}: PermissionMatrixProps) {
  const grouped = getPermissionsByModule();

  const toggle = (perm: Permission) => {
    if (readOnly || disabled) return;
    const next = selectedIds.includes(perm.id)
      ? selectedIds.filter((id) => id !== perm.id)
      : [...selectedIds, perm.id];
    onChange(next);
  };

  const toggleModule = (perms: Permission[]) => {
    if (readOnly || disabled) return;
    const ids = perms.map((p) => p.id);
    const allSelected = ids.every((id) => selectedIds.includes(id));
    if (allSelected) {
      onChange(selectedIds.filter((id) => !ids.includes(id)));
    } else {
      onChange(Array.from(new Set([...selectedIds, ...ids])));
    }
  };

  return (
    <div className="space-y-[24px]">
      {Object.entries(grouped).map(([module, perms]) => (
        <div key={module} className="rounded-lg border p-[16px]">
          <div className="flex items-center justify-between mb-[12px]">
            <h4 className="font-medium text-sm">
              {MODULE_LABELS[module as keyof typeof MODULE_LABELS]}
            </h4>
            {!readOnly && (
              <button
                type="button"
                className="text-xs text-primary hover:underline"
                onClick={() => toggleModule(perms)}
                disabled={disabled}
              >
                Toggle all
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[12px]">
            {perms.map((perm) => (
              <label
                key={perm.id}
                className="flex items-center gap-[8px] text-sm cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedIds.includes(perm.id)}
                  onChange={() => toggle(perm)}
                  disabled={disabled || readOnly}
                  className="rounded border-input"
                />
                <span>{perm.label}</span>
              </label>
            ))}
          </div>
        </div>
      ))}
      {selectedIds.includes("*") && (
        <p className="text-sm text-muted-foreground">System role: all permissions granted.</p>
      )}
    </div>
  );
}
