import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

interface Column<T> {
  key: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  onRowClick?: (row: T) => void;
  title?: string;
  description?: string;
  toolbar?: React.ReactNode;
  emptyState?: React.ReactNode;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  title,
  description,
  toolbar,
  emptyState,
}: DataTableProps<T>) {
  return (
    <Card variant="elevated" className="overflow-hidden">
      {(title || toolbar) && (
        <div className="flex flex-col gap-[12px] sm:flex-row sm:items-center sm:justify-between border-b border-border/80 px-[20px] py-[16px] bg-muted/20">
          <div>
            {title && <h3 className="font-semibold text-sm">{title}</h3>}
            {description && (
              <p className="text-xs text-muted-foreground mt-[2px]">{description}</p>
            )}
          </div>
          {toolbar}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/80 bg-muted/30">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "h-11 px-[20px] text-left align-middle text-[11px] font-bold uppercase tracking-wider text-muted-foreground",
                    col.className
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="p-0">
                  {emptyState ?? (
                    <div className="flex h-32 items-center justify-center text-muted-foreground">
                      No records found
                    </div>
                  )}
                </td>
              </tr>
            ) : (
              data.map((row, index) => (
                <tr
                  key={keyExtractor(row)}
                  className={cn(
                    "border-b border-border/50 transition-colors",
                    index % 2 === 1 && "bg-muted/15",
                    onRowClick && "cursor-pointer hover:bg-primary/[0.04]"
                  )}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn("px-[20px] py-[14px] align-middle", col.className)}
                    >
                      {col.cell(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
