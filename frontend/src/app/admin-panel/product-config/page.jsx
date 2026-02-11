"use client";

import Link from "next/link";
import { Settings2, ListChecks } from "lucide-react";
import {
  AdminCard,
  AdminCardHeader,
  AdminCardTitle,
  AdminCardDescription,
  AdminCardContent,
  AdminButton,
} from "@/components/admin-ui";

export default function ProductConfigPage() {
  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <AdminCard elevated>
        <AdminCardHeader>
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-[var(--adm-primary-soft)] text-[var(--adm-primary)] flex items-center justify-center">
              <Settings2 size={18} />
            </span>
            <div>
              <AdminCardTitle>پیکربندی محصول</AdminCardTitle>
              <AdminCardDescription>
                تنظیمات زیرساختی برای ساخت گزینه‌ها و تنوع‌های محصولات (Variants).
              </AdminCardDescription>
            </div>
          </div>
        </AdminCardHeader>

        <AdminCardContent className="p-5">
          <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            <Link href="/admin-panel/product-config/option-catalogs" className="block">
              <div className="h-full rounded-2xl border border-[color:var(--adm-border)] bg-[var(--adm-surface)] hover:bg-[var(--adm-surface-2)] transition-colors p-4">
                <div className="flex items-start gap-3">
                  <span className="w-10 h-10 rounded-2xl bg-[var(--adm-info-soft)] text-[var(--adm-info)] flex items-center justify-center">
                    <ListChecks size={18} />
                  </span>
                  <div className="min-w-0">
                    <div className="font-bold text-[var(--adm-text)]">گزینه‌های محصول</div>
                    <div className="mt-1 text-sm text-[var(--adm-text-muted)]">
                      تعریف گزینه‌ها (مثل رنگ/سایز/حافظه) برای استفاده در ساخت Variants.
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <AdminButton variant="secondary" size="sm">
                    مدیریت
                  </AdminButton>
                </div>
              </div>
            </Link>

            <div className="h-full rounded-2xl border border-[color:var(--adm-border)] bg-[var(--adm-surface)] p-4 opacity-70">
              <div className="font-bold text-[var(--adm-text)]">ویژگی‌ها (به‌زودی)</div>
              <div className="mt-1 text-sm text-[var(--adm-text-muted)]">
                قالب‌های ویژگی‌های فنی برای صفحات محصول (مثلاً مشخصات نمایشگر/باتری).
              </div>
            </div>

            <div className="h-full rounded-2xl border border-[color:var(--adm-border)] bg-[var(--adm-surface)] p-4 opacity-70">
              <div className="font-bold text-[var(--adm-text)]">برندها (به‌زودی)</div>
              <div className="mt-1 text-sm text-[var(--adm-text-muted)]">
                مدیریت برندها برای فیلتر، سئو و نمایش در کارت محصول.
              </div>
            </div>
          </div>
        </AdminCardContent>
      </AdminCard>
    </div>
  );
}
