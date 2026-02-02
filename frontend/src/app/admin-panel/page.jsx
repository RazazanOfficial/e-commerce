"use client";
import { useContext, useEffect } from "react";
import { UserContext } from "@/context/UserContext";
import { notFound, useRouter } from "next/navigation";
import Link from "next/link";
import { Users, Tags, Package, Settings } from "lucide-react";

const page = () => {
  const { user } = useContext(UserContext);
  const router = useRouter();

  useEffect(() => {
    if (user === null) return;

    if (!user) {
      router.push("/auth");
    } else if (user.role !== "admin") {
      notFound();
    }
  }, [user]);

  if (!user || user.role !== "admin") return null;

  return (
    <div className="space-y-6">
      <div
        className="rounded-2xl p-5"
        style={{
          background: "var(--adm-surface)",
          border: "1px solid var(--adm-border)",
          boxShadow: "0 20px 60px var(--adm-shadow)",
        }}
      >
        <h1 className="text-2xl font-bold" style={{ color: "var(--adm-text)" }}>
          داشبورد مدیریت
        </h1>
        <p className="mt-1" style={{ color: "var(--adm-text-muted)" }}>
          مدیریت کاربران، محصولات و دسته‌بندی‌ها — همه چیز از اینجا.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
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
        ].map(({ href, title, desc, Icon }) => (
          <Link
            key={href}
            href={href}
            className="group rounded-2xl p-4 transition"
            style={{
              background: "var(--adm-surface)",
              border: "1px solid var(--adm-border)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--adm-surface-2)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "var(--adm-surface)")}
          >
            <div className="flex items-center gap-3">
              <div
                className="h-10 w-10 rounded-2xl flex items-center justify-center"
                style={{
                  background: "var(--adm-primary-soft)",
                  color: "var(--adm-primary)",
                }}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="font-semibold" style={{ color: "var(--adm-text)" }}>
                  {title}
                </div>
                <div className="text-sm" style={{ color: "var(--adm-text-muted)" }}>
                  {desc}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default page;
