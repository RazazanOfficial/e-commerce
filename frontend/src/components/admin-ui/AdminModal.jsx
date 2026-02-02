"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const SIZES = {
  sm: "max-w-md",
  md: "max-w-xl",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

export function AdminModal({
  open,
  onClose,
  title,
  description,
  size = "md",
  children,
  footer,
  className,
  closeLabel = "بستن",
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div
        className="absolute inset-0 backdrop-blur-sm"
        style={{ background: "var(--adm-overlay, rgba(0,0,0,0.55))" }}
        onClick={onClose}
      />

      <div
        className={cn(
          "relative w-full m-3 sm:m-0 rounded-2xl overflow-hidden border border-[color:var(--adm-border)] bg-[var(--adm-surface)] text-[var(--adm-text)] shadow-[0_30px_90px_var(--adm-shadow)]",
          SIZES[size] || SIZES.md,
          className
        )}
        role="dialog"
        aria-modal="true"
      >
        <div className="px-5 py-4 bg-[var(--adm-surface-2)] border-b border-[color:var(--adm-border)]">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              {title ? <h3 className="text-lg font-bold">{title}</h3> : null}
              {description ? (
                <p className="mt-1 text-sm text-[var(--adm-text-muted)]">{description}</p>
              ) : null}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center h-10 w-10 rounded-xl text-[var(--adm-text-muted)] hover:bg-[var(--adm-error-soft)] hover:text-[var(--adm-error)] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--adm-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--adm-bg)]"
              aria-label={closeLabel}
              title={closeLabel}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-5">{children}</div>

        {footer ? (
          <div className="px-5 py-4 border-t border-[color:var(--adm-border)] bg-[var(--adm-surface)]">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
