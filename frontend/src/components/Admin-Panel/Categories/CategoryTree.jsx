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
  HelpCircle,
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
const normalizeSlugInput = (str = "") =>
  str
    .toString()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]+/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+/g, "");

const slugify = (str = "") => normalizeSlugInput(str).replace(/-+$/g, "");

const KEYWORD_SEPARATOR = "، ";
const KEYWORD_SPLIT_RE = /[،,]/;

const parseKeywords = (keywords) => {
  const source = Array.isArray(keywords) ? keywords.join(KEYWORD_SEPARATOR) : keywords;
  return String(source || "")
    .split(KEYWORD_SPLIT_RE)
    .map((k) => k.trim())
    .filter(Boolean);
};

const uniqueKeywords = (items) => {
  const seen = new Set();
  return items.filter((item) => {
    const key = item.trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const compareCategoryOrder = (a, b) =>
  (a.sortOrder ?? 0) - (b.sortOrder ?? 0) ||
  String(a.createdAt || "").localeCompare(String(b.createdAt || "")) ||
  String(a._id || "").localeCompare(String(b._id || ""));

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
    nodes.sort(compareCategoryOrder);
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

function FieldHelpLabel({ label, description }) {
  return (
    <span className="relative inline-flex items-center gap-1.5 align-middle group/help">
      <span>{label}</span>
      <span
        className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-[color:var(--adm-border)] bg-[var(--adm-surface)] text-[var(--adm-text-muted)] transition group-hover/help:border-[color:var(--adm-primary)] group-hover/help:text-[var(--adm-primary)]"
        aria-hidden="true"
      >
        <HelpCircle className="h-3.5 w-3.5" />
      </span>
      <span className="pointer-events-none absolute right-0 top-full z-[70] mt-2 w-64 translate-y-1 rounded-2xl border border-[color:var(--adm-border)] bg-[var(--adm-surface)] p-3 text-xs leading-6 text-[var(--adm-text)] opacity-0 shadow-[0_20px_60px_var(--adm-shadow)] transition duration-150 group-hover/help:translate-y-0 group-hover/help:opacity-100">
        {description}
      </span>
    </span>
  );
}

function SectionTitle({ title, description }) {
  return (
    <h3 className="text-sm font-bold text-[var(--adm-text)]">
      <FieldHelpLabel label={title} description={description} />
    </h3>
  );
}

function KeywordTagsInput({ tags, draft, onChangeTags, onChangeDraft }) {
  const commitKeywords = (raw) => {
    const parsed = parseKeywords(raw);
    if (!parsed.length) return;
    onChangeTags(uniqueKeywords([...(tags || []), ...parsed]));
  };

  const handleChange = (event) => {
    const next = event.target.value;
    if (KEYWORD_SPLIT_RE.test(next)) {
      const parts = next.split(KEYWORD_SPLIT_RE);
      const pending = parts.pop() || "";
      commitKeywords(parts.join(KEYWORD_SEPARATOR));
      onChangeDraft(pending);
      return;
    }
    onChangeDraft(next);
  };

  const removeKeyword = (index) => {
    onChangeTags((tags || []).filter((_, i) => i !== index));
  };

  const handleKeyDown = (event) => {
    if ((event.key === "Enter" || event.key === "Tab") && draft.trim()) {
      event.preventDefault();
      commitKeywords(draft);
      onChangeDraft("");
      return;
    }

    if (event.key === "Backspace" && !draft && tags?.length) {
      event.preventDefault();
      onChangeTags(tags.slice(0, -1));
    }
  };

  const handleBlur = () => {
    if (!draft.trim()) return;
    commitKeywords(draft);
    onChangeDraft("");
  };

  return (
    <div className="min-h-11 rounded-xl border border-[color:var(--adm-border)] bg-[var(--adm-surface-2)] px-2 py-2 focus-within:ring-2 focus-within:ring-[color:var(--adm-ring)] focus-within:ring-offset-2 focus-within:ring-offset-[color:var(--adm-bg)]">
      <div className="flex flex-wrap items-center gap-2">
        {(tags || []).map((tag, index) => (
          <span
            key={`${tag}-${index}`}
            className="inline-flex items-center gap-1 rounded-xl border border-[color:var(--adm-border)] bg-[var(--adm-surface)] px-2.5 py-1 text-xs font-semibold text-[var(--adm-text)]"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeKeyword(index)}
              className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[var(--adm-error)] transition hover:bg-[var(--adm-error-soft)]"
              aria-label={`حذف ${tag}`}
              title="حذف"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        ))}

        <input
          value={draft}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder={(tags || []).length ? "کلمه بعدی..." : "موبایل، تبلت، گوشی هوشمند"}
          className="h-7 min-w-36 flex-1 bg-transparent text-sm text-[var(--adm-text)] placeholder:text-[var(--adm-text-muted)] focus:outline-none"
        />
      </div>
    </div>
  );
}

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
                  onClick={() => {
                    onChangeImage("");
                    onChangeImageAlt("");
                  }}
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
            <AdminField
              label={
                <FieldHelpLabel
                  label="آدرس تصویر"
                  description="آدرس عمومی تصویر دسته‌بندی است. می‌توانی آن را با آپلود خودکار پر کنی یا یک URL معتبر وارد کنی."
                />
              }
              hint="اختیاری"
            >
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
            <AdminField
              label={
                <FieldHelpLabel
                  label="متن جایگزین"
                  description="متنی کوتاه برای توضیح تصویر است و به SEO، دسترس‌پذیری و نمایش بهتر تصویر کمک می‌کند."
                />
              }
              hint="برای SEO و دسترس‌پذیری"
            >
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
  const isParentLocked = Boolean(parentDraft?._id && !isEdit);
  const [name, setName] = useState(initial?.name || "");
  const [slug, setSlug] = useState(initial?.slug || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [image, setImage] = useState(initial?.image || "");
  const [imageAlt, setImageAlt] = useState(initial?.imageAlt || "");
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [parent, setParent] = useState(parentDraft?._id || initial?.parent?._id || initial?.parent || "");
  const [metaTitle, setMetaTitle] = useState(initial?.metaTitle || "");
  const [metaDescription, setMetaDescription] = useState(initial?.metaDescription || "");
  const [keywordTags, setKeywordTags] = useState(parseKeywords(initial?.keywords));
  const [keywordDraft, setKeywordDraft] = useState("");

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
    setKeywordTags(parseKeywords(initial?.keywords));
    setKeywordDraft("");
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
    setKeywordTags([]);
    setKeywordDraft("");
  };

  const handleSubmit = () => {
    const finalName = name.trim();
    const finalSlug = normalizeSlugInput(slug).trim();

    if (!finalName) return toast.error("نام دسته‌بندی را وارد کنید");
    if (!finalSlug) return toast.error("اسلاگ را وارد کنید");
    if (finalSlug.endsWith("-")) return toast.error("آخرین کاراکتر اسلاگ نباید خط تیره باشد");

    if (image && !String(image).trim().startsWith("/")) {
      try {
        new URL(image);
      } catch {
        return toast.error("آدرس تصویر باید URL معتبر یا مسیر داخلی مثل /assets/... باشد");
      }
    }

    const finalKeywords = uniqueKeywords([
      ...keywordTags,
      ...parseKeywords(keywordDraft),
    ]);

    const payload = {
      ...(isEdit ? { id: initial._id } : {}),
      name: finalName,
      slug: finalSlug,
      description: description?.trim(),
      image: image?.trim() || (isEdit ? "" : undefined),
      imageAlt: image?.trim()
        ? imageAlt?.trim() || finalName
        : isEdit
          ? ""
          : undefined,
      isActive,
      parent: parent || null,
      metaTitle: metaTitle?.trim() || `خرید ${finalName}`,
      metaDescription:
        metaDescription?.trim() ||
        description?.trim() ||
        `مشاهده و خرید محصولات دسته ${finalName} در فروشگاه.`,
      keywords: finalKeywords,
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
            <SectionTitle
              title="اطلاعات اصلی"
              description="اطلاعات پایه دسته‌بندی شامل نام، اسلاگ، والد و توضیحاتی است که ساختار فروشگاه را مشخص می‌کند."
            />
          </div>

          <AdminField
            label={
              <FieldHelpLabel
                label="نام دسته‌بندی"
                description="نام نمایشی دسته است و در پنل مدیریت و معمولاً در صفحات فروشگاه نمایش داده می‌شود."
              />
            }
            required
          >
            <AdminInput
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثلاً: موبایل و تبلت"
              variant="filled"
            />
          </AdminField>

          <AdminField
            label={
              <FieldHelpLabel
                label="اسلاگ"
                description="اسلاگ بخش خوانای URL است. فقط حروف انگلیسی، عدد و خط تیره مجاز است؛ در زمان ذخیره نباید با خط تیره تمام شود."
              />
            }
            hint="فقط حروف انگلیسی، عدد و خط تیره"
            required
          >
            <div className="space-y-2">
              <AdminInput
                value={slug}
                onChange={(e) => setSlug(normalizeSlugInput(e.target.value))}
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

          <AdminField
            label={
              <FieldHelpLabel
                label="والد"
                description="با انتخاب والد، این دسته به زیر‌دسته تبدیل می‌شود. هنگام ساخت زیر‌دسته از دکمه +، والد ثابت و غیرقابل تغییر است."
              />
            }
            hint={isParentLocked ? "ثابت" : "برای ساخت درخت دسته‌بندی"}
          >
            {isParentLocked ? (
              <div className="flex h-10 items-center rounded-xl border border-[color:var(--adm-border)] bg-[var(--adm-surface-2)] px-3 text-sm font-semibold text-[var(--adm-text-muted)]">
                {parentDraft.name}
              </div>
            ) : (
              <AdminSelect value={parent} onChange={(e) => setParent(e.target.value)} variant="filled">
                <option value="">— بدون والد</option>
                {options.map((o) => (
                  <option key={o._id} value={o._id}>
                    {o.name}
                  </option>
                ))}
              </AdminSelect>
            )}
          </AdminField>

          <AdminField
            label={
              <FieldHelpLabel
                label="توضیحات"
                description="توضیح کوتاهی درباره کاربرد یا محتوای این دسته است و می‌تواند در صفحه دسته‌بندی یا برای مدیریت داخلی استفاده شود."
              />
            }
            hint="اختیاری"
          >
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
              <span className="block text-sm font-semibold text-[var(--adm-text)]">
                <FieldHelpLabel
                  label="وضعیت نمایش"
                  description="اگر فعال باشد، دسته در بخش‌های قابل نمایش فروشگاه استفاده می‌شود؛ اگر غیرفعال باشد برای مدیریت داخلی باقی می‌ماند."
                />
              </span>
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
            <SectionTitle
              title="تصویر"
              description="تصویر دسته‌بندی برای نمایش بهتر در فروشگاه و تشخیص سریع‌تر دسته‌ها در پنل مدیریت استفاده می‌شود."
            />
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
            <SectionTitle
              title="سئو"
              description="این بخش برای بهینه‌سازی عنوان، توضیحات و کلمات کلیدی دسته در موتورهای جستجو استفاده می‌شود."
            />
            <p className="mt-1 text-xs text-[var(--adm-text-muted)]">
              عنوان و توضیحات متا فارسی نوشته می‌شوند. کلمات کلیدی را با ویرگول «،» جدا کنید.
            </p>
          </div>

          <AdminField
            label={
              <FieldHelpLabel
                label="عنوان متا"
                description="عنوانی کوتاه و فارسی برای نتیجه جستجو است. بهتر است شامل نام دسته و عبارت خرید باشد."
              />
            }
            hint="فارسی / اختیاری"
          >
            <AdminInput
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
              placeholder="مثلاً: خرید موبایل و تبلت"
              variant="filled"
            />
          </AdminField>

          <AdminField
            label={
              <FieldHelpLabel
                label="توضیحات متا"
                description="توضیحی کوتاه برای نمایش در نتایج جستجو است. بهتر است طبیعی، فارسی و مرتبط با محصولات این دسته باشد."
              />
            }
            hint="فارسی / اختیاری"
          >
            <AdminTextarea
              rows={3}
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              placeholder="مثلاً: مشاهده و خرید انواع موبایل، تبلت و لوازم جانبی با قیمت مناسب."
              variant="filled"
            />
          </AdminField>

          <AdminField
            label={
              <FieldHelpLabel
                label="کلمات کلیدی"
                description="هر کلمه یا عبارت را با ویرگول فارسی «،» جدا کن. هر مورد به‌صورت باکس جدا نمایش داده می‌شود و با Backspace یا دکمه ضربدر حذف می‌شود."
              />
            }
            hint="با «،» جدا کن"
          >
            <KeywordTagsInput
              tags={keywordTags}
              draft={keywordDraft}
              onChangeTags={setKeywordTags}
              onChangeDraft={setKeywordDraft}
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
  const depthTone = Math.min(depth, 4);
  const nestedSurfaceBg =
    depth > 0
      ? `color-mix(in srgb, var(--adm-surface-2) ${Math.min(42 + depthTone * 8, 74)}%, var(--adm-surface))`
      : "var(--adm-surface)";
  const expandedBg =
    depth > 0
      ? `color-mix(in srgb, var(--adm-primary-soft) ${Math.min(76 + depthTone * 5, 92)}%, var(--adm-primary) ${Math.min(4 + depthTone * 3, 16)}%)`
      : "var(--adm-primary-soft)";
  const rowBg = isOpen || isAncestorHighlighted ? expandedBg : nestedSurfaceBg;

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
        className="group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-[color:var(--adm-border)] px-3 py-3 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--adm-ring)] xl:grid-cols-[minmax(0,1fr)_92px_118px_132px]"
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

        <div className="hidden w-[92px] items-center justify-center gap-1 justify-self-center xl:flex">
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

        <div className="hidden w-[118px] justify-self-center text-center xl:block">
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

        <div className="w-[132px] justify-self-end xl:justify-self-center">
          <div className="hidden items-center justify-center gap-1 lg:flex">
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
