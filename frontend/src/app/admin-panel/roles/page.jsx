"use client";

import { useContext, useEffect, useMemo, useState } from "react";
import { ShieldCheck, Trash2, RefreshCw } from "lucide-react";
import { toast } from "react-toastify";
import backApis from "@/common";
import apiClient from "@/common/apiClient";
import { UserContext } from "@/context/UserContext";
import {
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminCardContent,
  AdminCardDescription,
  AdminCardHeader,
  AdminCardTitle,
  AdminField,
  AdminIconButton,
  AdminInput,
  AdminTextarea,
} from "@/components/admin-ui";

const initialForm = {
  name: "",
  key: "",
  level: "",
  description: "",
};

const roleVariant = (role) => {
  if (role.key === "developer") return "warning";
  if (role.key === "owner") return "error";
  if (role.level >= 500) return "success";
  return "primary";
};

export default function AdminRolesPage() {
  const { user } = useContext(UserContext);
  const [roles, setRoles] = useState([]);
  const [formData, setFormData] = useState(initialForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const currentLevel = Number(user?.roleMeta?.level || 0);
  const isDeveloper = user?.role === "developer";

  const stats = useMemo(() => {
    const systemCount = roles.filter((role) => role.isSystem).length;
    const customCount = roles.length - systemCount;
    return { systemCount, customCount };
  }, [roles]);

  const loadRoles = async () => {
    setIsLoading(true);
    try {
      const { data } = await apiClient.get(backApis.adminRoles.url);
      setRoles(data?.data || []);
    } catch (error) {
      toast.error(error?.response?.data?.message || "خطا در دریافت نقش‌ها");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRoles();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSaving) return;

    setIsSaving(true);
    try {
      await apiClient.post(backApis.createAdminRole.url, {
        ...formData,
        level: Number(formData.level),
      });
      toast.success("نقش جدید ساخته شد");
      setFormData(initialForm);
      await loadRoles();
    } catch (error) {
      toast.error(error?.response?.data?.message || "خطا در ساخت نقش");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (role) => {
    if (!role?.canDelete) return;
    try {
      const { url, method } = backApis.deleteAdminRole(role._id);
      await apiClient({ url, method });
      toast.success("نقش حذف شد");
      await loadRoles();
    } catch (error) {
      toast.error(error?.response?.data?.message || "خطا در حذف نقش");
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-12 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--adm-text)]">
            مدیریت نقش‌ها
          </h1>
          <p className="mt-2 text-sm leading-7 text-[var(--adm-text-muted)]">
            نقش Developer مخفی و سیستمی است. نقش Owner فقط توسط Developer قابل تخصیص است.
          </p>
        </div>
        <AdminButton variant="secondary" onClick={loadRoles} leftIcon={RefreshCw} loading={isLoading}>
          بروزرسانی
        </AdminButton>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <AdminCard>
          <AdminCardContent className="p-5">
            <p className="text-sm text-[var(--adm-text-muted)]">سطح شما</p>
            <p className="mt-2 text-2xl font-bold text-[var(--adm-text)]">{currentLevel}</p>
          </AdminCardContent>
        </AdminCard>
        <AdminCard>
          <AdminCardContent className="p-5">
            <p className="text-sm text-[var(--adm-text-muted)]">نقش‌های سیستمی</p>
            <p className="mt-2 text-2xl font-bold text-[var(--adm-text)]">{stats.systemCount}</p>
          </AdminCardContent>
        </AdminCard>
        <AdminCard>
          <AdminCardContent className="p-5">
            <p className="text-sm text-[var(--adm-text-muted)]">نقش‌های سفارشی</p>
            <p className="mt-2 text-2xl font-bold text-[var(--adm-text)]">{stats.customCount}</p>
          </AdminCardContent>
        </AdminCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <AdminCard elevated>
          <AdminCardHeader>
            <AdminCardTitle>نقش‌های قابل مشاهده</AdminCardTitle>
            <AdminCardDescription>
              نقش‌های هم‌سطح یا بالاتر قابل تخصیص نیستند و در فرم کاربران غیرفعال می‌شوند.
            </AdminCardDescription>
          </AdminCardHeader>
          <AdminCardContent>
            {isLoading ? (
              <div className="py-12 text-center text-[var(--adm-text-muted)]">در حال دریافت نقش‌ها...</div>
            ) : (
              <div className="grid gap-3">
                {roles.map((role) => (
                  <div
                    key={role.key}
                    className="rounded-2xl border border-[color:var(--adm-border)] bg-[var(--adm-surface)] p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <ShieldCheck className="h-5 w-5 text-[var(--adm-primary)]" />
                          <h2 className="font-bold text-[var(--adm-text)]">{role.name}</h2>
                          <AdminBadge variant={roleVariant(role)}>{role.key}</AdminBadge>
                          {role.locked ? <AdminBadge variant="neutral">Locked</AdminBadge> : null}
                          {role.hidden ? <AdminBadge variant="warning">Hidden</AdminBadge> : null}
                        </div>
                        <p className="text-sm text-[var(--adm-text-muted)]">سطح دسترسی: {role.level}</p>
                        {role.description ? (
                          <p className="text-sm leading-7 text-[var(--adm-text-muted)]">{role.description}</p>
                        ) : null}
                        {!role.canAssign && role.disabledReason ? (
                          <p className="text-xs text-[var(--adm-warning)]">{role.disabledReason}</p>
                        ) : null}
                      </div>
                      <AdminIconButton
                        intent="danger"
                        label="حذف نقش"
                        disabled={!role.canDelete}
                        className={!role.canDelete ? "opacity-40 cursor-not-allowed" : ""}
                        onClick={() => handleDelete(role)}
                      >
                        <Trash2 className="h-5 w-5" />
                      </AdminIconButton>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </AdminCardContent>
        </AdminCard>

        <AdminCard>
          <AdminCardHeader>
            <AdminCardTitle>ساخت نقش جدید</AdminCardTitle>
            <AdminCardDescription>
              سطح نقش باید کمتر از سطح حساب شما باشد. برای Owner جدید باید Developer وارد شود.
            </AdminCardDescription>
          </AdminCardHeader>
          <AdminCardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <AdminField label="نام نقش" required>
                <AdminInput name="name" value={formData.name} onChange={handleChange} placeholder="Sub Owner" />
              </AdminField>
              <AdminField label="کلید نقش" hint="انگلیسی و یکتا">
                <AdminInput name="key" value={formData.key} onChange={handleChange} placeholder="sub-owner" dir="ltr" />
              </AdminField>
              <AdminField label="سطح دسترسی" required hint={`کمتر از ${currentLevel}`}>
                <AdminInput name="level" value={formData.level} onChange={handleChange} type="number" min="1" max={Math.max(1, currentLevel - 1)} />
              </AdminField>
              <AdminField label="توضیحات">
                <AdminTextarea name="description" value={formData.description} onChange={handleChange} placeholder="دسترسی این نقش را برای خودتان توضیح دهید" />
              </AdminField>

              {!isDeveloper ? (
                <div className="rounded-2xl border border-[color:var(--adm-border)] bg-[var(--adm-surface-2)] p-3 text-xs leading-6 text-[var(--adm-text-muted)]">
                  ساخت یا تخصیص Owner از این پنل برای شما غیرفعال است و باید توسط Developer انجام شود.
                </div>
              ) : null}

              <AdminButton type="submit" loading={isSaving} className="w-full">
                ساخت نقش
              </AdminButton>
            </form>
          </AdminCardContent>
        </AdminCard>
      </div>
    </div>
  );
}
