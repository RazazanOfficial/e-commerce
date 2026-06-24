"use client";

//? 🔵 Required Modules

import { useEffect, useMemo, useState } from "react";
import apiClient from "@/common/apiClient";
import backApis from "@/common";
import { toast } from "react-toastify";
import Spinner from "@/components/Spinner";
import {
  ChevronDown,
  ChevronUp,
  FolderTree,
  Layers3,
  Plus,
  Search,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";

import { AdminBadge, AdminButton, AdminModal } from "@/components/admin-ui";
import { cn } from "@/lib/utils";
import {
  buildTree,
  CategoryFormPanel,
  ConfirmDeleteModal,
  Row,
} from "@/components/Admin-Panel/Categories/CategoryTree";

//* 🟢 Tree Stats Utilities
const getMaxDepth = (nodes, depth = 1) => {
  if (!nodes?.length) return 0;
  return Math.max(
    ...nodes.map((node) =>
      node.children?.length ? getMaxDepth(node.children, depth + 1) : depth,
    ),
  );
};

//* 🟢 Categories Page
export default function CategoriesPage() {
  //* 🟢 Page State
  const [raw, setRaw] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(new Set());
  const [qInput, setQInput] = useState("");
  const [q, setQ] = useState("");
  const [editCat, setEditCat] = useState(null);
  const [draftParent, setDraftParent] = useState(null);
  const [deleteCat, setDeleteCat] = useState(null);
  const [formOpen, setFormOpen] = useState(false);

  //* 🟢 Persisted Tree State
  useEffect(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem("cat_expanded_ids") || "[]",
      );
      setExpanded(new Set(saved));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        "cat_expanded_ids",
        JSON.stringify(Array.from(expanded)),
      );
    } catch {}
  }, [expanded]);

  //* 🟢 Category Data Fetch
  const fetchAll = async () => {
    try {
      setLoading(true);
      const { data } = await apiClient.get(backApis.getAllCategories.url);
      setRaw(data?.data || []);
    } catch {
      toast.error("خطا در دریافت دسته‌بندی‌ها");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setQ(qInput.trim()), 250);
    return () => clearTimeout(t);
  }, [qInput]);

  //* 🟢 Tree Derivations
  const tree = useMemo(() => buildTree(raw || []), [raw]);

  const idToNode = useMemo(() => {
    const map = new Map();
    (raw || []).forEach((c) => map.set(c._id, c));
    return map;
  }, [raw]);

  const stats = useMemo(() => {
    const list = raw || [];
    const active = list.filter((c) => c.isActive).length;
    const rootCount = list.filter((c) => !(c.parent?._id || c.parent)).length;
    return {
      total: list.length,
      active,
      inactive: list.length - active,
      roots: rootCount,
      children: Math.max(list.length - rootCount, 0),
    };
  }, [raw, tree]);

  const openPathAncestorIds = useMemo(() => {
    const set = new Set();
    expanded.forEach((id) => {
      let p = idToNode.get(id)?.parent?._id || idToNode.get(id)?.parent || null;
      while (p) {
        set.add(p);
        const pNode = idToNode.get(p);
        p = pNode?.parent?._id || pNode?.parent || null;
      }
    });
    return set;
  }, [expanded, idToNode]);

  //* 🟢 Search Highlight
  const highlight = (text, query) => {
    if (!query) return text;
    const source = text || "";
    const i = source.toLowerCase().indexOf(query.toLowerCase());
    if (i === -1) return text;
    return (
      <>
        {source.slice(0, i)}
        <mark className="rounded px-0.5 bg-[var(--adm-warning-soft)] text-[var(--adm-text)]">
          {source.slice(i, i + query.length)}
        </mark>
        {source.slice(i + query.length)}
      </>
    );
  };

  const filteredTree = useMemo(() => {
    if (!q) return tree;
    const normalizedQ = q.toLowerCase();
    const match = (n) =>
      n.name?.toLowerCase().includes(normalizedQ) ||
      n.slug?.toLowerCase().includes(normalizedQ) ||
      n.metaTitle?.toLowerCase().includes(normalizedQ);

    const dfs = (nodes) =>
      nodes
        .map((n) => {
          const children = dfs(n.children || []);
          if (match(n) || children.length) {
            return {
              ...n,
              _highlightedName: highlight(n.name, q),
              _highlightedSlug: highlight(n.slug, q),
              children,
            };
          }
          return null;
        })
        .filter(Boolean);
    return dfs(tree);
  }, [tree, q]);

  const toggleExpand = (id) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openAll = () => {
    const ids = new Set();
    const walk = (nodes) =>
      nodes.forEach((n) => {
        ids.add(n._id);
        walk(n.children || []);
      });
    walk(tree);
    setExpanded(ids);
  };

  const closeAll = () => setExpanded(new Set());

  const closeForm = () => {
    setFormOpen(false);
    setEditCat(null);
    setDraftParent(null);
  };

  const startCreate = (parent = null) => {
    setEditCat(null);
    setDraftParent(parent);
    setFormOpen(true);
  };

  const startEdit = (node) => {
    setDraftParent(null);
    setEditCat(node);
    setFormOpen(true);
  };

  //* 🟢 Mutation Actions
  const handleCreate = async (payload, helpers) => {
    try {
      await apiClient.post(backApis.createCategory.url, payload);
      toast.success("دسته‌بندی ایجاد شد");
      helpers?.resetCreateForm?.();
      closeForm();
      fetchAll();
    } catch (e) {
      toast.error(e?.response?.data?.message || "ایجاد ناموفق بود");
    }
  };

  const handleEdit = async (payload) => {
    try {
      const { id, ...rest } = payload;
      const allowed = [
        "name",
        "slug",
        "description",
        "image",
        "imageAlt",
        "isActive",
        "sortOrder",
        "parent",
        "keywords",
        "metaTitle",
        "metaDescription",
      ];

      const data = allowed.reduce((acc, k) => {
        const v = rest[k];
        if (v === undefined) return acc;
        acc[k] = v;
        return acc;
      }, {});

      const { url, method } = backApis.updateCategory(id);
      await apiClient({ url, method, data });

      toast.success("تغییرات دسته‌بندی ذخیره شد");
      closeForm();
      fetchAll();
    } catch (e) {
      toast.error(e?.response?.data?.message || "ویرایش ناموفق بود");
    }
  };

  const handleDelete = async () => {
    try {
      const { url, method } = backApis.deleteCategory(deleteCat._id);
      await apiClient({ url, method });
      toast.success("دسته‌بندی حذف شد");
      setDeleteCat(null);
      if (editCat?._id === deleteCat._id) closeForm();
      fetchAll();
    } catch (e) {
      toast.error(e?.response?.data?.message || "حذف ناموفق بود");
    }
  };

  const handleToggleActive = async (node) => {
    try {
      const { url, method } = backApis.updateCategory(node._id);
      await apiClient({
        url,
        method,
        data: { isActive: !node.isActive },
      });
      setRaw((prev) =>
        prev.map((c) =>
          c._id === node._id ? { ...c, isActive: !node.isActive } : c,
        ),
      );
    } catch {
      toast.error("تغییر وضعیت ناموفق بود");
    }
  };

  const move = async (node, dir) => {
    const siblings = (raw || [])
      .filter(
        (c) =>
          (c.parent?._id || c.parent || null) ===
          (node.parent?._id || node.parent || null),
      )
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    const idx = siblings.findIndex((s) => s._id === node._id);
    const target = dir === "up" ? siblings[idx - 1] : siblings[idx + 1];
    if (!target) return;
    try {
      const { url, method } = backApis.updateCategory(node._id);
      await apiClient({
        url,
        method,
        data: { sortOrder: target.sortOrder },
      });
      fetchAll();
    } catch {
      toast.error("جابجایی ترتیب ناموفق بود");
    }
  };

  const renderNode = (n, depth = 0) => {
    const open = expanded.has(n._id) || q.length > 0;
    return (
      <div key={n._id}>
        <Row
          node={n}
          depth={depth}
          expanded={open}
          onToggleExpand={toggleExpand}
          onAddChild={startCreate}
          onEdit={startEdit}
          onDelete={(node) => setDeleteCat(node)}
          onToggleActive={handleToggleActive}
          onMoveUp={(node) => move(node, "up")}
          onMoveDown={(node) => move(node, "down")}
          isAncestorHighlighted={openPathAncestorIds.has(n._id)}
        />
        {open && (n.children || []).map((c) => renderNode(c, depth + 1))}
      </div>
    );
  };

  return (
    <div
      className="mx-auto w-full max-w-[1500px] px-4 py-8"
      role="tree"
      aria-label="دسته‌ بندی‌ ها"
    >
      <div className="mb-6 overflow-hidden rounded-3xl border border-[color:var(--adm-border)] bg-[var(--adm-surface)] shadow-[0_20px_60px_var(--adm-shadow)]">
        <div className="bg-[var(--adm-surface-2)] p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[color:var(--adm-border)] bg-[var(--adm-surface)] px-3 py-1 text-xs font-semibold text-[var(--adm-text-muted)]">
                <FolderTree className="h-4 w-4" />
                مدیریت دسته‌ بندی‌ ها فروشگاه
              </div>
              <h1 className="text-2xl font-black text-[var(--adm-text)] md:text-3xl">
                دسته‌ بندی‌ ها
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <AdminButton
                variant="primary"
                onClick={() => startCreate(null)}
                leftIcon={Plus}
              >
                دسته جدید
              </AdminButton>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-px bg-[var(--adm-border)] md:grid-cols-5">
          <StatCard icon={Layers3} label="کل دسته‌ها" value={stats.total} />
          <StatCard
            icon={ShieldCheck}
            label="فعال"
            value={stats.active}
            variant="success"
          />
          <StatCard
            icon={SlidersHorizontal}
            label="غیرفعال"
            value={stats.inactive}
            variant="warning"
          />
          <StatCard icon={FolderTree} label="دسته‌های اصلی" value={stats.roots} />
          <StatCard icon={Plus} label="زیر‌دسته‌ها" value={stats.children} />
        </div>
      </div>

      <section className="min-w-0 overflow-hidden rounded-2xl border border-[color:var(--adm-border)] bg-[var(--adm-surface)] shadow-[0_20px_60px_var(--adm-shadow)]">
        <div className="border-b border-[color:var(--adm-border)] bg-[var(--adm-surface-2)] p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-bold text-[var(--adm-text)]">
                لیست درختی دسته‌ها
              </h2>
              <p className="mt-1 text-sm text-[var(--adm-text-muted)]">
                برای ساخت زیر‌دسته از دکمه + کنار هر ردیف استفاده کن.
              </p>
            </div>

            <div className="relative w-full lg:max-w-sm">
              <input
                value={qInput}
                onChange={(e) => setQInput(e.target.value)}
                placeholder="جستجو در نام، اسلاگ یا عنوان متا..."
                className="h-11 w-full rounded-2xl border border-[color:var(--adm-border)] bg-[var(--adm-surface)] py-2 pl-10 pr-4 text-right text-sm text-[var(--adm-text)] placeholder:text-[var(--adm-text-muted)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--adm-ring)]"
              />
              <Search className="absolute left-3 top-3.5 h-4 w-4 text-[var(--adm-text-muted)]" />
            </div>
          </div>
        </div>

        <div className="flex justify-between border-b border-[color:var(--adm-border)] bg-[var(--adm-surface)] px-4 py-3">
          <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--adm-text-muted)]">
            {q ? <AdminBadge variant="info">نتیجه برای: {q}</AdminBadge> : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <AdminButton
              variant="secondary"
              onClick={closeAll}
              leftIcon={ChevronUp}
            >
              بستن همه
            </AdminButton>
            <AdminButton
              variant="secondary"
              onClick={openAll}
              leftIcon={ChevronDown}
            >
              باز کردن همه
            </AdminButton>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Spinner inline />
          </div>
        ) : (
          <div>
            <div className="hidden grid-cols-[minmax(0,1fr)_92px_118px_132px] gap-3 border-b border-[color:var(--adm-border)] bg-[var(--adm-surface-2)] px-4 py-3 text-xs font-bold text-[var(--adm-text-muted)] xl:grid">
              <div>دسته‌بندی</div>
              <div className="text-center">ترتیب</div>
              <div className="text-center">وضعیت</div>
              <div className="text-center">عملیات</div>
            </div>

            <div
              className={cn(
                "min-h-72",
                filteredTree.length === 0 && "flex items-center justify-center",
              )}
            >
              {filteredTree.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--adm-surface-2)] text-[var(--adm-text-muted)]">
                    <Search className="h-6 w-6" />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-[var(--adm-text)]">
                    دسته‌ای یافت نشد
                  </p>
                  <p className="mt-1 text-xs text-[var(--adm-text-muted)]">
                    عبارت جستجو را تغییر بده یا یک دسته جدید بساز.
                  </p>
                </div>
              ) : (
                filteredTree.map((root) => renderNode(root, 0))
              )}
            </div>
          </div>
        )}
      </section>

      <ConfirmDeleteModal
        open={Boolean(deleteCat)}
        onClose={() => setDeleteCat(null)}
        onConfirm={handleDelete}
        category={deleteCat}
      />

      <AdminModal
        open={formOpen}
        onClose={closeForm}
        title={
          editCat
            ? "ویرایش دسته‌بندی"
            : draftParent
              ? "افزودن زیر‌دسته"
              : "افزودن دسته‌بندی"
        }
        description={
          editCat
            ? "اطلاعات دسته، تصویر و داده‌های SEO را ویرایش کن."
            : draftParent
              ? `زیر‌دسته جدید برای «${draftParent.name}» ایجاد می‌شود.`
              : "یک دسته جدید برای فروشگاه ایجاد کنید."
        }
        size="xl"
      >
        <CategoryFormPanel
          mode={editCat ? "edit" : "create"}
          variant="modal"
          initial={editCat || undefined}
          parentDraft={draftParent || undefined}
          allCategoriesTree={tree}
          onSubmit={editCat ? handleEdit : handleCreate}
          onCancelEdit={closeForm}
        />
      </AdminModal>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, variant = "neutral" }) {
  const tone = {
    neutral: "text-[var(--adm-text)]",
    success: "text-[var(--adm-success)]",
    warning: "text-[var(--adm-warning)]",
  }[variant];

  return (
    <div className="bg-[var(--adm-surface)] p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--adm-surface-2)] text-[var(--adm-text-muted)]">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs text-[var(--adm-text-muted)]">{label}</p>
          <p className={cn("mt-1 text-2xl font-black", tone)}>{value}</p>
        </div>
      </div>
    </div>
  );
}
