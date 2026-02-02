"use client";

import Link from "next/link";
import { Plus, Package } from "lucide-react";

export default function AllProductsPage() {
  return (
    <div className="space-y-6">
      <div
        className="rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
        style={{
          background: "var(--adm-surface)",
          border: "1px solid var(--adm-border)",
          boxShadow: "0 20px 60px var(--adm-shadow)",
        }}
      >
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--adm-text)" }}>
            محصولات
          </h1>
          <p className="mt-1" style={{ color: "var(--adm-text-muted)" }}>
            این صفحه فعلاً اسکلت UI دارد — وقتی صفحه CRUD محصولات را اضافه کنیم، همین استایل‌ها پایه می‌ماند.
          </p>
        </div>

        <Link
          href="#"
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl transition"
          style={{ background: "var(--adm-primary)", color: "var(--adm-on-primary)" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--adm-primary-hover)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "var(--adm-primary)")}
        >
          <Plus className="w-4 h-4" />
          افزودن محصول
        </Link>
      </div>

      <div
        className="rounded-2xl p-6"
        style={{ background: "var(--adm-surface)", border: "1px solid var(--adm-border)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="h-12 w-12 rounded-2xl flex items-center justify-center"
            style={{ background: "var(--adm-primary-soft)", color: "var(--adm-primary)" }}
          >
            <Package className="w-6 h-6" />
          </div>
          <div>
            <div className="font-semibold" style={{ color: "var(--adm-text)" }}>
              لیست محصولات
            </div>
            <div className="text-sm" style={{ color: "var(--adm-text-muted)" }}>
              به‌زودی: جدول محصولات، فیلترها، جستجو، صفحات ویرایش.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
