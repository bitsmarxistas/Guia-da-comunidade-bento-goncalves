// src/ui/components/native-select.tsx
"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface NativeSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const NativeSelect = forwardRef<HTMLSelectElement, NativeSelectProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={id}
            className="mb-1.5 block text-sm font-medium text-ink"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={id}
          className={cn(
            "h-10 w-full rounded-lg border border-line-strong bg-surface px-3 text-sm text-ink transition-colors",
            "focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/25 focus-visible:outline-none",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-critical focus-visible:ring-critical/25",
            className,
          )}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-critical">{error}</p>}
      </div>
    );
  },
);

NativeSelect.displayName = "NativeSelect";
