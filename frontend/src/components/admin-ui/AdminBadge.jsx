"use client";

import { cn } from "@/lib/utils";

const VARIANTS = {
  primary: "bg-[var(--adm-primary-soft)] text-[var(--adm-primary)]",
  info: "bg-[var(--adm-info-soft)] text-[var(--adm-info)]",
  success: "bg-[var(--adm-success-soft)] text-[var(--adm-success)]",
  warning: "bg-[var(--adm-warning-soft)] text-[var(--adm-warning)]",
  error: "bg-[var(--adm-error-soft)] text-[var(--adm-error)]",
  neutral: "bg-[var(--adm-surface-2)] text-[var(--adm-text)] border border-[color:var(--adm-border)]",
};

export function AdminBadge({ className, variant = "neutral", children, ...props }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold",
        VARIANTS[variant] || VARIANTS.neutral,
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
