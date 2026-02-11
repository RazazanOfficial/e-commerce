"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminModal, AdminButton, AdminField, AdminInput, AdminTextarea, AdminSelect } from "@/components/admin-ui";

const CODE_RE = /^[a-z0-9-]+$/;

function toLinesArray(text) {
  const arr = (text || "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  // unique while preserving order
  const seen = new Set();
  const out = [];
  for (const v of arr) {
    if (!seen.has(v)) {
      seen.add(v);
      out.push(v);
    }
  }
  return out;
}

export default function OptionCatalogEditorModal({
  open,
  onClose,
  initialValue,
  onSubmit,
  loading = false,
}) {
  const isEdit = Boolean(initialValue?._id);

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [valuesText, setValuesText] = useState("");
  const [isActive, setIsActive] = useState("true");

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setName(initialValue?.name || "");
    setCode(initialValue?.code || "");
    setValuesText((initialValue?.values || []).join("\n"));
    setIsActive(String(initialValue?.isActive ?? true));
  }, [open, initialValue]);

  const values = useMemo(() => toLinesArray(valuesText), [valuesText]);

  const validate = () => {
    const next = {};
    if (!name.trim()) next.name = "نام گزینه اجباری است.";
    if (!code.trim()) next.code = "کد گزینه اجباری است.";
    else if (!CODE_RE.test(code.trim())) next.code = "کد باید فقط شامل حروف انگلیسی کوچک، عدد و خط تیره باشد.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    await onSubmit?.({
      name: name.trim(),
      code: code.trim(),
      values,
      isActive: isActive === "true",
    });
  };

  return (
    <AdminModal
      open={open}
      onClose={onClose}
      size="md"
      title={isEdit ? "ویرایش گزینه محصول" : "ایجاد گزینه محصول"}
      description="گزینه‌هایی مثل رنگ، سایز یا حافظه داخلی را تعریف کنید تا در ساخت تنوع‌ها (Variants) استفاده شوند."
      footer={
        <div className="flex items-center justify-end gap-2">
          <AdminButton variant="secondary" onClick={onClose} disabled={loading}>
            انصراف
          </AdminButton>
          <AdminButton onClick={handleSubmit} loading={loading}>
            {isEdit ? "ذخیره تغییرات" : "ایجاد"}
          </AdminButton>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AdminField label="نام گزینه" required error={errors.name} hint="مثلاً: رنگ">
            <AdminInput
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثلاً: رنگ"
              autoFocus
            />
          </AdminField>

          <AdminField
            label="کد گزینه"
            required
            error={errors.code}
            hint="فقط انگلیسی: color / size / storage"
          >
            <AdminInput
              value={code}
              onChange={(e) =>
                setCode(
                  e.target.value
                    .toLowerCase()
                    .replace(/\s+/g, "-")
                )
              }
              placeholder="مثلاً: color"
              dir="ltr"
              className="text-left"
            />
          </AdminField>
        </div>

        <AdminField
          label="وضعیت"
          hint="در حالت غیرفعال در ساخت گزینه‌های جدید نمایش داده نمی‌شود."
        >
          <AdminSelect value={isActive} onChange={(e) => setIsActive(e.target.value)}>
            <option value="true">فعال</option>
            <option value="false">غیرفعال</option>
          </AdminSelect>
        </AdminField>

        <AdminField
          label="مقادیر"
          hint="هر خط = یک مقدار (اختیاری). مثال: مشکی ↵ سفید ↵ آبی"
        >
          <AdminTextarea
            value={valuesText}
            onChange={(e) => setValuesText(e.target.value)}
            placeholder={"مشکی\nسفید\nآبی"}
          />
          {values.length ? (
            <div className="mt-2 text-xs text-[var(--adm-text-muted)]">
              تعداد مقادیر: <span className="text-[var(--adm-text)] font-semibold">{values.length}</span>
            </div>
          ) : null}
        </AdminField>
      </div>
    </AdminModal>
  );
}
