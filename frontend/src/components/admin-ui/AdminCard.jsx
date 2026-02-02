"use client";

import { cn } from "@/lib/utils";

export function AdminCard({ className, elevated = false, children, ...props }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-[color:var(--adm-border)] bg-[var(--adm-surface)] text-[var(--adm-text)]",
        elevated ? "shadow-[0_20px_60px_var(--adm-shadow)]" : "shadow-none",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function AdminCardHeader({ className, children, ...props }) {
  return (
    <div
      className={cn(
        "px-5 py-4 border-b border-[color:var(--adm-border)] bg-[var(--adm-surface-2)]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function AdminCardTitle({ className, children, ...props }) {
  return (
    <h2 className={cn("text-lg md:text-xl font-bold", className)} {...props}>
      {children}
    </h2>
  );
}

export function AdminCardDescription({ className, children, ...props }) {
  return (
    <p
      className={cn("mt-1 text-sm text-[var(--adm-text-muted)]", className)}
      {...props}
    >
      {children}
    </p>
  );
}

export function AdminCardContent({ className, children, ...props }) {
  return (
    <div className={cn("p-5", className)} {...props}>
      {children}
    </div>
  );
}

export function AdminCardFooter({ className, children, ...props }) {
  return (
    <div
      className={cn(
        "px-5 py-4 border-t border-[color:var(--adm-border)] bg-[var(--adm-surface)]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
