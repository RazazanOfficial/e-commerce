"use client";

import { AdminBadge } from "@/components/admin-ui";

export default function ProductStatusBadge({ status, visible }) {
  const s = (status || "DRAFT").toUpperCase();
  let variant = "neutral";
  let label = "پیش‌نویس";

  if (s === "ACTIVE") {
    variant = "success";
    label = "فعال";
  } else if (s === "ARCHIVED") {
    variant = "warning";
    label = "آرشیو";
  }

  return (
    <div className="flex items-center gap-2">
      <AdminBadge variant={variant}>{label}</AdminBadge>
      {typeof visible === "boolean" ? (
        <AdminBadge variant={visible ? "info" : "error"}>
          {visible ? "نمایش" : "مخفی"}
        </AdminBadge>
      ) : null}
    </div>
  );
}
