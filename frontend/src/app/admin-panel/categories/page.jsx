"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
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
  MoreVertical, // ⬅️ برای منوی سه‌نقطه‌ای موبایل
} from "lucide-react";

/* ----------------------
   Utilities (بدون تغییر در منطق)
---------------------- */
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

/* ----------------------
   Modal (UI only)
---------------------- */
function Modal({ open, onClose, title, children, footer }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 flex items-end sm:items-center justify-center z-50">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="w-full sm:max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl m-3 sm:m-0 overflow-hidden shadow-xl z-50">
        <div className="bg-gradient-to-l from-slate-800 to-indigo-900 px-4 py-3">
          <h3 className="text-white font-bold">{title}</h3>
        </div>
        <div className="p-4">{children}</div>
        {footer && (
          <div className="p-3 border-t border-slate-700 bg-slate-900">{footer}</div>
        )}
      </div>
    </div>
  );
}

/* ----------------------
   Category Form Modal (منطق API دست‌نخورده)
---------------------- */
function CategoryFormModal({ open, onClose, onSubmit, initial, allCategoriesTree }) {
  const isEdit = Boolean(initial?._id);
  const [name, setName] = useState(initial?.name || "");
  const [slug, setSlug] = useState(initial?.slug || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [image, setImage] = useState(initial?.image || "");
  const [imageAlt, setImageAlt] = useState(initial?.imageAlt || "");
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [parent, setParent] = useState(initial?.parent?._id || initial?.parent || "");
  const [metaTitle, setMetaTitle] = useState(initial?.metaTitle || "");
  const [metaDescription, setMetaDescription] = useState(initial?.metaDescription || "");
  const [keywords, setKeywords] = useState(
    Array.isArray(initial?.keywords) ? initial.keywords.join(", ") : initial?.keywords || ""
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
      Array.isArray(initial?.keywords) ? initial.keywords.join(", ") : initial?.keywords || ""
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

  // Cmd/Ctrl + Enter = Submit
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") handleSubmit();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, name, slug, description, image, imageAlt, isActive, parent, metaTitle, metaDescription, keywords]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "ویرایش دسته‌بندی" : "ایجاد دسته‌بندی"}
      footer={
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 text-gray-200 hover:bg-slate-700 transition"
          >
            انصراف
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition"
          >
            {isEdit ? "ذخیره تغییرات" : "ایجاد"}
          </button>
        </div>
      }
    >
      {initial?._loading && (
        <div className="mb-3 text-sm text-indigo-300">در حال دریافت اطلاعات از سرور...</div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-300 mb-1">نام *</label>
          <input
            disabled={Boolean(initial?._loading)}
            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="مثل: موبایل"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-300 mb-1">اسلاگ</label>
          <div className="flex items-center gap-2">
            <input
              disabled={Boolean(initial?._loading)}
              className="flex-1 rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
              value={slug}
              onChange={(e) => setSlug(slugify(e.target.value))}
              placeholder="mobile-phones"
              dir="ltr"
            />
            <span className="text-xs text-gray-400 flex items-center gap-1" dir="ltr">
              <Link2 className="w-4 h-4" /> {slug || slugify(name || "")}
            </span>
          </div>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm text-gray-300 mb-1">توضیحات</label>
          <textarea
            disabled={Boolean(initial?._loading)}
            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm text-gray-300 mb-1">تصویر (URL)</label>
          <input
            disabled={Boolean(initial?._loading)}
            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
            value={image}
            onChange={(e) => setImage(e.target.value)}
            dir="ltr"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-300 mb-1">متن جایگزین تصویر</label>
          <input
            disabled={Boolean(initial?._loading)}
            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
            value={imageAlt}
            onChange={(e) => setImageAlt(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm text-gray-300 mb-1">والد</label>
          <select
            disabled={Boolean(initial?._loading)}
            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
            value={parent}
            onChange={(e) => setParent(e.target.value)}
          >
            <option value="">— بدون والد (دسته سطح ۱)</option>
            {options.map((o) => (
              <option key={o._id} value={o._id}>
                {o.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-3">
          <input
            disabled={Boolean(initial?._loading)}
            id="isActive"
            type="checkbox"
            className="w-5 h-5 accent-indigo-600"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          <label htmlFor="isActive" className="text-sm text-gray-300">
            فعال باشد
          </label>
        </div>
        <div>
          <label className="block text-sm text-gray-300 mb-1">Meta Title</label>
          <input
            disabled={Boolean(initial?._loading)}
            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
            value={metaTitle}
            onChange={(e) => setMetaTitle(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm text-gray-300 mb-1">Meta Description</label>
          <input
            disabled={Boolean(initial?._loading)}
            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
            value={metaDescription}
            onChange={(e) => setMetaDescription(e.target.value)}
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm text-gray-300 mb-1">
            کلمات کلیدی (با ویرگول جدا کنید)
          </label>
          <input
            disabled={Boolean(initial?._loading)}
            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="گوشی, موبایل, سامسونگ"
          />
        </div>
      </div>
    </Modal>
  );
}

/* ----------------------
   Confirm Delete Modal (بدون تغییر منطق)
---------------------- */
function ConfirmDeleteModal({ open, onClose, onConfirm, category }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="حذف دسته‌بندی"
      footer={
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 text-gray-200 hover:bg-slate-700 transition"
          >
            انصراف
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition"
          >
            حذف
          </button>
        </div>
      }
    >
      <p className="text-gray-300">
        آیا از حذف <span className="text-white font-semibold">{category?.name}</span> مطمئن
        هستید؟
      </p>
      <p className="text-gray-400 mt-2 text-sm">
        اگر زیر‌دسته داشته باشد، بک‌اند مانع حذف می‌شود.
      </p>
    </Modal>
  );
}

/* ----------------------
   Neon depth themes (برای رنگ‌دهی نئونی به‌ازای عمق)
---------------------- */
const DEPTH_THEMES = {
  root: {
    bgBase: "",
    bgOpen: "bg-indigo-500/10",
    ring: "ring-indigo-500/20",
    icon: "text-indigo-400",
    indent: "bg-slate-700/40",
    desc: "bg-indigo-500/3",
    hover: "hover:bg-indigo-500/25",
  },
  levels: [
    {
      icon: "text-emerald-400",
      bgBase: "bg-emerald-400/10",
      bgOpen: "bg-emerald-400/10",
      ring: "ring-emerald-400/20",
      desc: "bg-emerald-400/7",
      indent: "bg-emerald-400/60",
      hover: "hover:bg-emerald-400/25",
    },
    {
      icon: "text-cyan-400",
      bgBase: "bg-cyan-400/10",
      bgOpen: "bg-cyan-400/10",
      ring: "ring-cyan-400/20",
      desc: "bg-cyan-400/7",
      indent: "bg-cyan-400/60",
      hover: "hover:bg-cyan-400/25",
    },
    {
      icon: "text-fuchsia-400",
      bgBase: "bg-fuchsia-400/10",
      bgOpen: "bg-fuchsia-400/10",
      ring: "ring-fuchsia-400/20",
      desc: "bg-fuchsia-400/7",
      indent: "bg-fuchsia-400/60",
      hover: "hover:bg-fuchsia-400/25",
    },
    {
      icon: "text-violet-400",
      bgBase: "bg-violet-400/10",
      bgOpen: "bg-violet-400/10",
      ring: "ring-violet-400/20",
      desc: "bg-violet-400/7",
      indent: "bg-violet-400/60",
      hover: "hover:bg-violet-400/25",
    },
    {
      icon: "text-lime-400",
      bgBase: "bg-lime-400/10",
      bgOpen: "bg-lime-400/10",
      ring: "ring-lime-400/20",
      desc: "bg-lime-400/7",
      indent: "bg-lime-400/60",
      hover: "hover:bg-lime-400/25",
    },
    {
      icon: "text-sky-400",
      bgBase: "bg-sky-400/10",
      bgOpen: "bg-sky-400/10",
      ring: "ring-sky-400/20",
      desc: "bg-sky-400/7",
      indent: "bg-sky-400/60",
      hover: "hover:bg-sky-400/25",
    },
    {
      icon: "text-rose-400",
      bgBase: "bg-rose-400/10",
      bgOpen: "bg-rose-400/10",
      ring: "ring-rose-400/20",
      desc: "bg-rose-400/7",
      indent: "bg-rose-400/60",
      hover: "hover:bg-rose-400/25",
    },
    {
      icon: "text-amber-400",
      bgBase: "bg-amber-400/10",
      bgOpen: "bg-amber-400/10",
      ring: "ring-amber-400/20",
      desc: "bg-amber-400/7",
      indent: "bg-amber-400/60",
      hover: "hover:bg-amber-400/25",
    },
  ],
};
const getThemeForDepth = (depth) =>
  depth <= 0 ? DEPTH_THEMES.root : DEPTH_THEMES.levels[(depth - 1) % DEPTH_THEMES.levels.length];

/* ----------------------
   ActionMenu (مخصوص < lg : منوی سه‌نقطه‌ای)
   - absolute/relative
   - کلیک بیرون = بستن
   - ESC = بستن
---------------------- */
function ActionMenu({ node, onAddChild, onEdit, onDelete }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const btnRef = useRef(null);

  useEffect(() => {
    const onDocDown = (e) => {
      if (!menuRef.current) return;
      if (menuRef.current.contains(e.target) || btnRef.current?.contains(e.target)) return;
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
      <button
        ref={btnRef}
        onClick={() => setOpen((o) => !o)}
        className="p-2 rounded-lg hover:bg-slate-700/60 text-gray-300"
        aria-haspopup="menu"
        aria-expanded={open}
        title="عملیات"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {open && (
        <div
          ref={menuRef}
          role="menu"
          className="absolute top-full left-0 mt-1 w-40 rounded-xl border border-slate-700 bg-slate-800 shadow-xl z-50 overflow-hidden"
        >
          <button
            role="menuitem"
            onClick={() => handle(onAddChild)}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-200 hover:bg-slate-700/60"
          >
            <Plus className="w-4 h-4" />
            زیر‌دسته
          </button>
          <button
            role="menuitem"
            onClick={() => handle(onEdit)}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-200 hover:bg-slate-700/60"
          >
            <Edit className="w-4 h-4" />
            ویرایش
          </button>
          <button
            role="menuitem"
            onClick={() => handle(onDelete)}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-300 hover:bg-red-900/30"
          >
            <Trash2 className="w-4 h-4" />
            حذف
          </button>
        </div>
      )}
    </div>
  );
}

/* ----------------------
   Row (بهبود UI/UX + منوی ریسپانسیو)
---------------------- */
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
  const theme = getThemeForDepth(depth);
  const hasChildren = (node.children || []).length > 0;
  const padRight = 10 + depth * 1 ;
  const isOpen = expanded;

  return (
    <div className="relative">
      {/* indent guide */}
      {depth > 0 && (
        <div
          className="absolute inset-y-0"
          style={{ right: 10 + (depth - 1) * 10, width: 2 }}
        >
          <div className={`h-full w-px ${theme.indent}`} />
        </div>
      )}

      <div
        role="treeitem"
        aria-expanded={hasChildren ? isOpen : undefined}
        tabIndex={0}
        className={[
          "group grid grid-cols-[1fr_auto_auto_auto] items-center gap-1 px-3 sm:px-1 py-2 border-b border-slate-700/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/30",
          depth > 0 ? theme.bgBase : "",
          isOpen
            ? `ring-1 ring-inset ${theme.ring} ${theme.bgOpen}`
            : isAncestorHighlighted && depth > 0
            ? theme.desc
            : "",
          theme.hover || "hover:bg-white/5",
        ].join(" ")}
        style={{ paddingRight: padRight }}
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
              className="p-1 rounded hover:bg-slate-700/60"
              title={isOpen ? "بستن" : "بازکردن"}
              aria-label={isOpen ? "بستن" : "بازکردن"}
            >
              {isOpen ? (
                <ChevronDown className="w-4 h-4 text-gray-300" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-300" />
              )}
            </button>
          ) : (
            <span className="w-5" />
          )}
          <div className="w-6 h-6 rounded bg-slate-800 border border-slate-700 flex items-center justify-center">
            {isOpen ? (
              <FolderOpen className={`w-3.5 h-3.5 ${theme.icon}`} />
            ) : (
              <Folder className={`w-3.5 h-3.5 ${theme.icon}`} />
            )}
          </div>
          <div className="min-w-0">
            <div className="text-white font-medium truncate" title={node.name}>
              {node._highlightedName || node.name}
            </div>
            <div className="text-xs text-gray-400 truncate" dir="ltr">
              /{node._highlightedSlug || node.slug}
            </div>
          </div>
        </div>

        {/* sort controls */}
        <div className="flex items-center gap-1 justify-self-end">
          <button
            className="p-1.5 rounded-lg hover:bg-slate-700/60"
            onClick={() => onMoveUp(node)}
            title="بالا"
            aria-label="بالا"
          >
            <ArrowUp className="w-4 h-4 text-gray-300" />
          </button>
          <button
            className="p-1.5 rounded-lg hover:bg-slate-700/60"
            onClick={() => onMoveDown(node)}
            title="پایین"
            aria-label="پایین"
          >
            <ArrowDown className="w-4 h-4 text-gray-300" />
          </button>
        </div>

        {/* status */}
        <div className="justify-self-end">
<button
  onClick={() => onToggleActive(node)}
  className={`px-2 py-1 rounded-lg text-sm flex items-center gap-0 lg:gap-1 border transition ${
    node.isActive
      ? "bg-transparent text-green-300 border-green-800/60 hover:bg-green-900/20"
      : "bg-transparent text-gray-300 border-slate-700 hover:bg-slate-800/60"
  }`}
  title="فعال/غیرفعال"
  aria-pressed={node.isActive}
  aria-label={node.isActive ? "فعال" : "غیرفعال"} // برای دسترس‌پذیری در سایزهای کوچک
>
  {node.isActive ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
  <span className="hidden lg:inline">{node.isActive ? "فعال" : "غیرفعال"}</span>
</button>

        </div>

        {/* actions */}
        <div className="justify-self-end">
          {/* دسکتاپ (>= lg): همان ۳ آیکن قبلی */}
          <div className="hidden lg:flex items-center gap-1">
            <button
              onClick={() => onAddChild(node)}
              className="p-2 rounded-lg hover:bg-slate-700/60 text-gray-300"
              title="زیر‌دسته"
              aria-label="زیر‌دسته"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={() => onEdit(node)}
              className="p-2 rounded-lg hover:bg-slate-700/60 text-gray-300"
              title="ویرایش"
              aria-label="ویرایش"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(node)}
              className="p-2 rounded-lg hover:bg-slate-700/60 text-gray-300"
              title="حذف"
              aria-label="حذف"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* موبایل/تبلت (< lg): تبدیل به منوی سه‌نقطه */}
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

/* ----------------------
   صفحه اصلی (منطق API دست‌نخورده؛ UI بهبود یافته)
---------------------- */
export default function CategoriesPage() {
  const [raw, setRaw] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(new Set());
  const [qInput, setQInput] = useState(""); // ورودی خام جستجو (برای debounce)
  const [q, setQ] = useState(""); // جستجوی debounce شده
  const [createOpen, setCreateOpen] = useState(false);
  const [editCat, setEditCat] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteCat, setDeleteCat] = useState(null);

  // ---- Persist expanded in localStorage
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("cat_expanded_ids") || "[]");
      setExpanded(new Set(saved));
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem("cat_expanded_ids", JSON.stringify(Array.from(expanded)));
    } catch {}
  }, [expanded]);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(backApis.getAllCategories.url, {
        withCredentials: true,
      });
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

  // debounce جستجو
  useEffect(() => {
    const t = setTimeout(() => setQ(qInput.trim()), 250);
    return () => clearTimeout(t);
  }, [qInput]);

  const tree = useMemo(() => buildTree(raw || []), [raw]);

  // Map کمک‌کار برای parent lookup (برای هایلایت نیاکان گره‌های باز)
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

  // هایلایت کلمه در اسم/اسلاگ هنگام جستجو
  const highlight = (text, q) => {
    if (!q) return text;
    const i = text?.toLowerCase?.().indexOf(q.toLowerCase());
    if (i === -1) return text;
    return (
      <>
        {text.slice(0, i)}
        <mark className="bg-yellow-500/30 rounded px-0.5">
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

  // ----- API handlers (بدون تغییر منطقی)
  const handleCreate = async (payload) => {
    try {
      await axios.post(backApis.createCategory.url, payload, {
        withCredentials: true,
      });
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
      await axios({ url, method, data, withCredentials: true });

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
      const { data } = await axios.get(url, { withCredentials: true });
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
      await axios({ url, method, withCredentials: true });
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
      await axios({
        url,
        method,
        data: { isActive: !node.isActive },
        withCredentials: true,
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
      await axios({
        url,
        method,
        data: { sortOrder: target.sortOrder },
        withCredentials: true,
      });
      fetchAll();
    } catch {
      toast.error("جابجایی ترتیب ناموفق بود");
    }
  };

  // رندر بازگشتی؛ ولی با بهینه‌سازی‌های UI
  const renderNode = (n, depth = 0) => {
    const open = expanded.has(n._id) || q.length > 0; // در حالت جستجو شاخه‌ها باز بمانند
    return (
      <div key={n._id}>
        <Row
          node={n}
          depth={depth}
          expanded={open}
          onToggleExpand={toggleExpand}
          onAddChild={(node) => setCreateOpen({ parent: node })}
          onEdit={(node) => setEditCat(node)}
          // اگر خواستی دیتای تازهٔ یک دسته را از بک‌اند بخوانی:
          // onEdit={(node) => openEdit(node)}
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
          <div className="rounded-2xl overflow-hidden border border-slate-700 bg-slate-900">
            <div className="bg-gradient-to-l from-slate-800 to-indigo-900 p-5">
              <h1 className="text-white text-2xl font-bold">مدیریت دسته‌بندی‌ها</h1>
              <p className="text-gray-300 mt-1">
                ایجاد، ویرایش و سازمان‌دهی دسته‌ها به‌صورت درختی
              </p>
            </div>

            <div className="p-4 flex flex-col md:flex-row items-stretch md:items-center gap-3 md:gap-4">
              <div className="relative flex-1">
                <input
                  value={qInput}
                  onChange={(e) => setQInput(e.target.value)}
                  placeholder="جستجو بر اساس نام/اسلاگ..."
                  className="w-full pl-10 pr-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-gray-400" />
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={openAll}
                  className="px-3 py-2 rounded-lg bg-slate-800 text-gray-200 hover:bg-slate-700"
                >
                  باز کردن همه
                </button>
                <button
                  onClick={closeAll}
                  className="px-3 py-2 rounded-lg bg-slate-800 text-gray-200 hover:bg-slate-700"
                >
                  بستن همه
                </button>
                <button
                  onClick={() => setCreateOpen(true)}
                  className="px-3 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  دسته جدید
                </button>
              </div>
            </div>

            <div className="border-t border-slate-700">
              {loading ? (
                <div className="p-8 flex items-center justify-center">
                  <Spinner />
                </div>
              ) : (
                <div className="divide-y divide-slate-700/60">
                  <div className="grid grid-cols-[1fr_auto_auto_auto] gap-3 px-4 py-3 bg-slate-800/60 text-gray-300 sticky top-0 z-10 backdrop-blur supports-[backdrop-filter]:bg-slate-800/50">
                    <div>نام / اسلاگ</div>
                    <div className="justify-self-end">ترتیب</div>
                    <div className="justify-self-end">وضعیت</div>
                    <div className="justify-self-end">
                      <span className="hidden lg:inline">عملیات</span>
                      <MoreVertical className="inline lg:hidden w-4 h-4 align-[-2px]" />
                    </div>
                  </div>

                  <div className="bg-slate-900">
                    {filteredTree.length === 0 && (
                      <div className="p-6 text-center text-gray-400">
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
          if (createOpen?.parent) payload.parent = createOpen.parent._id; // منطق شما حفظ شد
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
