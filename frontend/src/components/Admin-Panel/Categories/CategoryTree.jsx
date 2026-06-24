"use client";

//? 🔵 Required Modules

import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Edit,
  Folder,
  FolderOpen,
  ImageIcon,
  Link2,
  MoreVertical,
  Plus,
  RefreshCw,
  Trash2,
  UploadCloud,
  X,
  XCircle,
} from "lucide-react";
import apiClient from "@/common/apiClient";
import backApis from "@/common";
import {
  AdminBadge,
  AdminButton,
  AdminField,
  AdminIconButton,
  AdminInput,
  AdminModal,
  AdminSelect,
  AdminTextarea,
} from "@/components/admin-ui";
import { cn } from "@/lib/utils";

//* 🟢 Category Utilities
const slugify = (str = "") =>
  str
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]+/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+|-+$/g, "");

const KEYWORD_SEPARATOR = "، ";
const KEYWORD_SPLIT_RE = /[،,]/;

const formatKeywords = (keywords) => {
  if (Array.isArray(keywords)) return keywords.filter(Boolean).join(KEYWORD_SEPARATOR);
  return keywords || "";
};

const parseKeywords = (keywords) =>
  String(keywords || "")
    .split(KEYWORD_SPLIT_RE)
    .map((k) => k.trim())
    .filter(Boolean);

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

const countDescendants = (node) =>
  (node.children || []).reduce((sum, child) => sum + 1 + countDescendants(child), 0);

//* 🟢 Category Image Uploader
function CategoryImageUploader({
  disabled,
  image,
  imageAlt,
  name,
  onChangeImage,
  onChangeImageAlt,
}) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.type?.startsWith("image/")) {
      toast.error("فقط فایل تصویر مجاز است");
      return;
    }

    try {
      setUploading(true);
      setProgress(0);

      const presignRes = await apiClient.post(backApis.mediaPresign.url, {
        mimeType: file.type,
        fileName: file.name,
        folder: "categories",
      });

      const presigned = presignRes?.data;
      const upload = presigned?.upload;
      if (!upload?.url || !upload?.method) {
        throw new Error("پاسخ presign نامعتبر است");
      }

      await axios({
        method: upload.method,
        url: upload.url,
        data: file,
        headers: upload.headers || { "Content-Type": file.type },
        onUploadProgress: (progressEvent) => {
          if (!progressEvent.total) return;
          setProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
        },
      });

      const commitRes = await apiClient.post(backApis.mediaCommit.url, {
        key: presigned.key,
        originalName: file.name,
        kind: "image",
      });

      const publicUrl = commitRes?.data?.data?.publicUrl || presigned.publicUrl;
      if (!publicUrl) throw new Error("آدرس عمومی فایل دریافت نشد");

      onChangeImage(publicUrl);
      onChangeImageAlt(imageAlt || name || file.name.replace(/\.[^.]+$/, ""));
      toast.success("تصویر دسته‌بندی آپلود شد");
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || err?.message || "آپلود تصویر ناموفق بود");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-[color:var(--adm-border)] bg-[var(--adm-surface-2)] p-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="h-28 w-full overflow-hidden rounded-2xl border border-[color:var(--adm-border)] bg-[var(--adm-surface)] sm:w-32">
          {image ? (
            <img
              src={image}
              alt={imageAlt || name || "تصویر دسته‌بندی"}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-[var(--adm-text-muted)]">
              <ImageIcon className="h-7 w-7" />
              <span className="text-xs">بدون تصویر</span>
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-[var(--adm-text)]">تصویر دسته‌بندی</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {image ? (
                <AdminButton
                  variant="secondary"
                  size="sm"
                  onClick={() => onChangeImage("")}
                  disabled={disabled || uploading}
                  leftIcon={X}
                >
                  حذف تصویر
                </AdminButton>
              ) : null}

              <label
                className={cn(
                  "inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold transition",
                  uploading || disabled
                    ? "pointer-events-none bg-[var(--adm-surface)] text-[var(--adm-text-muted)] opacity-60"
                    : "bg-[var(--adm-primary)] text-[var(--adm-on-primary)] hover:bg-[var(--adm-primary-hover)]"
                )}
              >
                <UploadCloud className="h-4 w-4" />
                {uploading ? `آپلود ${progress || 0}%` : "آپلود تصویر"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={disabled || uploading}
                  onChange={handleUpload}
                />
              </label>
            </div>
          </div>

          {uploading ? (
            <div className="h-2 overflow-hidden rounded-full bg-[var(--adm-surface)]">
              <div
                className="h-full rounded-full bg-[var(--adm-primary)] transition-all"
                style={{ width: `${progress || 4}%` }}
              />
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <AdminField label="آدرس تصویر" hint="اختیاری">
              <AdminInput
                disabled={disabled || uploading}
                value={image}
                onChange={(e) => onChangeImage(e.target.value)}
                placeholder="https://..."
                dir="ltr"
                className="text-left"
                variant="filled"
              />
            </AdminField>
            <AdminField label="متن جایگزین" hint="برای SEO و دسترس‌پذیری">
              <AdminInput
                disabled={disabled || uploading}
                value={imageAlt}
                onChange={(e) => onChangeImageAlt(e.target.value)}
                placeholder="مثلاً: تصویر دسته موبایل"
                variant="filled"
              />
            </AdminField>
          </div>
        </div>
      </div>
    </div>
  );
}

//* 🟢 Category Form Panel
function CategoryFormPanel({
  mode = "create",
  variant = "card",
  initial,
  parentDraft,
  allCategoriesTree,
  onSubmit,
  onCancelEdit,
}) {
  const isEdit = mode === "edit" && Boolean(initial?._id);
  const isModal = variant === "modal";
  const [name, setName] = useState(initial?.name || "");
  const [slug, setSlug] = useState(initial?.slug || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [image, setImage] = useState(initial?.image || "");
  const [imageAlt, setImageAlt] = useState(initial?.imageAlt || "");
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [parent, setParent] = useState(parentDraft?._id || initial?.parent?._id || initial?.parent || "");
  const [metaTitle, setMetaTitle] = useState(initial?.metaTitle || "");
  const [metaDescription, setMetaDescription] = useState(initial?.metaDescription || "");
  const [keywords, setKeywords] = useState(formatKeywords(initial?.keywords));

  useEffect(() => {
    setName(initial?.name || "");
    setSlug(initial?.slug || "");
    setDescription(initial?.description || "");
    setImage(initial?.image || "");
    setImageAlt(initial?.imageAlt || "");
    setIsActive(initial?.isActive ?? true);
    setParent(parentDraft?._id || initial?.parent?._id || initial?.parent || "");
    setMetaTitle(initial?.metaTitle || "");
    setMetaDescription(initial?.metaDescription || "");
    setKeywords(formatKeywords(initial?.keywords));
  }, [initial?._id, parentDraft?._id, mode]);

  useEffect(() => {
    if (!isEdit) setSlug(slugify(name));
  }, [name, isEdit]);

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
  }, [allCategoriesTree, isEdit, initial?._id]);

  const resetCreateForm = () => {
    setName("");
    setSlug("");
    setDescription("");
    setImage("");
    setImageAlt("");
    setIsActive(true);
    setParent(parentDraft?._id || "");
    setMetaTitle("");
    setMetaDescription("");
    setKeywords("");
  };

  const handleSubmit = () => {
    if (!name?.trim()) return toast.error("نام دسته‌بندی را وارد کنید");
    if (image && !String(image).trim().startsWith("/")) {
      try {
        new URL(image);
      } catch {
        return toast.error("آدرس تصویر باید URL معتبر یا مسیر داخلی مثل /assets/... باشد");
      }
    }

    const payload = {
      ...(isEdit ? { id: initial._id } : {}),
      name: name.trim(),
      slug: slug?.trim() || slugify(name),
      description: description?.trim(),
      image: image?.trim() || undefined,
      imageAlt: imageAlt?.trim() || name.trim(),
      isActive,
      parent: parent || null,
      metaTitle: metaTitle?.trim() || `خرید ${name.trim()}`,
      metaDescription:
        metaDescription?.trim() ||
        description?.trim() ||
        `مشاهده و خرید محصولات دسته ${name.trim()} در فروشگاه.`,
      keywords: parseKeywords(keywords),
    };

    onSubmit(payload, { resetCreateForm });
  };

  return (
    <div
      className={cn(
        !isModal &&
          "rounded-2xl border border-[color:var(--adm-border)] bg-[var(--adm-surface)] shadow-[0_20px_60px_var(--adm-shadow)]"
      )}
    >
      {!isModal ? (
      <div className="border-b border-[color:var(--adm-border)] bg-[var(--adm-surface-2)] p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--adm-text-muted)]">
              {isEdit ? "Edit category" : "New category"}
            </p>
            <h2 className="mt-1 text-xl font-bold text-[var(--adm-text)]">
              {isEdit ? "ویرایش دسته‌بندی" : parentDraft ? "ایجاد زیر‌دسته" : "افزودن دسته‌بندی"}
            </h2>
            <p className="mt-1 text-sm text-[var(--adm-text-muted)]">
              {isEdit
                ? "بعد از ذخیره، ساختار درختی به‌روزرسانی می‌شود."
                : "اطلاعات پایه، تصویر و داده‌های SEO را از همین فرم مدیریت کن."}
            </p>
          </div>

          {isEdit ? (
            <AdminIconButton label="بازگشت به ایجاد" intent="muted" onClick={onCancelEdit}>
              <RefreshCw className="h-4 w-4" />
            </AdminIconButton>
          ) : null}
        </div>

        {parentDraft && !isEdit ? (
          <div className="mt-4 rounded-xl border border-[color:var(--adm-border)] bg-[var(--adm-primary-soft)] px-3 py-2 text-sm text-[var(--adm-text)]">
            والد انتخاب‌شده: <span className="font-semibold">{parentDraft.name}</span>
          </div>
        ) : null}
      </div>
      ) : parentDraft && !isEdit ? (
        <div className="mb-5 rounded-xl border border-[color:var(--adm-border)] bg-[var(--adm-primary-soft)] px-3 py-2 text-sm text-[var(--adm-text)]">
          والد انتخاب‌شده: <span className="font-semibold">{parentDraft.name}</span>
        </div>
      ) : null}

      <div className={cn("space-y-5", !isModal && "p-5")}>
        <section className="space-y-4">
          <div>
            <h3 className="text-sm font-bold text-[var(--adm-text)]">اطلاعات اصلی</h3>
          </div>

          <AdminField label="نام دسته‌بندی" required>
            <AdminInput
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثلاً: موبایل و تبلت"
              variant="filled"
            />
          </AdminField>

          <AdminField label="اسلاگ" hint="فقط حروف انگلیسی، عدد و خط تیره">
            <div className="space-y-2">
              <AdminInput
                value={slug}
                onChange={(e) => setSlug(slugify(e.target.value))}
                placeholder="mobile-tablet"
                dir="ltr"
                className="text-left"
                variant="filled"
              />
              <span className="flex items-center gap-1 text-xs text-[var(--adm-text-muted)]" dir="ltr">
                <Link2 className="h-4 w-4" /> /{slug || slugify(name || "")}
              </span>
            </div>
          </AdminField>

          <AdminField label="والد" hint="برای ساخت درخت دسته‌بندی">
            <AdminSelect value={parent} onChange={(e) => setParent(e.target.value)} variant="filled">
              <option value="">— بدون والد</option>
              {options.map((o) => (
                <option key={o._id} value={o._id}>
                  {o.name}
                </option>
              ))}
            </AdminSelect>
          </AdminField>

          <AdminField label="توضیحات" hint="اختیاری">
            <AdminTextarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="توضیح کوتاه برای استفاده داخلی یا صفحه دسته‌بندی"
              variant="filled"
            />
          </AdminField>

          <label className="flex items-center justify-between gap-3 rounded-2xl border border-[color:var(--adm-border)] bg-[var(--adm-surface-2)] px-4 py-3">
            <span>
              <span className="block text-sm font-semibold text-[var(--adm-text)]">وضعیت نمایش</span>
            </span>
            <input
              id="isActive"
              type="checkbox"
              className="h-5 w-5"
              style={{ accentColor: "var(--adm-primary)" }}
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
          </label>
        </section>

        <section className="space-y-4">
          <div>
            <h3 className="text-sm font-bold text-[var(--adm-text)]">تصویر</h3>
          </div>
          <CategoryImageUploader
            image={image}
            imageAlt={imageAlt}
            name={name}
            onChangeImage={setImage}
            onChangeImageAlt={setImageAlt}
          />
        </section>

        <section className="space-y-4">
          <div>
            <h3 className="text-sm font-bold text-[var(--adm-text)]">سئو</h3>
            <p className="mt-1 text-xs text-[var(--adm-text-muted)]">
              عنوان و توضیحات متا فارسی نوشته می‌شوند. کلمات کلیدی را با ویرگول «،» جدا کنید.
            </p>
          </div>

          <AdminField label="عنوان متا" hint="فارسی / اختیاری">
            <AdminInput
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
              placeholder="مثلاً: خرید موبایل و تبلت"
              variant="filled"
            />
          </AdminField>

          <AdminField label="توضیحات متا" hint="فارسی / اختیاری">
            <AdminTextarea
              rows={3}
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              placeholder="مثلاً: مشاهده و خرید انواع موبایل، تبلت و لوازم جانبی با قیمت مناسب."
              variant="filled"
            />
          </AdminField>

          <AdminField label="کلمات کلیدی" hint="با «،» جدا کن">
            <AdminInput
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="موبایل، تبلت، گوشی هوشمند"
              variant="filled"
            />
          </AdminField>
        </section>
      </div>

      <div className={cn("flex flex-col-reverse gap-2 border-t border-[color:var(--adm-border)] bg-[var(--adm-surface)] sm:flex-row sm:items-center sm:justify-between", isModal ? "mt-5 pt-5" : "p-5")}>
        <AdminButton variant="secondary" onClick={isEdit ? onCancelEdit : resetCreateForm}>
          {isEdit ? "لغو ویرایش" : "پاک کردن فرم"}
        </AdminButton>
        <AdminButton variant="primary" onClick={handleSubmit} leftIcon={isEdit ? Edit : Plus}>
          {isEdit ? "ذخیره تغییرات" : "ایجاد دسته‌بندی"}
        </AdminButton>
      </div>
    </div>
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
      <p className="text-sm text-[var(--adm-text)]">
        آیا از حذف <span className="font-semibold">{category?.name}</span> مطمئن هستید؟
      </p>
      <p className="mt-2 text-sm text-[var(--adm-text-muted)]">
        اگر زیر‌دسته یا محصول داشته باشد، بک‌اند مانع حذف می‌شود.
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
      <AdminIconButton
        ref={btnRef}
        onClick={() => setOpen((o) => !o)}
        label="عملیات"
        intent="muted"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <MoreVertical className="h-4 w-4" />
      </AdminIconButton>

      {open && (
        <div
          ref={menuRef}
          role="menu"
          className="absolute left-0 top-full z-50 mt-1 w-44 overflow-hidden rounded-xl border border-[color:var(--adm-border)] bg-[var(--adm-surface)] shadow-xl"
        >
          <button
            role="menuitem"
            onClick={() => handle(onAddChild)}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[var(--adm-text)] transition hover:bg-[var(--adm-surface-2)]"
          >
            <Plus className="h-4 w-4" />
            زیر‌دسته جدید
          </button>
          <button
            role="menuitem"
            onClick={() => handle(onEdit)}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[var(--adm-text)] transition hover:bg-[var(--adm-surface-2)]"
          >
            <Edit className="h-4 w-4" />
            ویرایش
          </button>
          <button
            role="menuitem"
            onClick={() => handle(onDelete)}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[var(--adm-error)] transition hover:bg-[var(--adm-error-soft)]"
          >
            <Trash2 className="h-4 w-4" />
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
  const padRight = 14 + depth * 22;
  const descendantCount = countDescendants(node);
  const rowBg = isOpen || isAncestorHighlighted ? "var(--adm-primary-soft)" : "var(--adm-surface)";

  return (
    <div className="relative">
      {depth > 0 ? (
        <div className="absolute inset-y-0" style={{ right: 13 + (depth - 1) * 22, width: 2 }}>
          <div className="h-full w-px bg-[var(--adm-border)]" />
        </div>
      ) : null}

      <div
        role="treeitem"
        aria-expanded={hasChildren ? isOpen : undefined}
        tabIndex={0}
        className="group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-[color:var(--adm-border)] px-3 py-3 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--adm-ring)] xl:grid-cols-[minmax(0,1fr)_auto_auto_auto]"
        style={{ paddingRight: padRight, background: rowBg, color: "var(--adm-text)" }}
        onKeyDown={(e) => {
          if (!hasChildren) return;
          if (e.key === "ArrowLeft" && isOpen) onToggleExpand(node._id);
          if (e.key === "ArrowRight" && !isOpen) onToggleExpand(node._id);
        }}
        title={node.name}
      >
        <div className="flex min-w-0 items-center gap-3">
          {hasChildren ? (
            <button
              onClick={() => onToggleExpand(node._id)}
              className="rounded-xl p-1.5 text-[var(--adm-text-muted)] transition hover:bg-[var(--adm-surface-2)] hover:text-[var(--adm-text)]"
              title={isOpen ? "بستن" : "بازکردن"}
              aria-label={isOpen ? "بستن" : "بازکردن"}
            >
              {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          ) : (
            <span className="w-7" />
          )}

          <div className="hidden h-11 w-11 shrink-0 overflow-hidden rounded-2xl border border-[color:var(--adm-border)] bg-[var(--adm-surface-2)] sm:block">
            {node.image ? (
              <img src={node.image} alt={node.imageAlt || node.name} className="h-full w-full object-cover" loading="lazy" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[var(--adm-text-muted)]">
                {isOpen ? <FolderOpen className="h-5 w-5" /> : <Folder className="h-5 w-5" />}
              </div>
            )}
          </div>

          <div className="min-w-0">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <span className="truncate text-sm font-bold sm:text-base" title={node.name}>
                {node._highlightedName || node.name}
              </span>
              {hasChildren ? <AdminBadge variant="info">{node.children.length} زیر‌دسته</AdminBadge> : null}
              {descendantCount > node.children.length ? <AdminBadge variant="neutral">{descendantCount} کل</AdminBadge> : null}
              {!node.isActive ? <AdminBadge variant="warning">غیرفعال</AdminBadge> : null}
            </div>
            <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--adm-text-muted)]">
              <span className="truncate" dir="ltr">/{node._highlightedSlug || node.slug}</span>
              {node.metaTitle ? <span className="hidden max-w-[220px] truncate md:inline">{node.metaTitle}</span> : null}
            </div>
          </div>
        </div>

        <div className="hidden items-center gap-1 justify-self-end xl:flex">
          <button
            className="rounded-xl p-2 text-[var(--adm-text-muted)] transition hover:bg-[var(--adm-surface-2)] hover:text-[var(--adm-text)]"
            onClick={() => onMoveUp(node)}
            title="بالا"
            aria-label="بالا"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
          <button
            className="rounded-xl p-2 text-[var(--adm-text-muted)] transition hover:bg-[var(--adm-surface-2)] hover:text-[var(--adm-text)]"
            onClick={() => onMoveDown(node)}
            title="پایین"
            aria-label="پایین"
          >
            <ArrowDown className="h-4 w-4" />
          </button>
        </div>

        <div className="hidden justify-self-end xl:block">
          <button
            onClick={() => onToggleActive(node)}
            className={cn(
              "inline-flex items-center gap-1 rounded-xl border px-3 py-1.5 text-sm font-semibold transition",
              node.isActive
                ? "border-[color:var(--adm-success)] bg-[var(--adm-success-soft)] text-[var(--adm-success)]"
                : "border-[color:var(--adm-border)] bg-transparent text-[var(--adm-text-muted)] hover:bg-[var(--adm-surface-2)] hover:text-[var(--adm-text)]"
            )}
            title="فعال/غیرفعال"
            aria-pressed={node.isActive}
            aria-label={node.isActive ? "فعال" : "غیرفعال"}
          >
            {node.isActive ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
            {node.isActive ? "فعال" : "غیرفعال"}
          </button>
        </div>

        <div className="justify-self-end">
          <div className="hidden items-center gap-1 lg:flex">
            <button
              onClick={() => onAddChild(node)}
              className="rounded-xl p-2 text-[var(--adm-text-muted)] transition hover:bg-[var(--adm-primary-soft)] hover:text-[var(--adm-primary)]"
              title="زیر‌دسته"
              aria-label="زیر‌دسته"
            >
              <Plus className="h-4 w-4" />
            </button>
            <button
              onClick={() => onEdit(node)}
              className="rounded-xl p-2 text-[var(--adm-text-muted)] transition hover:bg-[var(--adm-surface-2)] hover:text-[var(--adm-text)]"
              title="ویرایش"
              aria-label="ویرایش"
            >
              <Edit className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDelete(node)}
              className="rounded-xl p-2 text-[var(--adm-text-muted)] transition hover:bg-[var(--adm-error-soft)] hover:text-[var(--adm-error)]"
              title="حذف"
              aria-label="حذف"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          <div className="lg:hidden">
            <ActionMenu node={node} onAddChild={onAddChild} onEdit={onEdit} onDelete={onDelete} />
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
  CategoryFormPanel,
  ConfirmDeleteModal,
  ActionMenu,
  Row,
};
