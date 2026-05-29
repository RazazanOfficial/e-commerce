"use client";

import {
  AdminButton,
  AdminField,
  AdminInput,
} from "@/components/admin-ui";
import { cn } from "@/lib/utils";

export default function ProductMediaEditor({
  images,
  imgUrl,
  imgAlt,
  editingImgIndex,
  uploadingImage,
  uploadProgress,
  error,
  onUploadFile,
  onChangeUrl,
  onChangeAlt,
  onCancelEdit,
  onAddOrUpdate,
  onSetPrimary,
  onStartEdit,
  onRemove,
}) {
  const imageList = Array.isArray(images) ? images : [];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[color:var(--adm-border)] bg-[var(--adm-surface-2)] p-4">
        <div className="mb-4 rounded-xl border border-dashed border-[color:var(--adm-border)] bg-[var(--adm-surface)] p-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-[var(--adm-text)]">آپلود مستقیم تصویر</p>
              <p className="text-xs text-[var(--adm-text-muted)]">فایل از مرورگر مستقیم روی Cloud Space آپلود و سپس commit می‌شود.</p>
            </div>
            <label
              className={cn(
                "inline-flex h-10 cursor-pointer items-center justify-center rounded-xl px-4 text-sm font-semibold transition",
                uploadingImage
                  ? "pointer-events-none bg-[var(--adm-surface-2)] text-[var(--adm-text-muted)]"
                  : "bg-[var(--adm-primary)] text-[var(--adm-on-primary)] hover:opacity-90"
              )}
            >
              {uploadingImage ? `در حال آپلود ${uploadProgress || 0}%` : "انتخاب تصویر"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploadingImage}
                onChange={onUploadFile}
              />
            </label>
          </div>
          {uploadingImage ? (
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--adm-surface-2)]">
              <div
                className="h-full rounded-full bg-[var(--adm-primary)] transition-all"
                style={{ width: `${uploadProgress || 4}%` }}
              />
            </div>
          ) : null}
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <AdminField label="آدرس تصویر (url)" required>
            <AdminInput
              value={imgUrl}
              onChange={(e) => onChangeUrl(e.target.value)}
              placeholder="https://..."
              dir="ltr"
              className="text-left"
            />
          </AdminField>
          <AdminField label="متن جایگزین (alt)" required>
            <AdminInput
              value={imgAlt}
              onChange={(e) => onChangeAlt(e.target.value)}
              placeholder="مثلاً: نمای جلوی محصول"
            />
          </AdminField>
        </div>

        <div className="mt-3 flex items-center justify-end gap-2">
          {editingImgIndex !== null ? (
            <AdminButton variant="secondary" onClick={onCancelEdit}>
              لغو
            </AdminButton>
          ) : null}
          <AdminButton variant="primary" onClick={onAddOrUpdate} disabled={uploadingImage}>
            {editingImgIndex !== null ? "ذخیره تغییرات" : "افزودن تصویر"}
          </AdminButton>
        </div>

        {error ? <p className="mt-3 text-xs text-[var(--adm-error)]">{error}</p> : null}
      </div>

      <AdminField label={`گالری تصاویر (${imageList.length})`} required error={error}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {imageList.map((img, idx) => {
            const isPrimary = !!img.isPrimary;
            return (
              <div
                key={`${img.url}-${idx}`}
                className={cn(
                  "overflow-hidden rounded-2xl border bg-[var(--adm-surface)]",
                  isPrimary
                    ? "border-[color:var(--adm-primary)]"
                    : "border-[color:var(--adm-border)]"
                )}
              >
                <div className="aspect-square bg-[var(--adm-surface-2)]">

                  <img
                    src={img.url}
                    alt={img.alt}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>

                <div className="p-3">
                  <div className="line-clamp-2 min-h-[32px] text-xs text-[var(--adm-text)]">
                    {img.alt}
                  </div>

                  <div className="mt-2 grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => onSetPrimary(idx)}
                      className={cn(
                        "h-9 rounded-xl border text-xs font-semibold transition",
                        isPrimary
                          ? "border-[color:var(--adm-primary)] bg-[var(--adm-primary)] text-[var(--adm-on-primary)]"
                          : "border-[color:var(--adm-border)] bg-[var(--adm-surface)] text-[var(--adm-text)] hover:bg-[var(--adm-surface-2)]"
                      )}
                    >
                      {isPrimary ? "اصلی" : "اصلی کن"}
                    </button>

                    <button
                      type="button"
                      onClick={() => onStartEdit(idx)}
                      className="h-9 rounded-xl border border-[color:var(--adm-border)] bg-[var(--adm-surface)] text-xs font-semibold text-[var(--adm-text)] transition hover:bg-[var(--adm-surface-2)]"
                    >
                      ویرایش
                    </button>

                    <button
                      type="button"
                      onClick={() => onRemove(idx)}
                      className="h-9 rounded-xl border border-[color:var(--adm-border)] bg-[var(--adm-error-soft)] text-xs font-semibold text-[var(--adm-error)] transition hover:opacity-90"
                    >
                      حذف
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {imageList.length === 0 ? (
            <div className="col-span-full rounded-2xl border border-dashed border-[color:var(--adm-border)] p-6 text-center text-sm text-[var(--adm-text-muted)]">
              هنوز تصویری اضافه نشده است.
            </div>
          ) : null}
        </div>
      </AdminField>
    </div>
  );
}
