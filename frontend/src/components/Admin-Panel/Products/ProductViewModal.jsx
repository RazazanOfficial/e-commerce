"use client";

import { useEffect, useState } from "react";
import apiClient from "@/common/apiClient";
import { toast } from "react-toastify";
import {
  AdminBadge,
  AdminModal,
  AdminCard,
  AdminCardContent,
} from "@/components/admin-ui";
import backApis from "@/common/inedx";
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

export default function ProductViewModal({ open, onClose, productId }) {
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState(null);

  useEffect(() => {
    if (!open || !productId) return;
    (async () => {
      try {
        setLoading(true);
        const { url } = backApis.getSingleProduct(productId);
        const res = await apiClient.get(url);
        setProduct(res?.data?.data || null);
      } catch (err) {
        console.error(err);
        toast.error("خطا در دریافت اطلاعات محصول");
      } finally {
        setLoading(false);
      }
    })();
  }, [open, productId]);

  const images = Array.isArray(product?.images) ? product.images : [];

  return (
    <AdminModal
      open={open}
      onClose={onClose}
      size="xl"
      title="مشاهده محصول"
      description={product?.title ? product.title : ""}
    >
      {loading ? (
        <div className="py-10 flex items-center justify-center">
          <div
            className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: "var(--adm-primary)", borderTopColor: "transparent" }}
            aria-label="loading"
          />
        </div>
      ) : null}

      {!loading && product ? (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <ProductStatusBadge status={product.status} visible={product.visible} />
            <div className="text-sm font-semibold text-[var(--adm-text)]">
              {formatPrice(product.price, product.currency)}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <AdminCard>
              <AdminCardContent className="p-4 space-y-2">
                <div className="text-xs text-[var(--adm-text-muted)]">Slug</div>
                <div className="text-sm font-semibold text-[var(--adm-text)] break-all">
                  {product.slug}
                </div>
              </AdminCardContent>
            </AdminCard>

            <AdminCard>
              <AdminCardContent className="p-4 space-y-2">
                <div className="text-xs text-[var(--adm-text-muted)]">دسته‌بندی</div>
                <div className="text-sm font-semibold text-[var(--adm-text)]">
                  {product?.categoryId?.name || "—"}
                </div>
              </AdminCardContent>
            </AdminCard>

            <AdminCard>
              <AdminCardContent className="p-4 space-y-2">
                <div className="text-xs text-[var(--adm-text-muted)]">موجودی</div>
                <div className="text-sm font-semibold text-[var(--adm-text)]">
                  {typeof product?.inventory?.qty === "number" ? product.inventory.qty : "—"}
                </div>
              </AdminCardContent>
            </AdminCard>
          </div>

          <AdminCard>
            <AdminCardContent className="p-4">
              <div className="text-xs text-[var(--adm-text-muted)]">توضیح کوتاه</div>
              <div className="mt-2 text-sm text-[var(--adm-text)] leading-7">
                {product.shortDescription}
              </div>
            </AdminCardContent>
          </AdminCard>

          {product.overviewHtml ? (
            <AdminCard>
              <AdminCardContent className="p-4">
                <div className="text-xs text-[var(--adm-text-muted)]">توضیحات کامل</div>
                <div className="mt-2 text-sm text-[var(--adm-text)] leading-7 whitespace-pre-wrap">
                  {product.overviewHtml}
                </div>
              </AdminCardContent>
            </AdminCard>
          ) : null}

          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-semibold text-[var(--adm-text)]">گالری تصاویر</div>
              <AdminBadge variant="neutral">{images.length}</AdminBadge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {images.map((img, idx) => (
                <div
                  key={`${img.url}-${idx}`}
                  className="rounded-2xl overflow-hidden border border-[color:var(--adm-border)] bg-[var(--adm-surface)]"
                >
                  <div className="aspect-square bg-[var(--adm-surface-2)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.url}
                      alt={img.alt}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>

                  <div className="p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs text-[var(--adm-text)] line-clamp-2">
                        {img.alt}
                      </div>
                      {img.isPrimary ? <AdminBadge variant="primary">اصلی</AdminBadge> : null}
                    </div>
                  </div>
                </div>
              ))}

              {images.length === 0 ? (
                <div className="col-span-full p-6 rounded-2xl border border-dashed border-[color:var(--adm-border)] text-center text-sm text-[var(--adm-text-muted)]">
                  تصویری ثبت نشده است.
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </AdminModal>
  );
}
