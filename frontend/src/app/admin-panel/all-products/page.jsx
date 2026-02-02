"use client";

import Link from "next/link";
import { Plus, Package } from "lucide-react";
import {
  AdminCard,
  AdminCardContent,
  AdminCardDescription,
  AdminCardTitle,
} from "@/components/admin-ui";

export default function AllProductsPage() {
  return (
    <div className="space-y-6">
      <AdminCard elevated>
        <AdminCardContent className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <AdminCardTitle className="text-2xl">محصولات</AdminCardTitle>
            <AdminCardDescription>
              این صفحه فعلاً اسکلت UI دارد — وقتی صفحه CRUD محصولات را اضافه کنیم، همین استایل‌ها پایه می‌ماند.
            </AdminCardDescription>
          </div>

          <Link
            href="#"
            className="inline-flex items-center gap-2 h-10 px-4 rounded-xl font-semibold bg-[var(--adm-primary)] text-[var(--adm-on-primary)] hover:bg-[var(--adm-primary-hover)] transition"
          >
            <Plus className="w-4 h-4" />
            افزودن محصول
          </Link>
        </AdminCardContent>
      </AdminCard>

      <AdminCard>
        <AdminCardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl flex items-center justify-center bg-[var(--adm-primary-soft)] text-[var(--adm-primary)]">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <div className="font-semibold text-[var(--adm-text)]">لیست محصولات</div>
              <div className="text-sm text-[var(--adm-text-muted)]">
                به‌زودی: جدول محصولات، فیلترها، جستجو، صفحات ویرایش.
              </div>
            </div>
          </div>
        </AdminCardContent>
      </AdminCard>
    </div>
  );
}
