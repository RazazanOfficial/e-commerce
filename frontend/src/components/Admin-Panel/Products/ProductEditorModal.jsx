"use client";

//? 🔵 Required Modules

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
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
import backApis from "@/common";
import { cn } from "@/lib/utils";
import ProductMediaEditor from "./ProductMediaEditor";

//* 🟢 Editor Constants
const TABS = [
  { id: "basic", label: "عمومی" },
  { id: "pricing", label: "قیمت‌گذاری" },
  { id: "inventory", label: "موجودی" },
  { id: "media", label: "رسانه" },
  { id: "seo", label: "سئو" },
];

//* 🟢 Form Defaults
const emptyProduct = () => ({
  title: "",
  slug: "",
  shortDescription: "",
  overviewHtml: "",
  categoryId: "",
  tags: "",
  status: "DRAFT",
  visible: false,
  price: "",
  currency: "",
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

//* 🟢 Form Utilities
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

const getCurrencyItems = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  return [];
};

const normalizeCurrencyCode = (value) => String(value || "").trim().toUpperCase();

const formatCurrencyOption = (currency) => {
  const code = normalizeCurrencyCode(currency?.code);
  const name = String(currency?.nameFa || "").trim();
  const symbol = String(currency?.symbol || "").trim();

  return [name, code, symbol ? `(${symbol})` : ""].filter(Boolean).join(" - ");
};

const isActiveStatus = (status) => status === "ACTIVE";

const hasValue = (value) => {
  if (value === undefined || value === null) return false;
  if (typeof value === "string") return !!value.trim();
  return true;
};

const validateNonNegativeInteger = (value) => {
  const n = Number(value);
  return Number.isInteger(n) && n >= 0;
};

//* 🟢 Tab Button
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

//* 🟢 Product Editor Modal
export default function ProductEditorModal({
  open,
  onClose,
  mode = "create",
  productId,
  categories = [],
  onSaved,
}) {
  //* 🟢 Editor State
  const isEdit = mode === "edit";
  const [activeTab, setActiveTab] = useState("basic");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  const [form, setForm] = useState(emptyProduct);
  const [errors, setErrors] = useState({});

  //* 🟢 Currency Catalog State
  const [currencyOptions, setCurrencyOptions] = useState([]);
  const [currencyLoading, setCurrencyLoading] = useState(false);
  const [currencyError, setCurrencyError] = useState("");


  //* 🟢 Media State
  const [imgUrl, setImgUrl] = useState("");
  const [imgAlt, setImgAlt] = useState("");
  const [editingImgIndex, setEditingImgIndex] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const titleText = isEdit ? "ویرایش محصول" : "ایجاد محصول";
  const isActiveProduct = isActiveStatus(form.status);

  const categoriesSorted = useMemo(() => {
    const list = Array.isArray(categories) ? categories : [];
    return [...list].sort((a, b) => String(a?.name || "").localeCompare(String(b?.name || ""), "fa"));
  }, [categories]);

  const currenciesSorted = useMemo(() => {
    const unique = new Map();

    for (const item of Array.isArray(currencyOptions) ? currencyOptions : []) {
      const code = normalizeCurrencyCode(item?.code);
      if (!code) continue;
      unique.set(code, {
        ...item,
        code,
      });
    }

    const selectedCode = normalizeCurrencyCode(form.currency);
    if (selectedCode && !unique.has(selectedCode)) {
      unique.set(selectedCode, {
        code: selectedCode,
        nameFa: "واحد پول فعلی محصول",
        symbol: "",
        isCurrentOnly: true,
      });
    }

    return Array.from(unique.values()).sort((a, b) => {
      const sortA = Number.isFinite(Number(a?.sortOrder)) ? Number(a.sortOrder) : 0;
      const sortB = Number.isFinite(Number(b?.sortOrder)) ? Number(b.sortOrder) : 0;
      if (sortA !== sortB) return sortA - sortB;
      return String(a?.nameFa || a?.code || "").localeCompare(String(b?.nameFa || b?.code || ""), "fa");
    });
  }, [currencyOptions, form.currency]);

  //* 🟢 Currency Catalog Fetch
  useEffect(() => {
    if (!open) return;

    let ignore = false;

    (async () => {
      try {
        setCurrencyLoading(true);
        setCurrencyError("");

        const { url, method } = backApis.getCurrencyCatalogs;
        const res = await apiClient({
          url,
          method,
          params: { isActive: "true" },
        });

        if (ignore) return;

        const items = getCurrencyItems(res?.data)
          .map((item) => ({
            ...item,
            code: normalizeCurrencyCode(item?.code),
          }))
          .filter((item) => item.code && item?.isActive !== false);

        setCurrencyOptions(items);
      } catch (err) {
        if (ignore) return;
        console.error(err);
        setCurrencyOptions([]);
        setCurrencyError("دریافت واحدهای پول از کاتالوگ ناموفق بود");
      } finally {
        if (!ignore) setCurrencyLoading(false);
      }
    })();

    return () => {
      ignore = true;
    };
  }, [open]);

  //* 🟢 Currency Default Sync
  useEffect(() => {
    if (!open || isEdit) return;
    if (!isActiveStatus(form.status)) return;
    if (form.currency) return;

    const firstCurrency = currenciesSorted.find((item) => !item?.isCurrentOnly)?.code;
    if (firstCurrency) {
      setForm((prev) => ({ ...prev, currency: firstCurrency }));
      setErrors((prev) => ({ ...prev, currency: undefined }));
    }
  }, [open, isEdit, form.status, form.currency, currenciesSorted]);

  //* 🟢 Visibility Sync
  useEffect(() => {
    if (!open) return;
    if (isActiveStatus(form.status) || form.visible === false) return;

    setForm((prev) => ({ ...prev, visible: false }));
  }, [open, form.status, form.visible]);

  //* 🟢 Product Hydration
  useEffect(() => {
    if (!open) return;
    setActiveTab("basic");
    setErrors({});

    if (!isEdit) {
      setForm(emptyProduct());
      setImgUrl("");
      setImgAlt("");
      setEditingImgIndex(null);
      setUploadingImage(false);
      setUploadProgress(0);
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
          currency: normalizeCurrencyCode(p?.currency),
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


        setImgUrl("");
        setImgAlt("");
        setEditingImgIndex(null);
        setUploadingImage(false);
        setUploadProgress(0);
      } catch (err) {
        console.error(err);
        toast.error("خطا در دریافت اطلاعات محصول");
      } finally {
        setFetching(false);
      }
    })();
  }, [open, isEdit, productId]);


  //* 🟢 Slug Automation
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

  //* 🟢 Form Actions
  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  //* 🟢 Form Validation
  const validate = () => {
    const e = {};
    const isActive = isActiveStatus(form.status);

    if (isActive && !String(form.title).trim()) e.title = "برای فعال‌سازی محصول، عنوان الزامی است";

    const s = String(form.slug || "").trim().toLowerCase();
    if (isActive && !s) e.slug = "برای فعال‌سازی محصول، اسلاگ الزامی است";
    else if (s && !/^[a-z0-9-]+$/.test(s)) e.slug = "فقط حروف انگلیسی، ارقام و -";

    if (isActive && !String(form.shortDescription).trim()) {
      e.shortDescription = "برای فعال‌سازی محصول، توضیح کوتاه الزامی است";
    }

    if (isActive && !String(form.categoryId).trim()) {
      e.categoryId = "برای فعال‌سازی محصول، دسته‌بندی را انتخاب کنید";
    }

    if (isActive && !hasValue(form.price)) {
      e.price = "برای فعال‌سازی محصول، قیمت الزامی است";
    } else if (hasValue(form.price) && !validateNonNegativeInteger(form.price)) {
      e.price = "قیمت باید عدد صحیح و >= 0 باشد";
    }

    const selectedCurrency = normalizeCurrencyCode(form.currency);
    if (isActive && !selectedCurrency) {
      e.currency = "برای فعال‌سازی محصول، واحد پول الزامی است";
    } else if (selectedCurrency && !currenciesSorted.some((item) => normalizeCurrencyCode(item?.code) === selectedCurrency && !item?.isCurrentOnly)) {
      e.currency = "واحد پول انتخاب‌شده در کاتالوگ فعال نیست";
    }

    const images = Array.isArray(form.images) ? form.images : [];
    if (isActive && !images.length) {
      e.images = "برای فعال‌سازی محصول، حداقل یک تصویر لازم است";
    }

    if (images.length) {
      const primaryCount = images.filter((i) => i?.isPrimary).length;
      if (primaryCount !== 1) e.images = "باید دقیقاً یک تصویر اصلی داشته باشید";
      for (let idx = 0; idx < images.length; idx++) {
        const it = images[idx];
        if (!String(it?.url || "").trim() || !String(it?.alt || "").trim()) {
          e.images = "برای هر تصویر url و alt الزامی است";
          break;
        }
      }
    }

    const optionalInts = [
      ["compareAt", "compareAt"],
      ["cost", "cost"],
      ["inventoryQty", "inventoryQty"],
      ["lowStockThreshold", "lowStockThreshold"],
    ];

    for (const [key] of optionalInts) {
      const v = form[key];
      if (!hasValue(v)) continue;
      if (!validateNonNegativeInteger(v)) {
        e[key] = "باید عدد صحیح و >= 0 باشد";
      }
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const buildPayload = () => {
    const isActive = isActiveStatus(form.status);
    const tagsArr = String(form.tags || "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const payload = {
      status: form.status,
      visible: isActive ? !!form.visible : false,
      tags: tagsArr,
      overviewHtml: String(form.overviewHtml || ""),
      images: (Array.isArray(form.images) ? form.images : []).map((i) => ({
        url: String(i.url).trim(),
        alt: String(i.alt).trim(),
        isPrimary: !!i.isPrimary,
      })),
      inventory: {
        manage: !!form.inventoryManage,
        qty: hasValue(form.inventoryQty) ? Number(form.inventoryQty) : 0,
      },
      stockStatus: form.stockStatus,
      allowBackorder: !!form.allowBackorder,
    };

    const title = String(form.title || "").trim();
    const slug = String(form.slug || "").trim().toLowerCase();
    const shortDescription = String(form.shortDescription || "").trim();
    const categoryId = String(form.categoryId || "").trim();
    const currency = normalizeCurrencyCode(form.currency);

    if (isActive || title) payload.title = title;
    if (isActive || slug) payload.slug = slug;
    if (isActive || shortDescription) payload.shortDescription = shortDescription;
    if (isActive || categoryId) payload.categoryId = categoryId;
    if (hasValue(form.price)) payload.price = Number(form.price);
    if (currency) payload.currency = currency;
    if (hasValue(form.compareAt)) payload.compareAt = Number(form.compareAt);
    if (hasValue(form.cost)) payload.cost = Number(form.cost);
    if (hasValue(form.lowStockThreshold)) payload.lowStockThreshold = Number(form.lowStockThreshold);

    const seo = {
      title: String(form.seoTitle || "").trim(),
      description: String(form.seoDescription || "").trim(),
      canonicalUrl: String(form.seoCanonicalUrl || "").trim(),
    };
    if (seo.title || seo.description || seo.canonicalUrl) payload.seo = seo;

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


  const handleImageFileUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.type?.startsWith("image/")) {
      toast.error("فقط فایل تصویر مجاز است");
      return;
    }

    try {
      setUploadingImage(true);
      setUploadProgress(0);

      const presignRes = await apiClient.post(backApis.mediaPresign.url, {
        mimeType: file.type,
        fileName: file.name,
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
          setUploadProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
        },
      });

      const commitRes = await apiClient.post(backApis.mediaCommit.url, {
        key: presigned.key,
        originalName: file.name,
        kind: "image",
      });

      const publicUrl = commitRes?.data?.data?.publicUrl || presigned.publicUrl;
      if (!publicUrl) throw new Error("آدرس عمومی فایل دریافت نشد");

      setImgUrl(publicUrl);
      setImgAlt((prev) => prev || form.title || file.name.replace(/\.[^.]+$/, ""));
      toast.success("تصویر آپلود شد؛ حالا می‌توانید آن را به گالری اضافه کنید");
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || err?.message || "آپلود تصویر ناموفق بود");
    } finally {
      setUploadingImage(false);
    }
  };

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
        {isActiveProduct
          ? "برای محصول فعال، فیلدهای ستاره‌دار الزامی هستند."
          : "پیش‌نویس و آرشیو می‌توانند ناقص ذخیره شوند و در سایت نمایش داده نمی‌شوند."}
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
          {!isActiveProduct ? (
            <div className="mb-4 rounded-2xl border border-[color:var(--adm-border)] bg-[var(--adm-surface-2)] px-4 py-3 text-xs leading-6 text-[var(--adm-text-muted)]">
              این محصول در وضعیت پیش‌نویس/آرشیو می‌تواند با اطلاعات ناقص ذخیره شود. برای نمایش در سایت، وضعیت را روی «فعال» بگذارید و فیلدهای الزامی را کامل کنید.
            </div>
          ) : null}

          {activeTab === "basic" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AdminField label="عنوان" required={isActiveProduct} error={errors.title} className="md:col-span-2">
                <AdminInput
                  value={form.title}
                  onChange={(e) => setField("title", e.target.value)}
                  placeholder="مثلاً: گوشی سامسونگ A55"
                />
              </AdminField>

              <AdminField label="اسلاگ" required={isActiveProduct} hint="فقط a-z 0-9 و -" error={errors.slug}>
                <AdminInput
                  value={form.slug}
                  onChange={(e) => setField("slug", slugify(e.target.value))}
                  placeholder="مثلاً: samsung-a55"
                />
              </AdminField>

              <AdminField label="دسته‌بندی" required={isActiveProduct} error={errors.categoryId}>
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
                  onChange={(e) => {
                    const nextStatus = e.target.value;
                    setForm((prev) => ({
                      ...prev,
                      status: nextStatus,
                      visible: isActiveStatus(nextStatus) ? prev.visible : false,
                    }));
                    setErrors((prev) => ({
                      ...prev,
                      status: undefined,
                      visible: undefined,
                    }));
                  }}
                >
                  <option value="DRAFT">پیش‌نویس</option>
                  <option value="ACTIVE">فعال</option>
                  <option value="ARCHIVED">آرشیو</option>
                </AdminSelect>
              </AdminField>

              <AdminField
                label="نمایش در سایت"
                hint={isActiveProduct ? "فقط محصول فعال می‌تواند در سایت نمایش داده شود" : "برای پیش‌نویس و آرشیو، بک‌اند همیشه محصول را مخفی ذخیره می‌کند"}
              >
                <AdminSelect
                  value={isActiveProduct && form.visible ? "true" : "false"}
                  disabled={!isActiveProduct}
                  onChange={(e) => setField("visible", e.target.value === "true")}
                >
                  <option value="true">نمایش داده شود</option>
                  <option value="false">مخفی</option>
                </AdminSelect>
              </AdminField>

              <AdminField label="توضیح کوتاه" required={isActiveProduct} error={errors.shortDescription} className="md:col-span-2">
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
              <AdminField label="قیمت" required={isActiveProduct} error={errors.price}>
                <AdminInput
                  inputMode="numeric"
                  value={form.price}
                  onChange={(e) => setField("price", toIntOrEmpty(e.target.value))}
                  placeholder="مثلاً: 120000"
                />
              </AdminField>

              <AdminField
                label="واحد پول"
                required={isActiveProduct}
                hint={currencyLoading ? "در حال دریافت از کاتالوگ…" : "از کاتالوگ واحد پول"}
                error={errors.currency || currencyError}
              >
                <AdminSelect
                  value={form.currency}
                  disabled={currencyLoading || (!currenciesSorted.length && !form.currency)}
                  onChange={(e) => setField("currency", e.target.value)}
                >
                  <option value="">انتخاب واحد پول…</option>
                  {currenciesSorted.map((currency) => (
                    <option
                      key={currency.code}
                      value={currency.code}
                      disabled={!!currency?.isCurrentOnly}
                    >
                      {formatCurrencyOption(currency)}
                      {currency?.isCurrentOnly ? " - غیرفعال یا حذف‌شده از کاتالوگ" : ""}
                    </option>
                  ))}
                </AdminSelect>

                {!currencyLoading && !currencyError && !currenciesSorted.length ? (
                  <p className="text-xs text-[var(--adm-warning)]">
                    هیچ واحد پول فعالی در کاتالوگ پیدا نشد. ابتدا از بخش پیکربندی محصول، واحد پول فعال تعریف کنید.
                  </p>
                ) : null}
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
            <>
              {!isActiveProduct ? (
                <div className="mb-4 rounded-2xl border border-[color:var(--adm-border)] bg-[var(--adm-surface-2)] px-4 py-3 text-xs leading-6 text-[var(--adm-text-muted)]">
                  تصویر برای پیش‌نویس اختیاری است؛ اما برای فعال‌سازی محصول باید حداقل یک تصویر و دقیقاً یک تصویر اصلی داشته باشید.
                </div>
              ) : null}
              <ProductMediaEditor
              images={form.images}
              imgUrl={imgUrl}
              imgAlt={imgAlt}
              editingImgIndex={editingImgIndex}
              uploadingImage={uploadingImage}
              uploadProgress={uploadProgress}
              error={errors.images}
              onUploadFile={handleImageFileUpload}
              onChangeUrl={setImgUrl}
              onChangeAlt={setImgAlt}
              onCancelEdit={cancelEditImage}
              onAddOrUpdate={addOrUpdateImage}
              onSetPrimary={setPrimary}
              onStartEdit={startEditImage}
              onRemove={removeImage}
            />
            </>
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
