"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

const VARIANTS = {
  primary:
    "bg-[var(--adm-primary)] text-[var(--adm-on-primary)] hover:bg-[var(--adm-primary-hover)]",
  secondary:
    "bg-[var(--adm-surface-2)] text-[var(--adm-text)] border border-[color:var(--adm-border)] hover:bg-[var(--adm-surface)]",
  ghost:
    "bg-transparent text-[var(--adm-text)] hover:bg-[var(--adm-surface-2)]",
  danger:
    "bg-[var(--adm-error)] text-white hover:opacity-90",
  success:
    "bg-[var(--adm-success)] text-white hover:opacity-90",
};

const SIZES = {
  sm: "h-9 px-3 text-sm rounded-xl",
  md: "h-10 px-4 text-sm rounded-xl",
  lg: "h-11 px-5 text-base rounded-2xl",
};

export function AdminButton({
  className,
  variant = "primary",
  size = "md",
  type = "button",
  loading = false,
  disabled = false,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  children,
  ...props
}) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      className={cn(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap",
        "font-semibold transition",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--adm-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--adm-bg)]",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        SIZES[size] || SIZES.md,
        VARIANTS[variant] || VARIANTS.primary,
        className
      )}
      {...props}
    >
      {LeftIcon ? <LeftIcon className="h-4 w-4" aria-hidden="true" /> : null}
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <span
            className="h-4 w-4 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: "currentColor", borderTopColor: "transparent" }}
            aria-hidden="true"
          />
          <span>{children}</span>
        </span>
      ) : (
        <span>{children}</span>
      )}
      {RightIcon ? <RightIcon className="h-4 w-4" aria-hidden="true" /> : null}
    </button>
  );
}

export const AdminIconButton = forwardRef(function AdminIconButton(
  {
    className,
    intent = "muted",
    size = "md",
    label,
    children,
    ...props
  },
  ref
) {
  const base =
    "inline-flex items-center justify-center rounded-xl transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--adm-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--adm-bg)]";

  const sizes = {
    sm: "h-9 w-9",
    md: "h-10 w-10",
    lg: "h-11 w-11 rounded-2xl",
  };

  const intents = {
    muted:
      "text-[var(--adm-text-muted)] hover:bg-[var(--adm-surface-2)] hover:text-[var(--adm-text)]",
    primary:
      "text-[var(--adm-text-muted)] hover:bg-[var(--adm-primary-soft)] hover:text-[var(--adm-primary)]",
    success:
      "text-[var(--adm-text-muted)] hover:bg-[var(--adm-success-soft)] hover:text-[var(--adm-success)]",
    danger:
      "text-[var(--adm-text-muted)] hover:bg-[var(--adm-error-soft)] hover:text-[var(--adm-error)]",
    info:
      "text-[var(--adm-text-muted)] hover:bg-[var(--adm-info-soft)] hover:text-[var(--adm-info)]",
  };

  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        base,
        sizes[size] || sizes.md,
        intents[intent] || intents.muted,
        className
      )}
      aria-label={label}
      title={label}
      {...props}
    >
      {children}
    </button>
  );
});
