"use client";

//? 🔵 Required Modules

import { useEffect, useMemo, useState } from "react";
import apiClient from "@/common/apiClient";
import backApis from "@/common";
import { toast } from "react-toastify";
import Spinner from "@/components/Spinner";
import { MoreVertical, Plus, Search } from "lucide-react";

import { AdminButton, AdminInput } from "@/components/admin-ui";
import { buildTree, CategoryFormModal, ConfirmDeleteModal, Row } from "@/components/Admin-Panel/Categories/CategoryTree";

//* 🟢 Categories Page
export default function CategoriesPage() {
  //* 🟢 Page State
  const [raw, setRaw] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(new Set());
  const [qInput, setQInput] = useState("");
  const [q, setQ] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editCat, setEditCat] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteCat, setDeleteCat] = useState(null);

  //* 🟢 Persisted Tree State
  useEffect(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem("cat_expanded_ids") || "[]"
      );
      setExpanded(new Set(saved));
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(
        "cat_expanded_ids",
        JSON.stringify(Array.from(expanded))
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
      toast.error("خطا در دریافت دسته‌ها");
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
  const highlight = (text, q) => {
    if (!q) return text;
    const i = text?.toLowerCase?.().indexOf(q.toLowerCase());
    if (i === -1) return text;
    return (
      <>
        {text.slice(0, i)}
        <mark
          className="rounded px-0.5"
          style={{ background: "var(--adm-warning-soft)" }}
        >
          {text.slice(i, i + q.length)}
        </mark>
        {text.slice(i + q.length)}
      </>
    );
  };

  const filteredTree = useMemo(() => {
    if (!q) return tree;
    const match = (n) =>
      n.name?.toLowerCase().includes(q.toLowerCase()) ||
      n.slug?.toLowerCase().includes(q.toLowerCase());
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

  //* 🟢 Mutation Actions
  const handleCreate = async (payload) => {
    try {
      await apiClient.post(backApis.createCategory.url, payload);
      toast.success("دسته‌بندی ایجاد شد");
      setCreateOpen(false);
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
        if (v === undefined || v === null) return acc;
        if (typeof v === "string" && v.trim() === "") return acc;
        acc[k] = v;
        return acc;
      }, {});

      const { url, method } = backApis.updateCategory(id);
      await apiClient({ url, method, data });

      toast.success("تغییرات ذخیره شد");
      setEditCat(null);
      fetchAll();
    } catch (e) {
      toast.error(e?.response?.data?.message || "ویرایش ناموفق بود");
    }
  };

  const openEdit = async (node) => {
    setEditCat({ ...node, _loading: true });
    setEditLoading(true);
    try {
      const { url } = backApis.updateCategory(node._id);
      const { data } = await apiClient.get(url);
      setEditCat(data?.data || node);
    } catch (e) {
      toast.error(e?.response?.data?.message || "خطا در دریافت جزییات دسته");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      const { url, method } = backApis.deleteCategory(deleteCat._id);
      await apiClient({ url, method });
      toast.success("دسته حذف شد");
      setDeleteCat(null);
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
          c._id === node._id ? { ...c, isActive: !node.isActive } : c
        )
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
          (node.parent?._id || node.parent || null)
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
          onAddChild={(node) => setCreateOpen({ parent: node })}
          onEdit={(node) => setEditCat(node)}
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
    <div className="py-8" role="tree" aria-label="مدیریت دسته‌ها">
      <div className="mb-6 flex flex-col lg:flex-row items-center justify-between gap-4 md:w-full w-[95vw] mx-auto">
        <div className="w-full">
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: "var(--adm-surface)",
              border: "1px solid var(--adm-border)",
              boxShadow: "0 20px 60px var(--adm-shadow)",
            }}
          >
            <div
              className="p-5"
              style={{
                background: "var(--adm-surface-2)",
                borderBottom: "1px solid var(--adm-border)",
              }}
            >
              <h1 className="text-2xl font-bold" style={{ color: "var(--adm-text)" }}>
                مدیریت دسته‌بندی‌ها
              </h1>
              <p className="mt-1" style={{ color: "var(--adm-text-muted)" }}>
                ایجاد، ویرایش و سازمان‌دهی دسته‌ها به‌صورت درختی
              </p>
            </div>

            <div className="p-4 flex flex-col md:flex-row items-stretch md:items-center gap-3 md:gap-4">
              <div className="relative flex-1">
                <input
                  value={qInput}
                  onChange={(e) => setQInput(e.target.value)}
                  placeholder="جستجو بر اساس نام/اسلاگ..."
                  className="w-full pl-10 pr-3 py-2 rounded-xl border focus:outline-none focus:ring-2"
                  style={{
                    background: "var(--adm-surface-2)",
                    borderColor: "var(--adm-border)",
                    color: "var(--adm-text)",
                    boxShadow: "none",
                  }}
                  onFocus={(e) => (e.currentTarget.style.boxShadow = "0 0 0 3px var(--adm-ring)")}
                  onBlur={(e) => (e.currentTarget.style.boxShadow = "none")}
                />
                <Search
                  className="w-4 h-4 absolute left-2.5 top-2.5"
                  style={{ color: "var(--adm-text-muted)" }}
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={openAll}
                  className="px-2 py-1 sm:px-3 sm:py-2 rounded-xl text-xs sm:text-sm transition"
                  style={{ background: "var(--adm-surface-2)", color: "var(--adm-text)", border: "1px solid var(--adm-border)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--adm-surface)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "var(--adm-surface-2)")}
                >
                  باز کردن همه
                </button>

                <button
                  onClick={closeAll}
                  className="px-2 py-1 sm:px-3 sm:py-2 rounded-xl text-xs sm:text-sm transition"
                  style={{ background: "var(--adm-surface-2)", color: "var(--adm-text)", border: "1px solid var(--adm-border)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--adm-surface)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "var(--adm-surface-2)")}
                >
                  بستن همه
                </button>

                <button
                  onClick={() => setCreateOpen(true)}
                  className="px-2 py-1 sm:px-3 sm:py-2 rounded-xl flex items-center gap-1 text-xs sm:text-sm transition"
                  style={{ background: "var(--adm-primary)", color: "var(--adm-on-primary)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--adm-primary-hover)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "var(--adm-primary)")}
                >
                  <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  دسته جدید
                </button>
              </div>
            </div>
            <div
              className="border-t"
              style={{ borderColor: "var(--adm-border)" }}
            >
              {loading ? (
                <div className="p-8 flex items-center justify-center">
                  <Spinner inline />
                </div>
              ) : (
                <div>
                  <div
                    className="grid grid-cols-[1fr_auto_auto_auto] gap-2 ps-4 py-3 sticky top-0 z-10 backdrop-blur"
                    style={{
                      background: "var(--adm-surface-2)",
                      borderBottom: "1px solid var(--adm-border)",
                      color: "var(--adm-text-muted)",
                    }}
                  >
                    <div>نام / اسلاگ</div>
                    <div className="flex lg:gap-10 gap-2">
                      <div className="justify-self-end">ترتیب</div>
                      <div className="justify-self-end">وضعیت</div>
                      <div className="justify-self-end">
                        <span className="hidden lg:inline">عملیات</span>
                        <MoreVertical className="inline lg:hidden w-4 h-4 align-[-2px]" />
                      </div>
                    </div>
                  </div>

                  <div style={{ background: "var(--adm-surface)" }}>
                    {filteredTree.length === 0 && (
                      <div className="p-6 text-center" style={{ color: "var(--adm-text-muted)" }}>
                        دسته‌ای یافت نشد
                      </div>
                    )}

                    {filteredTree.map((root) => renderNode(root, 0))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <CategoryFormModal
        open={Boolean(createOpen)}
        onClose={() => setCreateOpen(false)}
        onSubmit={(payload) => {
          if (createOpen?.parent) payload.parent = createOpen.parent._id;
          handleCreate(payload);
        }}
        allCategoriesTree={tree}
      />

      <CategoryFormModal
        open={Boolean(editCat)}
        onClose={() => setEditCat(null)}
        onSubmit={handleEdit}
        initial={editCat || undefined}
        allCategoriesTree={tree}
      />

      <ConfirmDeleteModal
        open={Boolean(deleteCat)}
        onClose={() => setDeleteCat(null)}
        onConfirm={handleDelete}
        category={deleteCat}
      />
    </div>
  );
}
