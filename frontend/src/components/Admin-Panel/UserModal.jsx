"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowLeft, CalendarDays, CheckCircle2, Mail, MapPin, Phone, ShieldCheck, UserRound, XCircle } from "lucide-react";
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

const JALALI_DATE_FORMATTER = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
  year: "numeric",
  month: "long",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

const VIEW_ITEMS = [
  { label: "تاریخ ثبت‌نام", name: "createdAt", icon: CalendarDays, fallback: "ثبت نشده", type: "date" },
  { label: "شماره موبایل", name: "phone", icon: Phone, fallback: "ثبت نشده", verifiedBy: "phoneVerifiedAt", completeLabel: "تایید شده", incompleteLabel: "تایید نشده" },
  { label: "ایمیل", name: "email", icon: Mail, fallback: "ثبت نشده", verifiedBy: "emailVerifiedAt", completeLabel: "تایید شده", incompleteLabel: "تایید نشده" },
  { label: "استان", name: "province", icon: MapPin, fallback: "ثبت نشده" },
  { label: "شهر", name: "city", icon: MapPin, fallback: "ثبت نشده" },
  { label: "آدرس", name: "address", icon: MapPin, fallback: "ثبت نشده" },
  { label: "کد پستی", name: "postalCode", icon: MapPin, fallback: "ثبت نشده" },
];

const ROLE_OPTIONS = [
  { value: "user", label: "کاربر" },
  { value: "admin", label: "مدیر" },
];

const FIELD_LABELS = {
  firstName: "نام",
  lastName: "نام خانوادگی",
  name: "نام کامل",
  phone: "شماره موبایل",
  email: "ایمیل",
  province: "استان",
  city: "شهر",
  address: "آدرس",
  postalCode: "کد پستی",
  phoneVerifiedAt: "وضعیت تایید موبایل",
  emailVerifiedAt: "وضعیت تایید ایمیل",
  role: "نقش کاربر",
};

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
    phoneVerifiedAt: user.phoneVerifiedAt || "",
    emailVerifiedAt: user.emailVerifiedAt || "",
    createdAt: user.createdAt || "",
  };
}

function getRoleLabel(role) {
  return ROLE_OPTIONS.find((item) => item.value === role)?.label || "کاربر";
}

function formatJalaliDate(value) {
  if (!value) return "ثبت نشده";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "ثبت نشده";

  return JALALI_DATE_FORMATTER.format(date);
}

function formatValue(name, value) {
  if (name === "role") return getRoleLabel(value);
  if (name === "createdAt") return formatJalaliDate(value);
  if (name === "phoneVerifiedAt" || name === "emailVerifiedAt") {
    return value ? "تایید شده" : "تایید نشده";
  }
  return String(value || "").trim() || "خالی";
}

function getChangedFields(baseUser, nextUser) {
  const base = normalizeFormData(baseUser);

  return [...EDIT_FIELDS.map((item) => item.name), "phoneVerifiedAt", "emailVerifiedAt", "role"].reduce((acc, field) => {
    const before = String(base[field] || "").trim();
    const after = String(nextUser[field] || "").trim();

    if (before !== after) {
      acc.push({
        name: field,
        label: FIELD_LABELS[field] || field,
        before: formatValue(field, before),
        after: formatValue(field, after),
      });
    }

    return acc;
  }, []);
}

function isItemComplete(user, item) {
  const value = String(user?.[item.name] || "").trim();
  if (!value) return false;
  if (item.verifiedBy) return Boolean(user?.[item.verifiedBy]);
  return true;
}

function getItemValue(user, item) {
  if (item.type === "date") return formatJalaliDate(user?.[item.name]);
  return user?.[item.name] || item.fallback;
}

function RoleBadge({ role }) {
  const isAdmin = role === "admin";

  return (
    <span className={isAdmin ? "inline-flex items-center rounded-full bg-[var(--adm-error-soft)] px-3 py-1 text-xs font-black text-[var(--adm-error)] ring-1 ring-[var(--adm-border)]" : "inline-flex items-center rounded-full bg-[var(--adm-info-soft)] px-3 py-1 text-xs font-black text-[var(--adm-info)] ring-1 ring-[var(--adm-border)]"}>
      <ShieldCheck className="h-3.5 w-3.5" />
      <span className="mr-1">{isAdmin ? "مدیر" : "کاربر"}</span>
    </span>
  );
}

function DetailItem({ icon: Icon, label, value, completed, completeLabel, incompleteLabel }) {
  return (
    <div className={completed ? "rounded-2xl border border-[color:var(--adm-success)] bg-[var(--adm-success-soft)] p-3" : "rounded-2xl border border-[color:var(--adm-error)] bg-[var(--adm-error-soft)] p-3"}>
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className={completed ? "flex items-center gap-2 text-xs font-bold text-[var(--adm-success)]" : "flex items-center gap-2 text-xs font-bold text-[var(--adm-error)]"}>
          <Icon className="h-4 w-4" />
          {label}
        </div>
        <span className={completed ? "inline-flex items-center gap-1 rounded-full bg-[var(--adm-surface)] px-2 py-1 text-[11px] font-black text-[var(--adm-success)]" : "inline-flex items-center gap-1 rounded-full bg-[var(--adm-surface)] px-2 py-1 text-[11px] font-black text-[var(--adm-error)]"}>
          {completed ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
          {completed ? completeLabel : incompleteLabel}
        </span>
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
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingChanges, setPendingChanges] = useState([]);
  const [verificationConfirm, setVerificationConfirm] = useState(null);

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
    if (isEdit) return "اطلاعات کاربر را ویرایش کنید و قبل از ذخیره، تغییرات را تایید کنید.";
    if (isDelete) return "این عملیات قابل برگشت نیست.";
    return "وضعیت اطلاعات حساب کاربر.";
  }, [isDelete, isEdit]);

  useEffect(() => {
    if (!isOpen) return;
    setFormData(normalizeFormData(user));
    setIsWorking(false);
    setConfirmOpen(false);
    setPendingChanges([]);
    setVerificationConfirm(null);
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
      if (name === "phone" && value !== normalizeFormData(user).phone) {
        next.phoneVerifiedAt = "";
      }
      if (name === "email" && value !== normalizeFormData(user).email) {
        next.emailVerifiedAt = "";
      }
      return next;
    });
  };

  const requestVerificationConfirm = (field) => {
    const isPhone = field === "phone";
    const value = isPhone ? formData.phone : formData.email;

    if (!String(value || "").trim()) return;

    setVerificationConfirm({
      field,
      label: isPhone ? "شماره موبایل" : "ایمیل",
      value,
      targetField: isPhone ? "phoneVerifiedAt" : "emailVerifiedAt",
    });
  };

  const confirmVerification = () => {
    if (!verificationConfirm?.targetField) return;

    setFormData((prev) => ({
      ...prev,
      [verificationConfirm.targetField]: new Date().toISOString(),
    }));
    setVerificationConfirm(null);
  };

  const handleUpdate = () => {
    const changes = getChangedFields(user, formData);

    if (!changes.length) {
      onClose?.();
      return;
    }

    setPendingChanges(changes);
    setConfirmOpen(true);
  };

  const confirmUpdate = async () => {
    setIsWorking(true);
    try {
      await onUpdate?.(formData);
      setConfirmOpen(false);
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
    <>
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
                بررسی و ذخیره
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
                    {formData.phone || "شماره موبایل ثبت نشده"}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <RoleBadge role={formData.role} />
                <AdminBadge variant={user?.phoneVerifiedAt ? "success" : "warning"}>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {user?.phoneVerifiedAt ? "موبایل تایید شده" : "موبایل تایید نشده"}
                </AdminBadge>
              </div>
            </div>
          </div>

          {isView ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {VIEW_ITEMS.map((item) => {
                const completed = isItemComplete(user, item);
                return (
                  <DetailItem
                    key={item.name}
                    icon={item.icon}
                    label={item.label}
                    value={getItemValue(user, item)}
                    completed={completed}
                    completeLabel={item.completeLabel || "تکمیل شده"}
                    incompleteLabel={item.incompleteLabel || "تکمیل نشده"}
                  />
                );
              })}
            </div>
          ) : null}

          {isEdit ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {EDIT_FIELDS.map((field) => {
                const isPhone = field.name === "phone";
                const isEmail = field.name === "email";
                const verifiedAt = isPhone ? formData.phoneVerifiedAt : formData.emailVerifiedAt;
                const canVerify = (isPhone || isEmail) && String(formData[field.name] || "").trim() && !verifiedAt;

                return (
                  <AdminField key={field.name} label={field.label}>
                    <div className="space-y-2">
                      <AdminInput
                        type={field.type}
                        name={field.name}
                        value={formData[field.name] || ""}
                        onChange={handleChange}
                        variant="filled"
                        placeholder={field.placeholder}
                      />
                      {isPhone || isEmail ? (
                        <div className="flex items-center justify-between gap-2 rounded-2xl bg-[var(--adm-surface-2)] p-2">
                          <span className={verifiedAt ? "text-xs font-bold text-[var(--adm-success)]" : "text-xs font-bold text-[var(--adm-text-muted)]"}>
                            {verifiedAt ? `${field.label} تایید شده` : `${field.label} تایید نشده`}
                          </span>
                          <AdminButton
                            type="button"
                            size="sm"
                            variant={verifiedAt ? "secondary" : "primary"}
                            onClick={() => requestVerificationConfirm(field.name)}
                            disabled={!canVerify}
                            className="cursor-pointer"
                          >
                            {verifiedAt ? "تایید شده" : `تایید ${field.label}`}
                          </AdminButton>
                        </div>
                      ) : null}
                    </div>
                  </AdminField>
                );
              })}

              <AdminField label="نقش کاربر">
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
                    مطمئنی می‌خواهی این کاربر حذف شود؟ این کاربر برای همیشه حذف می‌شود.
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </AdminModal>

      <AdminModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="تایید تغییرات کاربر"
        size="md"
        description="قبل از ذخیره، تغییرات زیر را بررسی کن."
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <AdminButton variant="secondary" onClick={() => setConfirmOpen(false)} disabled={isWorking} className="cursor-pointer">
              برگشت به ویرایش
            </AdminButton>
            <AdminButton variant="primary" onClick={confirmUpdate} loading={isWorking} className="cursor-pointer">
              تایید نهایی و ذخیره
            </AdminButton>
          </div>
        }
      >
        <div className="space-y-3">
          {pendingChanges.map((change) => (
            <div key={change.name} className="rounded-2xl border border-[color:var(--adm-border)] bg-[var(--adm-surface-2)] p-3">
              <p className="mb-3 text-sm font-black text-[var(--adm-text)]">{change.label}</p>
              <div className="grid items-stretch gap-2 text-sm sm:grid-cols-[1fr_auto_1fr]">
                <div className="rounded-2xl border border-rose-100 bg-rose-50 p-3 text-rose-700">
                  <span className="mb-1 block text-xs font-black text-rose-500">قبل</span>
                  <span className="break-words font-bold">{change.before}</span>
                </div>
                <div className="flex items-center justify-center text-[var(--adm-text-muted)]">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-yellow-300/30 border-1 border-yellow-400">
                    <ArrowLeft className="h-6 w-6 text-yellow-400" />
                  </span>
                </div>
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-3 text-emerald-700">
                  <span className="mb-1 block text-xs font-black text-emerald-600">بعد</span>
                  <span className="break-words font-bold">{change.after}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </AdminModal>

      <AdminModal
        open={Boolean(verificationConfirm)}
        onClose={() => setVerificationConfirm(null)}
        title={`تایید ${verificationConfirm?.label || "اطلاعات تماس"}`}
        size="sm"
        description="این تایید به صورت دستی توسط مدیر ثبت می‌شود."
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <AdminButton variant="secondary" onClick={() => setVerificationConfirm(null)} className="cursor-pointer">
              انصراف
            </AdminButton>
            <AdminButton variant="primary" onClick={confirmVerification} className="cursor-pointer">
              بله، تایید شود
            </AdminButton>
          </div>
        }
      >
        <div className="rounded-3xl border border-[color:var(--adm-border)] bg-[var(--adm-surface-2)] p-4">
          <p className="text-sm leading-7 text-[var(--adm-text)]">
            مطمئنی می‌خواهی {verificationConfirm?.label} زیر را تایید کنی؟
          </p>
          <p dir="ltr" className="mt-3 rounded-2xl bg-[var(--adm-surface)] px-3 py-2 text-left text-sm font-black text-[var(--adm-text)]">
            {verificationConfirm?.value || "-"}
          </p>
        </div>
      </AdminModal>
    </>
  );
}
