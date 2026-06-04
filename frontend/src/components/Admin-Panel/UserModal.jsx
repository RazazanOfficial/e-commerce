"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import {
  AdminButton,
  AdminField,
  AdminInput,
  AdminModal,
  AdminSelect,
} from "@/components/admin-ui";

const FIELDS = [
  { label: "نام", name: "name", type: "text" },
  { label: "ایمیل", name: "email", type: "email" },
  { label: "شماره موبایل", name: "phone", type: "tel" },
  { label: "آدرس", name: "address", type: "text" },
  { label: "کد پستی", name: "postalCode", type: "text" },
];

const fallbackRoles = [
  { key: "user", name: "User", canAssign: true },
  { key: "admin", name: "Admin", canAssign: false, disabledReason: "لیست نقش‌ها هنوز دریافت نشده است" },
  { key: "owner", name: "Owner", canAssign: false, disabledReason: "برای تخصیص Owner باید توسعه‌دهنده وارد پنل شود" },
];

const roleLabel = (role, roles = []) => {
  const item = roles.find((entry) => entry.key === role);
  if (item?.name) return item.name;
  if (role === "developer") return "Developer";
  if (role === "owner") return "Owner";
  if (role === "admin") return "Admin";
  return "User";
};

export default function UserModal({ isOpen, onClose, mode, user, roles = [], onUpdate, onDelete }) {
  const [formData, setFormData] = useState(user || {});
  const [countdown, setCountdown] = useState(5);

  const roleOptions = roles.length ? roles : fallbackRoles;
  const currentRoleIsMissing = formData.role && !roleOptions.some((role) => role.key === formData.role);

  const title = useMemo(() => {
    switch (mode) {
      case "edit":
        return "ویرایش اطلاعات کاربر";
      case "delete":
        return "حذف کاربر";
      default:
        return "نمایش اطلاعات کاربر";
    }
  }, [mode]);

  useEffect(() => {
    if (!isOpen) return;
    setFormData(user || {});
    setCountdown(5);
  }, [isOpen, user]);

  useEffect(() => {
    let timer;
    if (mode === "delete" && isOpen && countdown > 0) {
      timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown, mode, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdate = () => {
    onUpdate?.(formData);
    toast.success("تغییرات با موفقیت ذخیره شد", { position: "top-center" });
    onClose?.();
  };

  const handleDelete = () => {
    onDelete?.(user?._id || user?.id);
    toast.error("کاربر با موفقیت حذف شد", { position: "top-center" });
    onClose?.();
  };

  if (!isOpen || !user) return null;

  return (
    <AdminModal
      open={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      description={
        mode === "delete"
          ? "این عملیات قابل بازگشت نیست."
          : "اطلاعات کاربر را مشاهده یا ویرایش کنید."
      }
      footer={
        mode === "edit" ? (
          <div className="flex items-center justify-end gap-2">
            <AdminButton variant="secondary" onClick={onClose}>
              انصراف
            </AdminButton>
            <AdminButton variant="primary" onClick={handleUpdate}>
              ذخیره تغییرات
            </AdminButton>
          </div>
        ) : mode === "delete" ? (
          <div className="flex items-center justify-end gap-2">
            <AdminButton variant="secondary" onClick={onClose}>
              انصراف
            </AdminButton>
            <AdminButton
              variant="danger"
              onClick={handleDelete}
              disabled={countdown > 0}
            >
              {countdown > 0 ? `در حال آماده‌سازی... (${countdown})` : "تایید حذف"}
            </AdminButton>
          </div>
        ) : (
          <div className="flex items-center justify-end">
            <AdminButton variant="secondary" onClick={onClose}>
              بستن
            </AdminButton>
          </div>
        )
      }
    >
      {(mode === "view" || mode === "edit") && (
        <div className="space-y-4">
          {FIELDS.map((field) => (
            <AdminField key={field.name} label={field.label}>
              <AdminInput
                type={field.type}
                name={field.name}
                value={formData[field.name] || ""}
                onChange={handleChange}
                disabled={mode === "view"}
                variant="filled"
              />
            </AdminField>
          ))}
          <AdminField
            label="نقش کاربر"
            hint={mode === "edit" ? "نقش‌های غیرقابل تخصیص غیرفعال هستند" : undefined}
          >
            <AdminSelect
              name="role"
              value={formData.role || "user"}
              onChange={handleChange}
              disabled={mode === "view" || formData.role === "developer"}
            >
              {currentRoleIsMissing ? (
                <option value={formData.role}>{roleLabel(formData.role, roleOptions)}</option>
              ) : null}
              {roleOptions.map((role) => (
                <option key={role.key} value={role.key} disabled={!role.canAssign && formData.role !== role.key}>
                  {role.name || role.key}{!role.canAssign && formData.role !== role.key ? " — غیرفعال" : ""}
                </option>
              ))}
            </AdminSelect>
            {mode === "edit" ? (
              <div className="mt-2 space-y-1">
                {roleOptions
                  .filter((role) => !role.canAssign && role.disabledReason)
                  .map((role) => (
                    <p key={role.key} className="text-xs text-[var(--adm-text-muted)]">
                      {role.name}: {role.disabledReason}
                    </p>
                  ))}
              </div>
            ) : null}
          </AdminField>
        </div>
      )}

      {mode === "delete" && (
        <div className="space-y-3">
          <p className="text-sm leading-7 text-[var(--adm-text)]">
            آیا مطمئن هستید که می‌خواهید کاربر{" "}
            <span className="font-bold text-[var(--adm-error)]">{user?.name}</span>
            {" "}را حذف کنید؟
          </p>
          <p className="text-xs text-[var(--adm-text-muted)]">
            پس از حذف، دسترسی کاربر به پنل و داده‌های مرتبط ممکن است مختل شود.
          </p>
        </div>
      )}
    </AdminModal>
  );
}
