"use client";

import { useEffect, useMemo, useState } from "react";
import apiClient from "@/common/apiClient";
import { toast } from "react-toastify";
import {
  AdminButton,
  AdminField,
  AdminInput,
  AdminModal,
  AdminSelect,
  AdminTextarea,
} from "@/components/admin-ui";
import backApis from "@/common/inedx";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "basic", label: "عمومی" },
  { id: "pricing", label: "قیمت‌گذاری" },
  { id: "inventory", label: "موجودی" },
  { id: "media", label: "رسانه" },
  { id: "seo", label: "سئو" },
];

const emptyProduct = () => ({
  title: "",
  slug: "",
  shortDescription: "",
  overviewHtml: "",
  categoryId: "",
  tags: "",
  status: "DRAFT",
  visible: true,
  price: "",
  currency: "IRT",
  compareAt: "",
  cost: "",
  inventoryManage: true,
  inventoryQty: "0",
  stockStatus: "IN_STOCK",
  lowStockThreshold: "",
  allowBackorder: false,
  seoTitle: "",
  seoDescription: "",
  seoCanonicalUrl: "",
  images: [],
});

const toIntOrEmpty = (v) => {
  if (v === "" || v === undefined || v === null) return "";
  const n = Number(v);
  if (!Number.isFinite(n)) return "";
  return String(Math.trunc(n));
};

const slugify = (value) => {
  const s = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return s;
};

function TabButton({ active, children, ...props }) {
  return (
    <button
      type="button"
      className={cn(
        "h-10 px-4 rounded-xl text-sm font-semibold whitespace-nowrap transition border",
        active
          ? "bg-[var(--adm-primary-soft)] text-[var(--adm-primary)] border-[color:var(--adm-border)]"
          : "bg-[var(--adm-surface)] text-[var(--adm-text)] border-[color:var(--adm-border)] hover:bg-[var(--adm-surface-2)]"
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export default function ProductEditorModal({
  open,
  onClose,
  mode = "create", // create | edit
  productId,
  categories = [],
  onSaved,
}) {
  const isEdit = mode === "edit";
  const [activeTab, setActiveTab] = useState("basic");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  const [form, setForm] = useState(emptyProduct);
  const [errors, setErrors] = useState({});

  // Media tab helper state
  const [imgUrl, setImgUrl] = useState("");
  const [imgAlt, setImgAlt] = useState("");
  const [editingImgIndex, setEditingImgIndex] = useState(null);

  const titleText = isEdit ? "ویرایش محصول" : "ایجاد محصول";

  const categoriesSorted = useMemo(() => {
    const list = Array.isArray(categories) ? categories : [];
    return [...list].sort((a, b) => String(a?.name || "").localeCompare(String(b?.name || ""), "fa"));
  }, [categories]);

  useEffect(() => {
    if (!open) return;
    setActiveTab("basic");
    setErrors({});

    if (!isEdit) {
      setForm(emptyProduct());
      setImgUrl("");
      setImgAlt("");
      setEditingImgIndex(null);
      return;
    }

    if (!productId) return;

    (async () => {
      try {
        setFetching(true);
        const { url } = backApis.getSingleProduct(productId);
        const res = await apiClient.get(url);
        const p = res?.data?.data || res?.data?.data?.data || res?.data?.data;

        const tagsStr = Array.isArray(p?.tags) ? p.tags.join(", ") : "";
        const invManage = typeof p?.inventory?.manage === "boolean" ? p.inventory.manage : true;
        const invQty = p?.inventory?.qty ?? 0;

        setForm((prev) => ({
          ...prev,
          title: p?.title || "",
          slug: p?.slug || "",
          shortDescription: p?.shortDescription || "",
          overviewHtml: p?.overviewHtml || "",
          categoryId: p?.categoryId?._id || p?.categoryId || "",
          tags: tagsStr,
          status: p?.status || "DRAFT",
          visible: typeof p?.visible === "boolean" ? p.visible : true,
          price: p?.price ?? "",
          currency: p?.currency || "IRT",
          compareAt: p?.compareAt ?? "",
          cost: p?.cost ?? "",
          inventoryManage: invManage,
          inventoryQty: invQty,
          stockStatus: p?.stockStatus || "IN_STOCK",
          lowStockThreshold: p?.lowStockThreshold ?? "",
          allowBackorder: !!p?.allowBackorder,
          seoTitle: p?.seo?.title || "",
          seoDescription: p?.seo?.description || "",
          seoCanonicalUrl: p?.seo?.canonicalUrl || "",
          images: Array.isArray(p?.images) ? p.images : [],
        }));

        // reset media editor
        setImgUrl("");
        setImgAlt("");
        setEditingImgIndex(null);
      } catch (err) {
        console.error(err);
        toast.error("خطا در دریافت اطلاعات محصول");
      } finally {
        setFetching(false);
      }
    })();
  }, [open, isEdit, productId]);

  // auto-slug (only when user hasn't typed slug)
  useEffect(() => {
    if (!open) return;
    if (isEdit) return;
    if (form.slug) return;
    const suggested = slugify(form.title);
    if (suggested && suggested !== form.slug) {
      setForm((p) => ({ ...p, slug: suggested }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.title]);

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = () => {
    const e = {};

    if (!String(form.title).trim()) e.title = "عنوان الزامی است";
    const s = String(form.slug || "").trim().toLowerCase();
    if (!s) e.slug = "اسلاگ الزامی است";
    else if (!/^[a-z0-9-]+$/.test(s)) e.slug = "فقط حروف انگلیسی، ارقام و -";

    if (!String(form.shortDescription).trim()) e.shortDescription = "توضیح کوتاه الزامی است";
    if (!String(form.categoryId).trim()) e.categoryId = "دسته‌بندی را انتخاب کنید";

    if (form.price === "" || form.price === null || form.price === undefined) {
      e.price = "قیمت الزامی است";
    } else {
      const n = Number(form.price);
      if (!Number.isInteger(n) || n < 0) e.price = "قیمت باید عدد صحیح و >= 0 باشد";
    }

    if (!String(form.currency || "").trim()) e.currency = "واحد پول الزامی است";

    if (!Array.isArray(form.images) || !form.images.length) {
      e.images = "حداقل یک تصویر لازم است";
    } else {
      const primaryCount = form.images.filter((i) => i?.isPrimary).length;
      if (primaryCount !== 1) e.images = "باید دقیقاً یک تصویر اصلی داشته باشید";
      for (let idx = 0; idx < form.images.length; idx++) {
        const it = form.images[idx];
        if (!String(it?.url || "").trim() || !String(it?.alt || "").trim()) {
          e.images = "برای هر تصویر url و alt الزامی است";
          break;
        }
      }
    }

    // Optional integers
    const optionalInts = [
      ["compareAt", "compareAt"],
      ["cost", "cost"],
      ["inventoryQty", "inventoryQty"],
      ["lowStockThreshold", "lowStockThreshold"],
    ];

    for (const [key] of optionalInts) {
      const v = form[key];
      if (v === "" || v === undefined || v === null) continue;
      const n = Number(v);
      if (!Number.isInteger(n) || n < 0) {
        e[key] = "باید عدد صحیح و >= 0 باشد";
      }
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const buildPayload = () => {
    const tagsArr = String(form.tags || "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const payload = {
      title: String(form.title).trim(),
      slug: String(form.slug).trim().toLowerCase(),
      shortDescription: String(form.shortDescription).trim(),
      overviewHtml: String(form.overviewHtml || ""),
      categoryId: form.categoryId,
      tags: tagsArr,
      status: form.status,
      visible: !!form.visible,
      price: Number(form.price),
      currency: String(form.currency).trim().toUpperCase(),
      images: form.images.map((i) => ({
        url: String(i.url).trim(),
        alt: String(i.alt).trim(),
        isPrimary: !!i.isPrimary,
      })),

      // Optional
      compareAt: form.compareAt === "" ? undefined : Number(form.compareAt),
      cost: form.cost === "" ? undefined : Number(form.cost),
      inventory: {
        manage: !!form.inventoryManage,
        qty: form.inventoryQty === "" ? 0 : Number(form.inventoryQty),
      },
      stockStatus: form.stockStatus,
      lowStockThreshold:
        form.lowStockThreshold === "" ? undefined : Number(form.lowStockThreshold),
      allowBackorder: !!form.allowBackorder,
      seo: {
        title: String(form.seoTitle || "").trim(),
        description: String(form.seoDescription || "").trim(),
        canonicalUrl: String(form.seoCanonicalUrl || "").trim(),
      },
    };

    // Cleanup empty seo
    if (!payload.seo.title && !payload.seo.description && !payload.seo.canonicalUrl) {
      delete payload.seo;
    }

    if (payload.compareAt === undefined) delete payload.compareAt;
    if (payload.cost === undefined) delete payload.cost;
    if (payload.lowStockThreshold === undefined) delete payload.lowStockThreshold;

    return payload;
  };

  const onSubmit = async () => {
    if (!validate()) {
      toast.error("لطفاً فیلدهای اجباری را کامل کنید");
      return;
    }

    try {
      setLoading(true);

      const payload = buildPayload();

      if (isEdit) {
        const { url, method } = backApis.updateProduct(productId);
        await apiClient({ method, url, data: payload });
        toast.success("محصول بروزرسانی شد");
      } else {
        const { url, method } = backApis.createProduct;
        await apiClient({ method, url, data: payload });
        toast.success("محصول ایجاد شد");
      }

      onSaved?.();
      onClose?.();
    } catch (err) {
      console.error(err);
      const msg = err?.response?.data?.message;
      toast.error(msg || "خطا در ذخیره محصول");
    } finally {
      setLoading(false);
    }
  };

  // Media tab operations
  const addOrUpdateImage = () => {
    const url = String(imgUrl || "").trim();
    const alt = String(imgAlt || "").trim();

    if (!url || !alt) {
      toast.error("url و alt تصویر الزامی است");
      return;
    }

    setForm((prev) => {
      const next = { ...prev };
      const imgs = Array.isArray(next.images) ? [...next.images] : [];

      if (editingImgIndex !== null && editingImgIndex >= 0) {
        imgs[editingImgIndex] = { ...imgs[editingImgIndex], url, alt };
      } else {
        const willBePrimary = imgs.length === 0;
        imgs.push({ url, alt, isPrimary: willBePrimary });
      }

      // Enforce one primary
      const primaryCount = imgs.filter((i) => i.isPrimary).length;
      if (primaryCount === 0 && imgs.length) imgs[0].isPrimary = true;
      if (primaryCount > 1) {
        let seen = false;
        for (const i of imgs) {
          if (i.isPrimary && !seen) {
            seen = true;
          } else {
            i.isPrimary = false;
          }
        }
      }

      next.images = imgs;
      return next;
    });

    setImgUrl("");
    setImgAlt("");
    setEditingImgIndex(null);
    setErrors((prev) => ({ ...prev, images: undefined }));
  };

  const startEditImage = (idx) => {
    const img = form.images?.[idx];
    if (!img) return;
    setEditingImgIndex(idx);
    setImgUrl(img.url || "");
    setImgAlt(img.alt || "");
  };

  const cancelEditImage = () => {
    setEditingImgIndex(null);
    setImgUrl("");
    setImgAlt("");
  };

  const setPrimary = (idx) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.map((img, i) => ({
        ...img,
        isPrimary: i === idx,
      })),
    }));
    setErrors((prev) => ({ ...prev, images: undefined }));
  };

  const removeImage = (idx) => {
    setForm((prev) => {
      const imgs = prev.images.filter((_, i) => i !== idx);
      if (imgs.length && imgs.filter((i) => i.isPrimary).length !== 1) {
        imgs.forEach((i) => (i.isPrimary = false));
        imgs[0].isPrimary = true;
      }
      return { ...prev, images: imgs };
    });
    setErrors((prev) => ({ ...prev, images: undefined }));
  };

  const tabsHeader = (
    <div className="-mx-5 px-5 pb-4 border-b border-[color:var(--adm-border)]">
      <div className="flex items-center gap-2 overflow-x-auto">
        {TABS.map((t) => (
          <TabButton
            key={t.id}
            active={activeTab === t.id}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </TabButton>
        ))}
      </div>
    </div>
  );

  const footer = (
    <div className="flex items-center justify-between gap-3">
      <div className="text-xs text-[var(--adm-text-muted)]">
        فیلدهای ستاره‌دار الزامی هستند.
      </div>
      <div className="flex items-center gap-2">
        <AdminButton variant="secondary" onClick={onClose} disabled={loading}>
          انصراف
        </AdminButton>
        <AdminButton onClick={onSubmit} loading={loading} disabled={fetching}>
          ذخیره
        </AdminButton>
      </div>
    </div>
  );

  return (
    <AdminModal
      open={open}
      onClose={onClose}
      size="xl"
      title={titleText}
      description={
        isEdit
          ? "اطلاعات محصول را ویرایش کنید."
          : "یک محصول جدید ایجاد کنید."
      }
      footer={footer}
    >
      {tabsHeader}

      {fetching ? (
        <div className="py-10 flex items-center justify-center">
          <div
            className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: "var(--adm-primary)", borderTopColor: "transparent" }}
            aria-label="loading"
          />
        </div>
      ) : null}

      {!fetching ? (
        <div className="pt-4">
          {activeTab === "basic" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AdminField label="عنوان" required error={errors.title} className="md:col-span-2">
                <AdminInput
                  value={form.title}
                  onChange={(e) => setField("title", e.target.value)}
                  placeholder="مثلاً: گوشی سامسونگ A55"
                />
              </AdminField>

              <AdminField label="اسلاگ" required hint="فقط a-z 0-9 و -" error={errors.slug}>
                <AdminInput
                  value={form.slug}
                  onChange={(e) => setField("slug", slugify(e.target.value))}
                  placeholder="مثلاً: samsung-a55"
                />
              </AdminField>

              <AdminField label="دسته‌بندی" required error={errors.categoryId}>
                <AdminSelect
                  value={form.categoryId}
                  onChange={(e) => setField("categoryId", e.target.value)}
                >
                  <option value="">انتخاب کنید…</option>
                  {categoriesSorted.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </AdminSelect>
              </AdminField>

              <AdminField label="وضعیت">
                <AdminSelect
                  value={form.status}
                  onChange={(e) => setField("status", e.target.value)}
                >
                  <option value="DRAFT">پیش‌نویس</option>
                  <option value="ACTIVE">فعال</option>
                  <option value="ARCHIVED">آرشیو</option>
                </AdminSelect>
              </AdminField>

              <AdminField label="نمایش در سایت">
                <AdminSelect
                  value={form.visible ? "true" : "false"}
                  onChange={(e) => setField("visible", e.target.value === "true")}
                >
                  <option value="true">نمایش داده شود</option>
                  <option value="false">مخفی</option>
                </AdminSelect>
              </AdminField>

              <AdminField label="توضیح کوتاه" required error={errors.shortDescription} className="md:col-span-2">
                <AdminTextarea
                  value={form.shortDescription}
                  onChange={(e) => setField("shortDescription", e.target.value)}
                  placeholder="یک توضیح کوتاه تا 160 کاراکتر"
                />
              </AdminField>

              <AdminField label="توضیحات کامل" hint="(اختیاری)" className="md:col-span-2">
                <AdminTextarea
                  value={form.overviewHtml}
                  onChange={(e) => setField("overviewHtml", e.target.value)}
                  placeholder="توضیحات بیشتر…"
                />
              </AdminField>

              <AdminField label="تگ‌ها" hint="با کاما جدا کنید" className="md:col-span-2">
                <AdminInput
                  value={form.tags}
                  onChange={(e) => setField("tags", e.target.value)}
                  placeholder="مثلاً: گوشی, سامسونگ, 5g"
                />
              </AdminField>
            </div>
          ) : null}

          {activeTab === "pricing" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AdminField label="قیمت" required error={errors.price}>
                <AdminInput
                  inputMode="numeric"
                  value={form.price}
                  onChange={(e) => setField("price", toIntOrEmpty(e.target.value))}
                  placeholder="مثلاً: 120000"
                />
              </AdminField>

              <AdminField label="واحد پول" required error={errors.currency}>
                <AdminSelect
                  value={form.currency}
                  onChange={(e) => setField("currency", e.target.value)}
                >
                  <option value="IRT">IRT</option>
                  <option value="IRR">IRR</option>
                  <option value="USD">USD</option>
                </AdminSelect>
              </AdminField>

              <AdminField label="قیمت قبل" hint="(اختیاری)" error={errors.compareAt}>
                <AdminInput
                  inputMode="numeric"
                  value={form.compareAt}
                  onChange={(e) => setField("compareAt", toIntOrEmpty(e.target.value))}
                  placeholder="مثلاً: 150000"
                />
              </AdminField>

              <AdminField label="هزینه" hint="(اختیاری)" error={errors.cost}>
                <AdminInput
                  inputMode="numeric"
                  value={form.cost}
                  onChange={(e) => setField("cost", toIntOrEmpty(e.target.value))}
                  placeholder="مثلاً: 90000"
                />
              </AdminField>
            </div>
          ) : null}

          {activeTab === "inventory" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AdminField label="مدیریت موجودی">
                <AdminSelect
                  value={form.inventoryManage ? "true" : "false"}
                  onChange={(e) => setField("inventoryManage", e.target.value === "true")}
                >
                  <option value="true">فعال</option>
                  <option value="false">غیرفعال</option>
                </AdminSelect>
              </AdminField>

              <AdminField label="موجودی" error={errors.inventoryQty}>
                <AdminInput
                  inputMode="numeric"
                  value={form.inventoryQty}
                  onChange={(e) => setField("inventoryQty", toIntOrEmpty(e.target.value))}
                  placeholder="مثلاً: 10"
                />
              </AdminField>

              <AdminField label="وضعیت انبار">
                <AdminSelect
                  value={form.stockStatus}
                  onChange={(e) => setField("stockStatus", e.target.value)}
                >
                  <option value="IN_STOCK">موجود</option>
                  <option value="OUT_OF_STOCK">ناموجود</option>
                  <option value="PREORDER">پیش‌فروش</option>
                </AdminSelect>
              </AdminField>

              <AdminField label="حداقل موجودی" hint="(اختیاری)" error={errors.lowStockThreshold}>
                <AdminInput
                  inputMode="numeric"
                  value={form.lowStockThreshold}
                  onChange={(e) => setField("lowStockThreshold", toIntOrEmpty(e.target.value))}
                  placeholder="مثلاً: 3"
                />
              </AdminField>

              <AdminField label="ثبت سفارش در ناموجودی">
                <AdminSelect
                  value={form.allowBackorder ? "true" : "false"}
                  onChange={(e) => setField("allowBackorder", e.target.value === "true")}
                >
                  <option value="false">خیر</option>
                  <option value="true">بله</option>
                </AdminSelect>
              </AdminField>
            </div>
          ) : null}

          {activeTab === "media" ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-[color:var(--adm-border)] bg-[var(--adm-surface-2)] p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <AdminField label="آدرس تصویر (url)" required>
                    <AdminInput
                      value={imgUrl}
                      onChange={(e) => setImgUrl(e.target.value)}
                      placeholder="https://..."
                    />
                  </AdminField>
                  <AdminField label="متن جایگزین (alt)" required>
                    <AdminInput
                      value={imgAlt}
                      onChange={(e) => setImgAlt(e.target.value)}
                      placeholder="مثلاً: نمای جلوی محصول"
                    />
                  </AdminField>
                </div>

                <div className="mt-3 flex items-center justify-end gap-2">
                  {editingImgIndex !== null ? (
                    <AdminButton variant="secondary" onClick={cancelEditImage}>
                      لغو
                    </AdminButton>
                  ) : null}
                  <AdminButton variant="primary" onClick={addOrUpdateImage}>
                    {editingImgIndex !== null ? "ذخیره تغییرات" : "افزودن تصویر"}
                  </AdminButton>
                </div>

                {errors.images ? (
                  <p className="mt-3 text-xs text-[var(--adm-error)]">{errors.images}</p>
                ) : null}
              </div>

              <AdminField
                label={`گالری تصاویر (${form.images.length})`}
                required
                error={errors.images}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {form.images.map((img, idx) => {
                    const isPrimary = !!img.isPrimary;
                    return (
                      <div
                        key={`${img.url}-${idx}`}
                        className={cn(
                          "rounded-2xl overflow-hidden border bg-[var(--adm-surface)]",
                          isPrimary
                            ? "border-[color:var(--adm-primary)]"
                            : "border-[color:var(--adm-border)]"
                        )}
                      >
                        <div className="aspect-square bg-[var(--adm-surface-2)]">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={img.url}
                            alt={img.alt}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>

                        <div className="p-3">
                          <div className="text-xs text-[var(--adm-text)] line-clamp-2 min-h-[32px]">
                            {img.alt}
                          </div>

                          <div className="mt-2 grid grid-cols-3 gap-2">
                            <button
                              type="button"
                              onClick={() => setPrimary(idx)}
                              className={cn(
                                "h-9 rounded-xl text-xs font-semibold border transition",
                                isPrimary
                                  ? "bg-[var(--adm-primary)] text-[var(--adm-on-primary)] border-[color:var(--adm-primary)]"
                                  : "bg-[var(--adm-surface)] text-[var(--adm-text)] border-[color:var(--adm-border)] hover:bg-[var(--adm-surface-2)]"
                              )}
                            >
                              {isPrimary ? "اصلی" : "اصلی کن"}
                            </button>

                            <button
                              type="button"
                              onClick={() => startEditImage(idx)}
                              className="h-9 rounded-xl text-xs font-semibold border border-[color:var(--adm-border)] bg-[var(--adm-surface)] text-[var(--adm-text)] hover:bg-[var(--adm-surface-2)] transition"
                            >
                              ویرایش
                            </button>

                            <button
                              type="button"
                              onClick={() => removeImage(idx)}
                              className="h-9 rounded-xl text-xs font-semibold border border-[color:var(--adm-border)] bg-[var(--adm-error-soft)] text-[var(--adm-error)] hover:opacity-90 transition"
                            >
                              حذف
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {form.images.length === 0 ? (
                    <div className="col-span-full p-6 rounded-2xl border border-dashed border-[color:var(--adm-border)] text-center text-sm text-[var(--adm-text-muted)]">
                      هنوز تصویری اضافه نشده است.
                    </div>
                  ) : null}
                </div>
              </AdminField>
            </div>
          ) : null}

          {activeTab === "seo" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AdminField label="SEO Title" hint="(اختیاری)" className="md:col-span-2">
                <AdminInput
                  value={form.seoTitle}
                  onChange={(e) => setField("seoTitle", e.target.value)}
                  placeholder="عنوان سئو"
                />
              </AdminField>

              <AdminField label="SEO Description" hint="(اختیاری)" className="md:col-span-2">
                <AdminTextarea
                  value={form.seoDescription}
                  onChange={(e) => setField("seoDescription", e.target.value)}
                  placeholder="توضیحات سئو"
                />
              </AdminField>

              <AdminField label="Canonical URL" hint="(اختیاری)" className="md:col-span-2">
                <AdminInput
                  value={form.seoCanonicalUrl}
                  onChange={(e) => setField("seoCanonicalUrl", e.target.value)}
                  placeholder="https://..."
                />
              </AdminField>
            </div>
          ) : null}
        </div>
      ) : null}
    </AdminModal>
  );
}
