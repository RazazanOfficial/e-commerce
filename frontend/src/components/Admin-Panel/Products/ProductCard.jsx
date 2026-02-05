"use client";

import { Eye, Pencil, Archive, RotateCcw, Trash2 } from "lucide-react";
import { AdminCard, AdminCardContent, AdminIconButton } from "@/components/admin-ui";
import ProductStatusBadge from "./ProductStatusBadge";

const formatPrice = (price, currency) => {
  const p = Number(price);
  if (!Number.isFinite(p)) return "—";
  const c = String(currency || "IRT").toUpperCase();
  const suffix = c === "USD" ? "$" : c;
  try {
    return `${p.toLocaleString("fa-IR")} ${suffix}`;
  } catch {
    return `${p} ${suffix}`;
  }
};

export default function ProductCard({
  product,
  onView,
  onEdit,
  onArchive,
  onRestore,
  onHardDelete,
}) {
  const title = product?.title || "(بدون عنوان)";
  const categoryName = product?.categoryId?.name || "بدون دسته";
  const status = (product?.status || "DRAFT").toUpperCase();
  const isArchived = status === "ARCHIVED";

  const primaryImage = Array.isArray(product?.images)
    ? product.images.find((i) => i?.isPrimary) || product.images[0]
    : null;

  return (
    <AdminCard elevated className="overflow-hidden">
      <AdminCardContent className="p-0">
        <div className="relative">
          <div className="aspect-square bg-[var(--adm-surface-2)]">
            {primaryImage?.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={primaryImage.url}
                alt={primaryImage.alt || title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[var(--adm-text-muted)] text-sm">
                بدون تصویر
              </div>
            )}
          </div>

          <div className="absolute top-3 right-3">
            <ProductStatusBadge status={product?.status} visible={product?.visible} />
          </div>

          <div className="absolute bottom-2 left-2 right-2">
            <div className="flex items-center justify-center gap-1.5 p-1.5 rounded-2xl bg-[var(--adm-surface)]/85 backdrop-blur border border-[color:var(--adm-border)]">
              <AdminIconButton
                label="مشاهده"
                intent="primary"
                size="sm"
                onClick={() => onView?.(product)}
              >
                <Eye className="w-4 h-4" />
              </AdminIconButton>

              <AdminIconButton
                label="ویرایش"
                intent="info"
                size="sm"
                onClick={() => onEdit?.(product)}
              >
                <Pencil className="w-4 h-4" />
              </AdminIconButton>

              {isArchived ? (
                <AdminIconButton
                  label="بازگردانی"
                  intent="success"
                  size="sm"
                  onClick={() => onRestore?.(product)}
                >
                  <RotateCcw className="w-4 h-4" />
                </AdminIconButton>
              ) : (
                <AdminIconButton
                  label="آرشیو"
                  intent="muted"
                  size="sm"
                  onClick={() => onArchive?.(product)}
                >
                  <Archive className="w-4 h-4" />
                </AdminIconButton>
              )}

              <AdminIconButton
                label="حذف دائمی"
                intent="danger"
                size="sm"
                onClick={() => onHardDelete?.(product)}
              >
                <Trash2 className="w-4 h-4" />
              </AdminIconButton>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-2">
          <div className="min-h-[40px]">
            <div className="text-sm font-bold text-[var(--adm-text)] line-clamp-2">
              {title}
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-semibold text-[var(--adm-text)]">
              {formatPrice(product?.price, product?.currency)}
            </div>
            <div className="text-xs text-[var(--adm-text-muted)] truncate">
              {categoryName}
            </div>
          </div>
        </div>
      </AdminCardContent>
    </AdminCard>
  );
}
