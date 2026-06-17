import { Label } from "@/components/ui/label";
import { useTranslations } from "@/hooks/use-translations";
import { cn } from "@/lib/utils";

interface FormFieldProps {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function FormField({
  label,
  error,
  hint,
  required,
  children,
  className,
}: FormFieldProps) {
  const { t } = useTranslations();
  const translatedError =
    error && error.startsWith("validation.") ? t(error as never) : error;

  return (
    <div className={cn("space-y-[6px]", className)}>
      <Label>
        {label}
        {required && <span className="text-destructive ml-[4px]">*</span>}
      </Label>
      {children}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {translatedError && <p className="text-xs text-destructive">{translatedError}</p>}
    </div>
  );
}
