"use client";

import { cn } from "@/lib/utils";

export function AdminField({
  label,
  hint,
  error,
  required = false,
  className,
  children,
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label ? (
        <div className="flex items-center justify-between gap-3">
          <label className="text-sm font-semibold text-[var(--adm-text)]">
            {label}
            {required ? <span className="mr-1 text-[var(--adm-error)]">*</span> : null}
          </label>
          {hint ? (
            <span className="text-xs text-[var(--adm-text-muted)]">{hint}</span>
          ) : null}
        </div>
      ) : null}

      {children}

      {error ? (
        <p className="text-xs text-[var(--adm-error)]">{error}</p>
      ) : null}
    </div>
  );
}

export function AdminInput({ className, variant = "default", ...props }) {
  const variants = {
    default: "bg-[var(--adm-surface)]",
    filled: "bg-[var(--adm-surface-2)]",
  };

  return (
    <input
      className={cn(
        "w-full h-10 px-3 rounded-xl border border-[color:var(--adm-border)] text-[var(--adm-text)] placeholder:text-[var(--adm-text-muted)] text-right",
        variants[variant] || variants.default,
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--adm-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--adm-bg)]",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
      {...props}
    />
  );
}

export function AdminTextarea({ className, variant = "default", ...props }) {
  const variants = {
    default: "bg-[var(--adm-surface)]",
    filled: "bg-[var(--adm-surface-2)]",
  };

  return (
    <textarea
      className={cn(
        "w-full min-h-28 px-3 py-2 rounded-xl border border-[color:var(--adm-border)] text-[var(--adm-text)] placeholder:text-[var(--adm-text-muted)] text-right",
        variants[variant] || variants.default,
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--adm-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--adm-bg)]",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
      {...props}
    />
  );
}

export function AdminSelect({ className, variant = "default", children, ...props }) {
  const variants = {
    default: "bg-[var(--adm-surface)]",
    filled: "bg-[var(--adm-surface-2)]",
  };

  return (
    <select
      className={cn(
        "w-full h-10 px-3 rounded-xl border border-[color:var(--adm-border)] text-[var(--adm-text)] text-right",
        variants[variant] || variants.default,
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--adm-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--adm-bg)]",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}
