"use client";

import { useContext, useEffect } from "react";
import { UserContext } from "@/context/UserContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Users, Tags, Package, Settings } from "lucide-react";
import {
  AdminCard,
  AdminCardContent,
  AdminCardDescription,
  AdminCardTitle,
} from "@/components/admin-ui";

const ADMIN_ROLES = new Set(["admin", "developer"]);

export default function AdminPanelHome() {
  const { user, isAuthResolved } = useContext(UserContext);
  const router = useRouter();
  const isAdmin = ADMIN_ROLES.has(user?.role);

  useEffect(() => {
    if (!isAuthResolved) return;

    if (!user) {
      router.replace("/auth");
      return;
    }

    if (!isAdmin) {
      router.replace("/");
    }
  }, [isAuthResolved, isAdmin, router, user]);

  if (!isAuthResolved || !user || !isAdmin) return null;

  const cards = [
    {
      href: "/admin-panel/all-users",
      title: "کاربران",
      desc: "لیست، جستجو و مدیریت",
      Icon: Users,
    },
    {
      href: "/admin-panel/all-products",
      title: "محصولات",
      desc: "ثبت و به‌روزرسانی",
      Icon: Package,
    },
    {
      href: "/admin-panel/categories",
      title: "دسته‌بندی‌ها",
      desc: "ساختار درختی و ترتیب",
      Icon: Tags,
    },
    {
      href: "/admin-panel/settings",
      title: "تنظیمات",
      desc: "تم، ظاهر و ترجیحات",
      Icon: Settings,
    },
  ];

  return (
    <div className="space-y-6">
      <AdminCard elevated>
        <AdminCardContent className="p-5">
          <AdminCardTitle className="text-2xl">داشبورد مدیریت</AdminCardTitle>
          <AdminCardDescription>
            مدیریت کاربران، محصولات و دسته‌بندی‌ها — همه چیز از اینجا.
          </AdminCardDescription>
        </AdminCardContent>
      </AdminCard>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ href, title, desc, Icon }) => (
          <Link
            key={href}
            href={href}
            className="group rounded-2xl border border-[color:var(--adm-border)] bg-[var(--adm-surface)] hover:bg-[var(--adm-surface-2)] transition p-4"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl flex items-center justify-center bg-[var(--adm-primary-soft)] text-[var(--adm-primary)]">
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-[var(--adm-text)]">{title}</div>
                <div className="text-sm text-[var(--adm-text-muted)]">{desc}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
