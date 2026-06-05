"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Mail, MapPin, Phone, ShieldCheck, UserRound } from "lucide-react";
import {
  AdminBadge,
  AdminButton,
  AdminField,
  AdminInput,
  AdminModal,
  AdminSelect,
} from "@/components/admin-ui";

const EDIT_FIELDS = [
  { label: "نام", name: "firstName", type: "text", placeholder: "مثلاً معراج" },
  { label: "نام خانوادگی", name: "lastName", type: "text", placeholder: "مثلاً رزازان" },
  { label: "شماره موبایل", name: "phone", type: "tel", placeholder: "09123456789" },
  { label: "ایمیل", name: "email", type: "email", placeholder: "example@email.com" },
  { label: "استان", name: "province", type: "text", placeholder: "تهران" },
  { label: "شهر", name: "city", type: "text", placeholder: "تهران" },
  { label: "آدرس", name: "address", type: "text", placeholder: "آدرس کامل" },
  { label: "کد پستی", name: "postalCode", type: "text", placeholder: "کد پستی" },
];

const VIEW_ITEMS = [
  { label: "شماره موبایل", name: "phone", icon: Phone },
  { label: "ایمیل", name: "email", icon: Mail, fallback: "ثبت نشده" },
  { label: "استان", name: "province", icon: MapPin, fallback: "ثبت نشده" },
  { label: "شهر", name: "city", icon: MapPin, fallback: "ثبت نشده" },
  { label: "آدرس", name: "address", icon: MapPin, fallback: "ثبت نشده" },
  { label: "کد پستی", name: "postalCode", icon: MapPin, fallback: "ثبت نشده" },
];

const ROLE_OPTIONS = [
  { value: "user", label: "کاربر" },
  { value: "admin", label: "مدیر" },
];

function getDisplayName(user) {
  const fullName = [user?.firstName, user?.lastName]
    .map((item) => String(item || "").trim())
    .filter(Boolean)
    .join(" ");

  return fullName || user?.name || "کاربر بدون نام";
}

function normalizeFormData(rawUser = {}) {
  const user = rawUser || {};
  const displayName = getDisplayName(user);
  const parts = String(displayName || "").split(/\s+/).filter(Boolean);

  return {
    _id: user._id || user.id,
    firstName: user.firstName || parts[0] || "",
    lastName: user.lastName || (parts.length > 1 ? parts.slice(1).join(" ") : ""),
    name: user.name || displayName,
    phone: user.phone || "",
    email: user.email || "",
    role: user.role === "admin" ? "admin" : "user",
    address: user.address || "",
    postalCode: user.postalCode || "",
    province: user.province || "",
    city: user.city || "",
  };
}

function DetailItem({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-[color:var(--adm-border)] bg-[var(--adm-surface-2)] p-3">
      <div className="mb-2 flex items-center gap-2 text-xs font-bold text-[var(--adm-text-muted)]">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <div className="break-words text-sm font-semibold text-[var(--adm-text)]">
        {value || "-"}
      </div>
    </div>
  );
}

export default function UserModal({ isOpen, onClose, mode, user, onUpdate, onDelete }) {
  const [formData, setFormData] = useState(normalizeFormData(user));
  const [isWorking, setIsWorking] = useState(false);

  const isView = mode === "view";
  const isEdit = mode === "edit";
  const isDelete = mode === "delete";
  const displayName = getDisplayName(user);

  const title = useMemo(() => {
    if (isEdit) return "ویرایش کاربر";
    if (isDelete) return "حذف کاربر";
    return "جزئیات کاربر";
  }, [isDelete, isEdit]);

  const description = useMemo(() => {
    if (isEdit) return "اطلاعات ضروری کاربر را با دقت بروزرسانی کنید.";
    if (isDelete) return "این عملیات کاربر را از سیستم حذف می‌کند.";
    return "نمای سریع اطلاعات حساب و وضعیت تکمیل پروفایل.";
  }, [isDelete, isEdit]);

  useEffect(() => {
    if (!isOpen) return;
    setFormData(normalizeFormData(user));
    setIsWorking(false);
  }, [isOpen, user]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      if (name === "firstName" || name === "lastName") {
        next.name = [next.firstName, next.lastName]
          .map((item) => String(item || "").trim())
          .filter(Boolean)
          .join(" ");
      }
      return next;
    });
  };

  const handleUpdate = async () => {
    setIsWorking(true);
    try {
      await onUpdate?.(formData);
    } finally {
      setIsWorking(false);
    }
  };

  const handleDelete = async () => {
    setIsWorking(true);
    try {
      await onDelete?.(user?._id || user?.id);
    } finally {
      setIsWorking(false);
    }
  };

  if (!isOpen || !user) return null;

  return (
    <AdminModal
      open={isOpen}
      onClose={onClose}
      title={title}
      size="lg"
      description={description}
      footer={
        isEdit ? (
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <AdminButton variant="secondary" onClick={onClose} disabled={isWorking} className="cursor-pointer">
              انصراف
            </AdminButton>
            <AdminButton variant="primary" onClick={handleUpdate} loading={isWorking} className="cursor-pointer">
              ذخیره تغییرات
            </AdminButton>
          </div>
        ) : isDelete ? (
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <AdminButton variant="secondary" onClick={onClose} disabled={isWorking} className="cursor-pointer">
              انصراف
            </AdminButton>
            <AdminButton variant="danger" onClick={handleDelete} loading={isWorking} className="cursor-pointer">
              حذف کاربر
            </AdminButton>
          </div>
        ) : (
          <div className="flex justify-end">
            <AdminButton variant="secondary" onClick={onClose} className="cursor-pointer">
              بستن
            </AdminButton>
          </div>
        )
      }
    >
      <div className="space-y-5">
        <div className="rounded-3xl border border-[color:var(--adm-border)] bg-[var(--adm-surface-2)] p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--adm-primary-soft)] text-[var(--adm-primary)]">
                <UserRound className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <h3 className="truncate text-lg font-black text-[var(--adm-text)]" title={displayName}>
                  {displayName}
                </h3>
                <p className="mt-1 text-xs text-[var(--adm-text-muted)]">
                  شناسه: {String(user?._id || user?.id || "-").slice(-10)}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <AdminBadge variant={formData.role === "admin" ? "primary" : "neutral"}>
                <ShieldCheck className="h-3.5 w-3.5" />
                {formData.role === "admin" ? "مدیر" : "کاربر"}
              </AdminBadge>
              <AdminBadge variant={user?.phoneVerifiedAt ? "success" : "warning"}>
                <CheckCircle2 className="h-3.5 w-3.5" />
                {user?.phoneVerifiedAt ? "موبایل تایید شده" : "موبایل تایید نشده"}
              </AdminBadge>
            </div>
          </div>
        </div>

        {isView ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {VIEW_ITEMS.map((item) => (
              <DetailItem
                key={item.name}
                icon={item.icon}
                label={item.label}
                value={user?.[item.name] || item.fallback}
              />
            ))}
          </div>
        ) : null}

        {isEdit ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {EDIT_FIELDS.map((field) => (
              <AdminField key={field.name} label={field.label}>
                <AdminInput
                  type={field.type}
                  name={field.name}
                  value={formData[field.name] || ""}
                  onChange={handleChange}
                  variant="filled"
                  placeholder={field.placeholder}
                />
              </AdminField>
            ))}

            <AdminField label="نقش کاربر" hint="فعلاً فقط نقش‌های پایه فعال هستند">
              <AdminSelect name="role" value={formData.role || "user"} onChange={handleChange} variant="filled">
                {ROLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </AdminSelect>
            </AdminField>
          </div>
        ) : null}

        {isDelete ? (
          <div className="rounded-3xl border border-[color:var(--adm-error)] bg-[var(--adm-error-soft)] p-4">
            <div className="flex gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--adm-surface)] text-[var(--adm-error)]">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-black text-[var(--adm-text)]">حذف {displayName}</h4>
                <p className="mt-2 text-sm leading-7 text-[var(--adm-text)]">
                  با حذف این کاربر، دسترسی او به حساب کاربری و پنل قطع می‌شود. قبل از تایید، مطمئن شوید این عملیات لازم است.
                </p>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </AdminModal>
  );
}
