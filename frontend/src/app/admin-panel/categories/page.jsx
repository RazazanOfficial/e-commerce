"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import apiClient from "@/common/apiClient";
import backApis from "@/common/inedx";
import { toast } from "react-toastify";
import Spinner from "@/components/Spinner";
import {
  Plus,
  Edit,
  Trash2,
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  CheckCircle2,
  XCircle,
  ArrowUp,
  ArrowDown,
  Search,
  Link2,
  MoreVertical,
} from "lucide-react";

import {
  AdminButton,
  AdminField,
  AdminIconButton,
  AdminInput,
  AdminModal,
  AdminSelect,
  AdminTextarea,
} from "@/components/admin-ui";

const slugify = (str = "") =>
  str
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+|-+$/g, "");

const buildTree = (flat) => {
  const map = new Map();
  flat.forEach((c) => map.set(c._id, { ...c, children: [] }));
  const roots = [];
  flat.forEach((c) => {
    const pid = c.parent?._id || c.parent || null;
    if (pid && map.has(pid)) map.get(pid).children.push(map.get(c._id));
    else roots.push(map.get(c._id));
  });
  const sortRec = (nodes) => {
    nodes.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    nodes.forEach((n) => sortRec(n.children));
  };
  sortRec(roots);
  return roots;
};

const flattenForSelect = (tree, depth = 0, arr = []) => {
  tree.forEach((n) => {
    arr.push({ _id: n._id, name: `${"— ".repeat(depth)}${n.name}` });
    flattenForSelect(n.children, depth + 1, arr);
  });
  return arr;
};

function CategoryFormModal({
  open,
  onClose,
  onSubmit,
  initial,
  allCategoriesTree,
}) {
  const isEdit = Boolean(initial?._id);
  const [name, setName] = useState(initial?.name || "");
  const [slug, setSlug] = useState(initial?.slug || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [image, setImage] = useState(initial?.image || "");
  const [imageAlt, setImageAlt] = useState(initial?.imageAlt || "");
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [parent, setParent] = useState(
    initial?.parent?._id || initial?.parent || ""
  );
  const [metaTitle, setMetaTitle] = useState(initial?.metaTitle || "");
  const [metaDescription, setMetaDescription] = useState(
    initial?.metaDescription || ""
  );
  const [keywords, setKeywords] = useState(
    Array.isArray(initial?.keywords)
      ? initial.keywords.join(", ")
      : initial?.keywords || ""
  );

  useEffect(() => {
    if (!isEdit) setSlug(slugify(name));
  }, [name]);

  useEffect(() => {
    setName(initial?.name || "");
    setSlug(initial?.slug || "");
    setDescription(initial?.description || "");
    setImage(initial?.image || "");
    setImageAlt(initial?.imageAlt || "");
    setIsActive(initial?.isActive ?? true);
    setParent(initial?.parent?._id || initial?.parent || "");
    setMetaTitle(initial?.metaTitle || "");
    setMetaDescription(initial?.metaDescription || "");
    setKeywords(
      Array.isArray(initial?.keywords)
        ? initial.keywords.join(", ")
        : initial?.keywords || ""
    );
  }, [initial]);

  const options = useMemo(() => {
    const tree = JSON.parse(JSON.stringify(allCategoriesTree || []));
    if (isEdit) {
      const cleaned = (function removeSelfAndDesc(nodeList) {
        return (nodeList || []).filter((n) => {
          if (n._id === initial._id) return false;
          n.children = removeSelfAndDesc(n.children);
          return true;
        });
      })(tree);
      return flattenForSelect(cleaned);
    }
    return flattenForSelect(tree);
  }, [allCategoriesTree, isEdit, initial]);

  const handleSubmit = () => {
    if (!name?.trim()) return toast.error("نام دسته را وارد کنید");
    if (image) {
      try {
        new URL(image);
      } catch {
        return toast.error("آدرس تصویر باید URL معتبر باشد");
      }
    }
    onSubmit({
      ...(isEdit ? { id: initial._id } : {}),
      name: name.trim(),
      slug: slug?.trim() || slugify(name),
      description,
      image: image?.trim() || undefined,
      imageAlt: imageAlt?.trim() || name.trim(),
      isActive,
      parent: parent || undefined,
      metaTitle: metaTitle?.trim() || name.trim(),
      metaDescription: metaDescription?.trim() || description?.trim(),
      keywords: keywords
        ? keywords
            .split(",")
            .map((k) => k.trim())
            .filter(Boolean)
        : undefined,
    });
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") handleSubmit();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    open,
    name,
    slug,
    description,
    image,
    imageAlt,
    isActive,
    parent,
    metaTitle,
    metaDescription,
    keywords,
  ]);

  return (
    <AdminModal
      open={open}
      onClose={onClose}
      title={isEdit ? "ویرایش دسته‌بندی" : "ایجاد دسته‌بندی"}
      description="Ctrl/⌘ + Enter برای ثبت سریع"
      size="lg"
      footer={
        <div className="flex items-center justify-end gap-2">
          <AdminButton variant="secondary" onClick={onClose}>
            انصراف
          </AdminButton>
          <AdminButton variant="primary" onClick={handleSubmit}>
            {isEdit ? "ذخیره تغییرات" : "ایجاد"}
          </AdminButton>
        </div>
      }
    >
      {initial?._loading && (
        <div className="mb-3 text-sm text-[var(--adm-text-muted)]">
          در حال دریافت اطلاعات از سرور...
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <AdminField label="نام" required>
          <AdminInput
            disabled={Boolean(initial?._loading)}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="مثل: موبایل"
            variant="filled"
          />
        </AdminField>

        <AdminField label="اسلاگ" hint="(اختیاری)" >
          <div className="flex flex-col gap-2">
            <AdminInput
              disabled={Boolean(initial?._loading)}
              value={slug}
              onChange={(e) => setSlug(slugify(e.target.value))}
              placeholder="mobile-phones"
              dir="ltr"
              className="text-left"
              variant="filled"
            />
            <span className="text-xs flex items-center gap-1 text-[var(--adm-text-muted)]" dir="ltr">
              <Link2 className="w-4 h-4" /> /{slug || slugify(name || "")}
            </span>
          </div>
        </AdminField>

        <div className="md:col-span-2">
          <AdminField label="توضیحات" hint="(اختیاری)">
            <AdminTextarea
              disabled={Boolean(initial?._loading)}
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              variant="filled"
            />
          </AdminField>
        </div>

        <AdminField label="تصویر (URL)" hint="(اختیاری)">
          <AdminInput
            disabled={Boolean(initial?._loading)}
            value={image}
            onChange={(e) => setImage(e.target.value)}
            dir="ltr"
            className="text-left"
            variant="filled"
          />
        </AdminField>

        <AdminField label="متن جایگزین تصویر" hint="(اختیاری)">
          <AdminInput
            disabled={Boolean(initial?._loading)}
            value={imageAlt}
            onChange={(e) => setImageAlt(e.target.value)}
            variant="filled"
          />
        </AdminField>

        <AdminField label="والد" hint="(اختیاری)">
          <AdminSelect
            disabled={Boolean(initial?._loading)}
            value={parent}
            onChange={(e) => setParent(e.target.value)}
            variant="filled"
          >
            <option value="">— بدون والد (دسته سطح ۱)</option>
            {options.map((o) => (
              <option key={o._id} value={o._id}>
                {o.name}
              </option>
            ))}
          </AdminSelect>
        </AdminField>

        <div className="flex items-center gap-3 pt-2">
          <input
            disabled={Boolean(initial?._loading)}
            id="isActive"
            type="checkbox"
            className="w-5 h-5"
            style={{ accentColor: "var(--adm-primary)" }}
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          <label htmlFor="isActive" className="text-sm text-[var(--adm-text-muted)]">
            فعال باشد
          </label>
        </div>

        <AdminField label="Meta Title" hint="(اختیاری)">
          <AdminInput
            disabled={Boolean(initial?._loading)}
            value={metaTitle}
            onChange={(e) => setMetaTitle(e.target.value)}
            variant="filled"
          />
        </AdminField>

        <AdminField label="Meta Description" hint="(اختیاری)">
          <AdminInput
            disabled={Boolean(initial?._loading)}
            value={metaDescription}
            onChange={(e) => setMetaDescription(e.target.value)}
            variant="filled"
          />
        </AdminField>

        <div className="md:col-span-2">
          <AdminField label="کلمات کلیدی" hint="با ویرگول جدا کنید">
            <AdminInput
              disabled={Boolean(initial?._loading)}
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="گوشی, موبایل, سامسونگ"
              variant="filled"
            />
          </AdminField>
        </div>
      </div>
    </AdminModal>
  );
}

function ConfirmDeleteModal({ open, onClose, onConfirm, category }) {
  return (
    <AdminModal
      open={open}
      onClose={onClose}
      title="حذف دسته‌بندی"
      size="sm"
      description="این عملیات قابل بازگشت نیست"
      footer={
        <div className="flex items-center justify-end gap-2">
          <AdminButton variant="secondary" onClick={onClose}>
            انصراف
          </AdminButton>
          <AdminButton variant="danger" onClick={onConfirm}>
            حذف
          </AdminButton>
        </div>
      }
    >
      <p className="text-sm" style={{ color: "var(--adm-text)" }}>
        آیا از حذف <span className="font-semibold">{category?.name}</span> مطمئن هستید؟
      </p>
      <p className="mt-2 text-sm text-[var(--adm-text-muted)]">
        اگر زیر‌دسته داشته باشد، بک‌اند مانع حذف می‌شود.
      </p>
    </AdminModal>
  );
}

// Depth styling is now neutral + token-based (no rainbow themes).

function ActionMenu({ node, onAddChild, onEdit, onDelete }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const btnRef = useRef(null);

  useEffect(() => {
    const onDocDown = (e) => {
      if (!menuRef.current) return;
      if (
        menuRef.current.contains(e.target) ||
        btnRef.current?.contains(e.target)
      )
        return;
      setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const handle = (fn) => {
    fn(node);
    setOpen(false);
  };

  return (
    <div className="relative">
      <AdminIconButton
        ref={btnRef}
        onClick={() => setOpen((o) => !o)}
        label="عملیات"
        intent="muted"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <MoreVertical className="w-4 h-4" />
      </AdminIconButton>

      {open && (
        <div
          ref={menuRef}
          role="menu"
          className="absolute top-full left-0 mt-1 w-40 rounded-xl shadow-xl z-50 overflow-hidden border border-[color:var(--adm-border)] bg-[var(--adm-surface)]"
        >
          <button
            role="menuitem"
            onClick={() => handle(onAddChild)}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--adm-text)] hover:bg-[var(--adm-surface-2)] transition"
          >
            <Plus className="w-4 h-4" />
            زیر‌دسته
          </button>
          <button
            role="menuitem"
            onClick={() => handle(onEdit)}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--adm-text)] hover:bg-[var(--adm-surface-2)] transition"
          >
            <Edit className="w-4 h-4" />
            ویرایش
          </button>
          <button
            role="menuitem"
            onClick={() => handle(onDelete)}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--adm-error)] hover:bg-[var(--adm-error-soft)] transition"
          >
            <Trash2 className="w-4 h-4" />
            حذف
          </button>
        </div>
      )}
    </div>
  );
}

function Row({
  node,
  depth = 0,
  onToggleExpand,
  expanded,
  onAddChild,
  onEdit,
  onDelete,
  onToggleActive,
  onMoveUp,
  onMoveDown,
  isAncestorHighlighted,
}) {
  const hasChildren = (node.children || []).length > 0;
  const isOpen = expanded;
  const padRight = 12 + depth * 18;

  const baseBg = "var(--adm-surface)";
  const hoverBg = "var(--adm-surface-2)";
  const openBg = "var(--adm-primary-soft)";

  const rowBg = isOpen ? openBg : isAncestorHighlighted ? openBg : baseBg;

  return (
    <div className="relative">
      {depth > 0 && (
        <div
          className="absolute inset-y-0"
          style={{ right: 12 + (depth - 1) * 18, width: 2 }}
        >
          <div
            className="h-full w-px"
            style={{ background: "var(--adm-border)" }}
          />
        </div>
      )}

      <div
        role="treeitem"
        aria-expanded={hasChildren ? isOpen : undefined}
        tabIndex={0}
        className="group grid grid-cols-[1fr_auto_auto_auto] items-center gap-1 px-3 sm:px-2 py-2 focus:outline-none focus-visible:ring-2"
        style={{
          paddingRight: padRight,
          background: rowBg,
          borderBottom: "1px solid var(--adm-border)",
          color: "var(--adm-text)",
        }}
        onMouseEnter={(e) => {
          if (isOpen) return;
          e.currentTarget.style.background = hoverBg;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = rowBg;
        }}
        onKeyDown={(e) => {
          if (!hasChildren) return;
          if (e.key === "ArrowLeft" && isOpen) onToggleExpand(node._id);
          if (e.key === "ArrowRight" && !isOpen) onToggleExpand(node._id);
        }}
        title={node.name}
      >
        <div className="flex items-center gap-2 min-w-0">
          {hasChildren ? (
            <button
              onClick={() => onToggleExpand(node._id)}
              className="p-1 rounded-lg transition"
              style={{ color: "var(--adm-text-muted)" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--adm-surface-2)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              title={isOpen ? "بستن" : "بازکردن"}
              aria-label={isOpen ? "بستن" : "بازکردن"}
            >
              {isOpen ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          ) : (
            <span className="w-5" />
          )}
          <div
            className="w-6 h-6 rounded-lg flex items-center justify-center"
            style={{
              background: "var(--adm-surface-2)",
              border: "1px solid var(--adm-border)",
              color: "var(--adm-text-muted)",
            }}
          >
            {isOpen ? (
              <FolderOpen className="w-3.5 h-3.5" />
            ) : (
              <Folder className="w-3.5 h-3.5" />
            )}
          </div>
          <div className="min-w-0">
            <div
              className="font-medium truncate sm:text-base text-sm"
              title={node.name}
            >
              {node._highlightedName || node.name}
            </div>
            <div className="text-xs truncate" dir="ltr" style={{ color: "var(--adm-text-muted)" }}>
              /{node._highlightedSlug || node.slug}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 justify-self-end">
          <button
            className="p-1.5 rounded-lg transition"
            onClick={() => onMoveUp(node)}
            title="بالا"
            aria-label="بالا"
            style={{ color: "var(--adm-text-muted)" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--adm-surface-2)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <ArrowUp className="w-4 h-4" />
          </button>
          <button
            className="p-1.5 rounded-lg transition"
            onClick={() => onMoveDown(node)}
            title="پایین"
            aria-label="پایین"
            style={{ color: "var(--adm-text-muted)" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--adm-surface-2)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <ArrowDown className="w-4 h-4" />
          </button>
        </div>

        <div className="justify-self-end">
          <button
            onClick={() => onToggleActive(node)}
            className="px-2 py-1 rounded-lg text-sm flex items-center gap-0 lg:gap-1 border transition"
            title="فعال/غیرفعال"
            aria-pressed={node.isActive}
            aria-label={node.isActive ? "فعال" : "غیرفعال"}
            style={
              node.isActive
                ? {
                    background: "var(--adm-success-soft)",
                    color: "var(--adm-success)",
                    borderColor: "var(--adm-success)",
                  }
                : {
                    background: "transparent",
                    color: "var(--adm-text-muted)",
                    borderColor: "var(--adm-border)",
                  }
            }
            onMouseEnter={(e) => {
              if (node.isActive) return;
              e.currentTarget.style.background = "var(--adm-surface-2)";
              e.currentTarget.style.color = "var(--adm-text)";
            }}
            onMouseLeave={(e) => {
              if (node.isActive) return;
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "var(--adm-text-muted)";
            }}
          >
            {node.isActive ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <XCircle className="w-4 h-4" />
            )}
            <span className="hidden lg:inline">
              {node.isActive ? "فعال" : "غیرفعال"}
            </span>
          </button>
        </div>

        <div className="justify-self-end">
          <div className="hidden lg:flex items-center gap-1">
            <button
              onClick={() => onAddChild(node)}
              className="p-2 rounded-lg transition"
              style={{ color: "var(--adm-text-muted)" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--adm-surface-2)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              title="زیر‌دسته"
              aria-label="زیر‌دسته"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={() => onEdit(node)}
              className="p-2 rounded-lg transition"
              style={{ color: "var(--adm-text-muted)" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--adm-surface-2)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              title="ویرایش"
              aria-label="ویرایش"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(node)}
              className="p-2 rounded-lg transition"
              style={{ color: "var(--adm-text-muted)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--adm-error-soft)";
                e.currentTarget.style.color = "var(--adm-error)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "var(--adm-text-muted)";
              }}
              title="حذف"
              aria-label="حذف"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <div className="lg:hidden">
            <ActionMenu
              node={node}
              onAddChild={onAddChild}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CategoriesPage() {
  const [raw, setRaw] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(new Set());
  const [qInput, setQInput] = useState("");
  const [q, setQ] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editCat, setEditCat] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteCat, setDeleteCat] = useState(null);

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
