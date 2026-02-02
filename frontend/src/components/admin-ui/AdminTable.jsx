"use client";

import { cn } from "@/lib/utils";

export function AdminTableShell({ className, children, ...props }) {
  return (
    <div
      className={cn(
        "overflow-x-auto rounded-2xl border border-[color:var(--adm-border)]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function AdminTable({ className, children, ...props }) {
  return (
    <table
      className={cn("w-full text-right text-sm", className)}
      {...props}
    >
      {children}
    </table>
  );
}

export function AdminTHead({ className, children, ...props }) {
  return (
    <thead
      className={cn(
        "bg-[var(--adm-surface-2)] text-[var(--adm-text)]",
        className
      )}
      {...props}
    >
      {children}
    </thead>
  );
}

export function AdminTR({ className, interactive = false, children, ...props }) {
  return (
    <tr
      className={cn(
        "border-b border-[color:var(--adm-border)] bg-[var(--adm-surface)]",
        interactive ? "hover:bg-[var(--adm-primary-soft)] transition-colors" : "",
        className
      )}
      {...props}
    >
      {children}
    </tr>
  );
}

export function AdminTH({ className, children, ...props }) {
  return (
    <th className={cn("py-3 px-4 font-semibold", className)} {...props}>
      {children}
    </th>
  );
}

export function AdminTD({ className, children, ...props }) {
  return (
    <td className={cn("py-3 px-4", className)} {...props}>
      {children}
    </td>
  );
}
