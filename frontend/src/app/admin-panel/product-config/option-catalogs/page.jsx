"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import Link from "next/link";
import { Plus, Search, Pencil, Trash2, ToggleLeft, ToggleRight, ArrowRight } from "lucide-react";
import backApis from "@/common/inedx";
import {
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminCardContent,
  AdminCardDescription,
  AdminCardHeader,
  AdminCardTitle,
  AdminConfirmDialog,
  AdminField,
  AdminInput,
  AdminSelect,
  AdminTable,
  AdminTableShell,
  AdminTD,
  AdminTH,
  AdminTHead,
  AdminTR,
} from "@/components/admin-ui";
import OptionCatalogEditorModal from "@/components/Admin-Panel/ProductConfig/OptionCatalogEditorModal";

const LIMIT = 50;

function safeGetItems(payload) {
  if (!payload) return { items: [], total: 0, page: 1, limit: LIMIT };
  // our api may return {page,limit,total,items} OR {data:{...}} in some cases
  if (Array.isArray(payload.items)) return payload;
  if (payload.data && Array.isArray(payload.data.items)) return payload.data;
  if (payload.data && Array.isArray(payload.data)) return { items: payload.data, total: payload.data.length, page: 1, limit: LIMIT };
  return { items: [], total: 0, page: 1, limit: LIMIT };
}

export default function OptionCatalogsPage() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);

  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  // filters
  const [qInput, setQInput] = useState("");
  const [q, setQ] = useState("");
  const [isActive, setIsActive] = useState("all");

  // editor
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorLoading, setEditorLoading] = useState(false);
  const [editing, setEditing] = useState(null);

  // delete confirm
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => setQ(qInput.trim()), 350);
    return () => clearTimeout(t);
  }, [qInput]);

  // reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [q, isActive]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const { url, method } = backApis.getOptionCatalogs;
      const params = {
        page,
        limit: LIMIT,
      };
      if (q) params.q = q;
      if (isActive !== "all") params.isActive = isActive;

      const res = await axios({
        url,
        method,
        params,
        withCredentials: true,
      });

      const data = safeGetItems(res.data);
      setItems(data.items || []);
      setTotal(Number(data.total || 0));
    } catch (e) {
      toast.error("دریافت لیست گزینه‌های محصول ناموفق بود");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, q, isActive]);

  const openCreate = () => {
    setEditing(null);
    setEditorOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setEditorOpen(true);
  };

  const handleSubmit = async (payload) => {
    setEditorLoading(true);
    try {
      if (editing?._id) {
        const { url, method } = backApis.updateOptionCatalog(editing._id);
        await axios({
          url,
          method,
          data: payload,
          withCredentials: true,
        });
        toast.success("گزینه محصول با موفقیت ویرایش شد");
      } else {
        const { url, method } = backApis.createOptionCatalog;
        await axios({
          url,
          method,
          data: payload,
          withCredentials: true,
        });
        toast.success("گزینه محصول با موفقیت ایجاد شد");
      }
      setEditorOpen(false);
      setEditing(null);
      fetchItems();
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        "عملیات ناموفق بود";
      toast.error(msg);
    } finally {
      setEditorLoading(false);
    }
  };

  const toggleActive = async (row) => {
    try {
      const { url, method } = backApis.toggleOptionCatalog(row._id);
      await axios({
        url,
        method,
        data: { isActive: !row.isActive },
        withCredentials: true,
      });
      toast.success(row.isActive ? "غیرفعال شد" : "فعال شد");
      fetchItems();
    } catch (e) {
      toast.error("تغییر وضعیت ناموفق بود");
    }
  };

  const askDelete = (row) => {
    setPendingDelete(row);
    setConfirmOpen(true);
  };

  const doDelete = async () => {
    if (!pendingDelete?._id) return;
    setConfirmLoading(true);
    try {
      const { url, method } = backApis.deleteOptionCatalog(pendingDelete._id);
      await axios({ url, method, withCredentials: true });
      toast.success("حذف شد");
      setConfirmOpen(false);
      setPendingDelete(null);
      fetchItems();
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        "حذف ناموفق بود (ممکن است در محصولات استفاده شده باشد)";
      toast.error(msg);
    } finally {
      setConfirmLoading(false);
    }
  };

  const pageCount = useMemo(() => Math.max(1, Math.ceil(total / LIMIT)), [total]);

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/admin-panel/product-config"
          className="inline-flex items-center gap-2 text-sm text-[var(--adm-text-muted)] hover:text-[var(--adm-text)]"
        >
          <ArrowRight size={16} />
          <span>بازگشت به پیکربندی محصول</span>
        </Link>

        <AdminButton leftIcon={Plus} onClick={openCreate}>
          ایجاد گزینه
        </AdminButton>
      </div>

      <AdminCard elevated>
        <AdminCardHeader>
          <AdminCardTitle>گزینه‌های محصول</AdminCardTitle>
          <AdminCardDescription>
            گزینه‌هایی مثل «رنگ»، «سایز» یا «حافظه داخلی» را تعریف کنید تا در ساخت تنوع‌ها (Variants) استفاده شوند.
          </AdminCardDescription>
        </AdminCardHeader>

        <AdminCardContent className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <AdminField label="جستجو" hint="نام یا کد">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--adm-text-muted)]" size={16} />
                <AdminInput
                  value={qInput}
                  onChange={(e) => setQInput(e.target.value)}
                  placeholder="مثلاً: رنگ یا color"
                  dir="rtl"
                  className="pr-9"
                />
              </div>
            </AdminField>

            <AdminField label="وضعیت">
              <AdminSelect value={isActive} onChange={(e) => setIsActive(e.target.value)}>
                <option value="all">همه</option>
                <option value="true">فقط فعال</option>
                <option value="false">فقط غیرفعال</option>
              </AdminSelect>
            </AdminField>

            <div className="flex items-end justify-end">
              <div className="text-sm text-[var(--adm-text-muted)]">
                مجموع: <span className="text-[var(--adm-text)] font-bold">{total}</span>
              </div>
            </div>
          </div>

          <AdminTableShell>
            <AdminTable>
              <AdminTHead>
                <AdminTR>
                  <AdminTH>نام</AdminTH>
                  <AdminTH>کد</AdminTH>
                  <AdminTH>مقادیر</AdminTH>
                  <AdminTH>وضعیت</AdminTH>
                  <AdminTH className="text-left">عملیات</AdminTH>
                </AdminTR>
              </AdminTHead>

              <tbody>
                {loading ? (
                  <AdminTR>
                    <AdminTD colSpan={5}>
                      <div className="py-6 text-center text-sm text-[var(--adm-text-muted)]">
                        در حال دریافت...
                      </div>
                    </AdminTD>
                  </AdminTR>
                ) : items.length === 0 ? (
                  <AdminTR>
                    <AdminTD colSpan={5}>
                      <div className="py-8 text-center text-sm text-[var(--adm-text-muted)]">
                        موردی پیدا نشد.
                      </div>
                    </AdminTD>
                  </AdminTR>
                ) : (
                  items.map((row) => (
                    <AdminTR key={row._id} interactive>
                      <AdminTD>
                        <div className="font-semibold text-[var(--adm-text)]">{row.name}</div>
                        {row.values?.length ? (
                          <div className="mt-1 text-xs text-[var(--adm-text-muted)] line-clamp-1">
                            {row.values.slice(0, 3).join("، ")}{row.values.length > 3 ? "…" : ""}
                          </div>
                        ) : (
                          <div className="mt-1 text-xs text-[var(--adm-text-muted)]">بدون مقدار</div>
                        )}
                      </AdminTD>

                      <AdminTD>
                        <code className="px-2 py-1 rounded-lg bg-[var(--adm-surface-2)] border border-[color:var(--adm-border)] text-xs" dir="ltr">
                          {row.code}
                        </code>
                      </AdminTD>

                      <AdminTD>
                        <span className="text-sm">{row.values?.length || 0}</span>
                      </AdminTD>

                      <AdminTD>
                        {row.isActive ? (
                          <AdminBadge variant="success">فعال</AdminBadge>
                        ) : (
                          <AdminBadge variant="neutral">غیرفعال</AdminBadge>
                        )}
                      </AdminTD>

                      <AdminTD className="text-left">
                        <div className="inline-flex items-center gap-2">
                          <AdminButton
                            size="sm"
                            variant="secondary"
                            leftIcon={Pencil}
                            onClick={() => openEdit(row)}
                          >
                            ویرایش
                          </AdminButton>

                          <AdminButton
                            size="sm"
                            variant="ghost"
                            leftIcon={row.isActive ? ToggleLeft : ToggleRight}
                            onClick={() => toggleActive(row)}
                          >
                            {row.isActive ? "غیرفعال" : "فعال"}
                          </AdminButton>

                          <AdminButton
                            size="sm"
                            variant="danger"
                            leftIcon={Trash2}
                            onClick={() => askDelete(row)}
                          >
                            حذف
                          </AdminButton>
                        </div>
                      </AdminTD>
                    </AdminTR>
                  ))
                )}
              </tbody>
            </AdminTable>
          </AdminTableShell>

          <div className="flex items-center justify-between gap-3">
            <div className="text-xs text-[var(--adm-text-muted)]">
              صفحه {page} از {pageCount}
            </div>
            <div className="flex items-center gap-2">
              <AdminButton
                variant="secondary"
                size="sm"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                قبلی
              </AdminButton>
              <AdminButton
                variant="secondary"
                size="sm"
                disabled={page >= pageCount || loading}
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              >
                بعدی
              </AdminButton>
            </div>
          </div>
        </AdminCardContent>
      </AdminCard>

      <OptionCatalogEditorModal
        open={editorOpen}
        onClose={() => {
          setEditorOpen(false);
          setEditing(null);
        }}
        initialValue={editing}
        onSubmit={handleSubmit}
        loading={editorLoading}
      />

      <AdminConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="حذف گزینه محصول"
        description={
          pendingDelete
            ? `آیا از حذف «${pendingDelete.name}» مطمئن هستید؟ اگر این گزینه در محصولات استفاده شده باشد، اجازه حذف داده نمی‌شود.`
            : "آیا مطمئن هستید؟"
        }
        confirmLabel="حذف"
        confirmVariant="danger"
        loading={confirmLoading}
        onConfirm={doDelete}
      />
    </div>
  );
}
