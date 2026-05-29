"use client";

//? 🔵 Required Modules

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import {
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
  MoreVertical,
  Link2,
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

//* 🟢 Category Utilities
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

//* 🟢 Category Form Modal
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

//* 🟢 Confirm Delete Modal
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

//* 🟢 Category Tree Row
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


//? 🔵 Export Category Components
export {
  slugify,
  buildTree,
  flattenForSelect,
  CategoryFormModal,
  ConfirmDeleteModal,
  ActionMenu,
  Row,
};
