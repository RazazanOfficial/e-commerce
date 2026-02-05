"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { Plus, Search, ArrowLeft, ArrowRight } from "lucide-react";
import backApis from "@/common/inedx";
import {
  AdminButton,
  AdminCard,
  AdminCardContent,
  AdminCardDescription,
  AdminCardHeader,
  AdminCardTitle,
  AdminConfirmDialog,
  AdminInput,
  AdminSelect,
} from "@/components/admin-ui";
import ProductCard from "@/components/Admin-Panel/Products/ProductCard";
import ProductEditorModal from "@/components/Admin-Panel/Products/ProductEditorModal";
import ProductViewModal from "@/components/Admin-Panel/Products/ProductViewModal";

const LIMIT = 20;

export default function AllProductsPage() {
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  // Filters
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [visible, setVisible] = useState("");
  const [categoryId, setCategoryId] = useState("");

  // Modals
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState("create");
  const [editorId, setEditorId] = useState(null);

  const [viewOpen, setViewOpen] = useState(false);
  const [viewId, setViewId] = useState(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // archive | restore | hard
  const [confirmProduct, setConfirmProduct] = useState(null);

  const totalPages = useMemo(() => {
    const t = Number(total) || 0;
    return Math.max(1, Math.ceil(t / LIMIT));
  }, [total]);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Fetch categories (for filter + editor select)
  useEffect(() => {
    (async () => {
      try {
        setCategoriesLoading(true);
        const { url } = backApis.getAllCategories;
        const res = await axios.get(url, { withCredentials: true });
        setCategories(Array.isArray(res?.data?.data) ? res.data.data : []);
      } catch (err) {
        console.error(err);
        toast.error("خطا در دریافت دسته‌بندی‌ها");
      } finally {
        setCategoriesLoading(false);
      }
    })();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { url } = backApis.getAllProducts;
      const params = {
        page,
        limit: LIMIT,
        ...(status ? { status } : {}),
        ...(visible ? { visible } : {}),
        ...(categoryId ? { categoryId } : {}),
        ...(search ? { search } : {}),
      };

      const res = await axios.get(url, {
        params,
        withCredentials: true,
      });

      const data = res?.data?.data;
      const items = data?.items || [];
      setProducts(Array.isArray(items) ? items : []);
      setTotal(Number(data?.total) || 0);
    } catch (err) {
      console.error(err);
      toast.error("خطا در دریافت لیست محصولات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, status, visible, categoryId, search]);

  const openCreate = () => {
    setEditorMode("create");
    setEditorId(null);
    setEditorOpen(true);
  };

  const openEdit = (p) => {
    setEditorMode("edit");
    setEditorId(p?._id);
    setEditorOpen(true);
  };

  const openView = (p) => {
    setViewId(p?._id);
    setViewOpen(true);
  };

  const askConfirm = (action, product) => {
    setConfirmAction(action);
    setConfirmProduct(product);
    setConfirmOpen(true);
  };

  const doConfirm = async () => {
    const p = confirmProduct;
    const id = p?._id;
    if (!id) return;

    try {
      setConfirmLoading(true);

      if (confirmAction === "archive") {
        const { url, method } = backApis.archiveProduct(id);
        await axios({ method, url, withCredentials: true });
        toast.success("محصول آرشیو شد");
      }

      if (confirmAction === "restore") {
        const { url, method } = backApis.restoreProduct(id);
        await axios({ method, url, withCredentials: true });
        toast.success("محصول بازگردانی شد");
      }

      if (confirmAction === "hard") {
        const { url, method } = backApis.deleteProductHard(id);
        await axios({ method, url, withCredentials: true });
        toast.success("محصول حذف شد");
      }

      setConfirmOpen(false);
      setConfirmAction(null);
      setConfirmProduct(null);
      fetchProducts();
    } catch (err) {
      console.error(err);
      const msg = err?.response?.data?.message;
      toast.error(msg || "خطا در انجام عملیات");
    } finally {
      setConfirmLoading(false);
    }
  };

  const paginationPages = useMemo(() => {
    const tp = totalPages || 1;
    const cap = Math.min(5, tp);
    return Array.from({ length: cap }).map((_, idx) => {
      const pageNum =
        page <= 3
          ? idx + 1
          : page >= tp - 2
          ? tp - 4 + idx
          : page - 2 + idx;
      return pageNum;
    });
  }, [page, totalPages]);

  return (
    <div className="space-y-6">
      <AdminCard elevated>
        <AdminCardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <AdminCardTitle className="text-2xl">محصولات</AdminCardTitle>
              <AdminCardDescription>
                مدیریت محصولات با یک تجربه روان (کارت‌ها + فیلترها + مودال تب‌بندی‌شده)
              </AdminCardDescription>
            </div>

            <AdminButton leftIcon={Plus} onClick={openCreate}>
              افزودن محصول
            </AdminButton>
          </div>
        </AdminCardHeader>

        <AdminCardContent className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="lg:col-span-2 relative">
              <AdminInput
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="جستجو در محصولات…"
                className="pl-11"
              />
              <div className="absolute left-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-xl text-[var(--adm-text-muted)] flex items-center justify-center">
                <Search className="h-5 w-5" />
              </div>
            </div>

            <AdminSelect
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="">همه وضعیت‌ها</option>
              <option value="DRAFT">پیش‌نویس</option>
              <option value="ACTIVE">فعال</option>
              <option value="ARCHIVED">آرشیو</option>
            </AdminSelect>

            <AdminSelect
              value={visible}
              onChange={(e) => {
                setVisible(e.target.value);
                setPage(1);
              }}
            >
              <option value="">نمایش/مخفی</option>
              <option value="true">نمایش</option>
              <option value="false">مخفی</option>
            </AdminSelect>

            <AdminSelect
              value={categoryId}
              disabled={categoriesLoading}
              onChange={(e) => {
                setCategoryId(e.target.value);
                setPage(1);
              }}
            >
              <option value="">همه دسته‌ها</option>
              {categories
                .slice()
                .sort((a, b) => String(a?.name || "").localeCompare(String(b?.name || ""), "fa"))
                .map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
            </AdminSelect>
          </div>
        </AdminCardContent>
      </AdminCard>

      <div className="relative">
        {loading ? (
          <div
            className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl"
            style={{ background: "var(--adm-overlay)" }}
          >
            <div
              className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: "var(--adm-primary)", borderTopColor: "transparent" }}
              aria-label="loading"
            />
          </div>
        ) : null}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {products.map((p) => (
            <ProductCard
              key={p._id}
              product={p}
              onView={openView}
              onEdit={openEdit}
              onArchive={(prod) => askConfirm("archive", prod)}
              onRestore={(prod) => askConfirm("restore", prod)}
              onHardDelete={(prod) => askConfirm("hard", prod)}
            />
          ))}

          {!loading && products.length === 0 ? (
            <AdminCard className="col-span-full">
              <AdminCardContent className="p-8 text-center">
                <div className="text-[var(--adm-text)] font-semibold">محصولی یافت نشد</div>
                <div className="mt-2 text-sm text-[var(--adm-text-muted)]">
                  فیلترها را تغییر دهید یا یک محصول جدید بسازید.
                </div>
                <div className="mt-4 flex items-center justify-center">
                  <AdminButton leftIcon={Plus} onClick={openCreate}>
                    افزودن محصول
                  </AdminButton>
                </div>
              </AdminCardContent>
            </AdminCard>
          ) : null}
        </div>
      </div>

      <AdminCard>
        <AdminCardContent className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="text-sm text-[var(--adm-text-muted)]">
            صفحه {page} از {totalPages} — مجموع: {total}
          </div>

          <div className="flex items-center gap-2 justify-end">
            <AdminButton
              variant="secondary"
              size="sm"
              leftIcon={ArrowRight}
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              قبلی
            </AdminButton>

            {paginationPages.map((pnum) => (
              <button
                key={pnum}
                type="button"
                onClick={() => setPage(pnum)}
                className={
                  "h-9 min-w-9 px-3 rounded-xl text-sm font-semibold border transition " +
                  (pnum === page
                    ? "bg-[var(--adm-primary)] text-[var(--adm-on-primary)] border-[color:var(--adm-primary)]"
                    : "bg-[var(--adm-surface)] text-[var(--adm-text)] border-[color:var(--adm-border)] hover:bg-[var(--adm-surface-2)]")
                }
              >
                {pnum}
              </button>
            ))}

            <AdminButton
              variant="secondary"
              size="sm"
              rightIcon={ArrowLeft}
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              بعدی
            </AdminButton>
          </div>
        </AdminCardContent>
      </AdminCard>

      <ProductEditorModal
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        mode={editorMode}
        productId={editorId}
        categories={categories}
        onSaved={() => fetchProducts()}
      />

      <ProductViewModal
        open={viewOpen}
        onClose={() => setViewOpen(false)}
        productId={viewId}
      />

      <AdminConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title={
          confirmAction === "restore"
            ? "بازگردانی محصول"
            : confirmAction === "archive"
            ? "آرشیو محصول"
            : "حذف دائمی محصول"
        }
        description={
          confirmAction === "restore"
            ? "این محصول از حالت آرشیو خارج می‌شود."
            : confirmAction === "archive"
            ? "این محصول از لیست اصلی خارج و آرشیو می‌شود."
            : "این عملیات غیرقابل بازگشت است."
        }
        confirmLabel={
          confirmAction === "restore"
            ? "بازگردانی"
            : confirmAction === "archive"
            ? "آرشیو"
            : "حذف دائمی"
        }
        confirmVariant={confirmAction === "restore" ? "success" : "danger"}
        loading={confirmLoading}
        onConfirm={doConfirm}
      />
    </div>
  );
}
