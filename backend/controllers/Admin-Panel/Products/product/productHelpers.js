//? 🔵 Required Modules
const mongoose = require("mongoose");
const { Product } = require("../../../../models/productModel");
const CurrencyCatalog = require("../../../../models/currencyCatalogModel");
const CategoryModel = require("../../../../models/categoryModel");
const { buildPublicUrl } = require("../../../../utils/cloudSpace");

//* 🟢 Create Required Fields
const REQUIRED = {
  create: {
    title: "عنوان محصول الزامی است",
    slug: "اسلاگ (slug) محصول الزامی است",
    shortDescription: "توضیح کوتاه الزامی است",
    categoryId: "شناسه دسته‌بندی الزامی است",
    price: "قیمت محصول الزامی است",
    currency: "واحد پول محصول الزامی است",
  },
};


const ALLOWED_UPDATE_FIELDS = new Set([
  "title",
  "slug",
  "shortDescription",
  "overviewHtml",
  "categoryId",
  "brandId",
  "tags",
  "status",
  "visible",
  "price",
  "currency",
  "compareAt",
  "cost",
  "inventory",
  "stockStatus",
  "lowStockThreshold",
  "publishAt",
  "allowBackorder",
  "restockNotifyEnabled",
  "hasVariants",
  "options",
  "variants",
  "media",
  "images",
  "videos",
  "attributes",
  "techSpecs",
  "faqs",
  "seo",
  "shipping",
  "warranty",
  "returnPolicy",
  "handlingTime",
  "related",
  "breadcrumbsCache",
]);

//* 🟢 validateRequired Utility
const validateRequired = (schema, payload) => {
  for (const [field, message] of Object.entries(schema)) {
    const v = payload?.[field];
    if (
      v === undefined ||
      v === null ||
      (typeof v === "string" && !v.trim())
    ) {
      return message;
    }
  }
  return null;
};

//* 🟢 validateAndNormalizeSlug Utility
const validateAndNormalizeSlug = async (slug, currentId = null) => {
  if (typeof slug === "undefined" || slug === null) {
    throw new Error("اسلاگ (slug) محصول الزامی است");
  }

  const cleaned = String(slug).trim().toLowerCase();
  const slugRegex = /^[a-z0-9-]+$/;

  if (!cleaned || !slugRegex.test(cleaned)) {
    throw new Error("اسلاگ نامعتبر است (فقط حروف انگلیسی، ارقام و -)");
  }

  const exists = await Product.exists({
    slug: cleaned,
    ...(currentId ? { _id: { $ne: currentId } } : {}),
  });

  if (exists) {
    const err = new Error("slug تکراری است");
    err.code = 409;
    err.statusCode = 409;
    throw err;
  }

  return cleaned;
};

//* 🟢 validateCategoryId Utility
const validateCategoryId = async (categoryId) => {
  if (!categoryId) {
    const err = new Error("شناسه دسته‌بندی الزامی است");
    err.code = 400;
    throw err;
  }

  if (!mongoose.Types.ObjectId.isValid(categoryId)) {
    const err = new Error("شناسه دسته‌بندی نامعتبر است");
    err.code = 400;
    throw err;
  }

  const exists = await CategoryModel.exists({ _id: categoryId });
  if (!exists) {
    const err = new Error("دسته‌بندی یافت نشد");
    err.code = 400;
    throw err;
  }

  return categoryId;
};

//* 🟢 parseIntegerField Utility
const parseIntegerField = (
  value,
  label,
  { required = false, min = 0 } = {}
) => {
  if (value === undefined || value === null || value === "") {
    if (required) {
      const err = new Error(`${label} الزامی است`);
      err.statusCode = 400;
      throw err;
    }
    return undefined;
  }

  const num = Number(value);
  if (!Number.isInteger(num)) {
    const err = new Error(`${label} باید عدد صحیح باشد`);
      err.statusCode = 400;
      throw err;
  }
  if (num < min) {
    const err = new Error(`${label} نباید کمتر از ${min} باشد`);
      err.statusCode = 400;
      throw err;
  }
  return num;
};

//* 🟢 validateCurrency Utility
const ALLOWED_CURRENCIES_FALLBACK = new Set(["IRT", "IRR", "USD"]);

const validateCurrency = async (currency) => {
  if (typeof currency !== "string") {
    const err = new Error("واحد پول نامعتبر است");
      err.statusCode = 400;
      throw err;
  }
  const cleaned = currency.trim().toUpperCase();
  if (!cleaned) {
    const err = new Error("واحد پول نامعتبر است");
      err.statusCode = 400;
      throw err;
  }


  const hasCatalog = await CurrencyCatalog.exists({});
  if (hasCatalog) {
    const ok = await CurrencyCatalog.exists({ code: cleaned, isActive: true });
    if (!ok) {
      const err = new Error("واحد پول نامعتبر است");
      err.statusCode = 400;
      throw err;
    }
    return cleaned;
  }


  if (!ALLOWED_CURRENCIES_FALLBACK.has(cleaned)) {
    const err = new Error("واحد پول نامعتبر است");
      err.statusCode = 400;
      throw err;
  }
  return cleaned;
};


//* 🟢 normalizeTags Utility
const normalizeTags = (tags) => {
  if (tags === undefined) return undefined;
  if (Array.isArray(tags)) {
    return tags
      .map((t) => String(t).trim().toLowerCase())
      .filter(Boolean);
  }
  if (typeof tags === "string") {
    return tags
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);
  }
  return [];
};

//* 🟢 normalizeInventory Utility
const normalizeInventory = (inventory) => {
  if (!inventory || typeof inventory !== "object") return undefined;

  const result = {};

  if (typeof inventory.manage === "boolean") {
    result.manage = inventory.manage;
  }

  if (inventory.qty !== undefined) {
    result.qty = parseIntegerField(inventory.qty, "موجودی", {
      required: false,
      min: 0,
    });
  }

  return result;
};

//* 🟢 normalizeImages Utility
const normalizeImages = (images, { required = false } = {}) => {
  if (images === undefined || images === null) {
    if (required) {
      const err = new Error("حداقل یک تصویر برای محصول الزامی است");
      err.statusCode = 400;
      throw err;
    }
    return undefined;
  }
  if (!Array.isArray(images)) {
    const err = new Error("ساختار تصاویر نامعتبر است");
      err.statusCode = 400;
      throw err;
  }

  if (images.length === 0) {
    if (required) {
      const err = new Error("حداقل یک تصویر برای محصول الزامی است");
      err.statusCode = 400;
      throw err;
    }
    return [];
  }

  const mapped = images.map((img) => {
    if (!img || typeof img !== "object") {
      const err = new Error("ساختار هر تصویر باید شیء باشد");
      err.statusCode = 400;
      throw err;
    }
    const url = img.url && String(img.url).trim();
    const alt = img.alt && String(img.alt).trim();
    if (!url || !alt) {
      const err = new Error("هر تصویر باید فیلدهای url و alt داشته باشد");
      err.statusCode = 400;
      throw err;
    }
    return {
      url,
      alt,
      isPrimary: !!img.isPrimary,
      variants: img.variants || undefined,
    };
  });

  const primaryCount = mapped.filter((i) => i.isPrimary === true).length;
  if (primaryCount !== 1) {
    const err = new Error("باید دقیقاً یک تصویر اصلی داشته باشد");
      err.statusCode = 400;
      throw err;
  }


  return mapped;
};

//* 🟢 normalizeMedia Utility
const normalizeMedia = (media, { required = false, isActive = false } = {}) => {
  if (media === undefined) return undefined;
  if (media === null) {
    if (required) {
      const err = new Error("حداقل یک رسانه برای محصول الزامی است");
      err.statusCode = 400;
      throw err;
    }
    return [];
  }
  if (!Array.isArray(media)) {
    const err = new Error("ساختار media نامعتبر است");
      err.statusCode = 400;
      throw err;
  }
  if (media.length === 0) {
    if (required) {
      const err = new Error("حداقل یک رسانه برای محصول الزامی است");
      err.statusCode = 400;
      throw err;
    }
    return [];
  }

  const allowedTypes = new Set(["image", "video", "gif", "embed"]);

  const mapped = media.map((m, idx) => {
    if (!m || typeof m !== "object") {
      const err = new Error("ساختار هر رسانه باید شیء باشد");
      err.statusCode = 400;
      throw err;
    }
    const typeRaw = m.type ?? m.mediaType;
    const type = String(typeRaw || "").trim().toLowerCase();
    if (!allowedTypes.has(type)) {
      const err = new Error("نوع رسانه نامعتبر است");
      err.statusCode = 400;
      throw err;
    }

    const key = m.key ? String(m.key).trim().replace(/^\/+/, "") : undefined;
    const url = m.url ? String(m.url).trim() : undefined;


    if (type === "embed" && !url) {
      const err = new Error("برای embed، فیلد url الزامی است");
      err.statusCode = 400;
      throw err;
    }


    if (type !== "embed" && !key && !url) {
      const err = new Error("برای رسانه، یکی از key یا url لازم است");
      err.statusCode = 400;
      throw err;
    }

    const posterKey = m.posterKey ? String(m.posterKey).trim().replace(/^\/+/, "") : undefined;
    const posterUrl = m.posterUrl ? String(m.posterUrl).trim() : (m.poster ? String(m.poster).trim() : undefined);

    const alt = m.alt ? String(m.alt).trim() : undefined;

    const order =
      m.order === undefined || m.order === null || m.order === ""
        ? idx
        : parseIntegerField(m.order, "order", { required: false, min: 0 });

    return {
      type,
      key,
      url,
      posterKey,
      posterUrl,
      alt,
      isPrimary: !!m.isPrimary,
      order,
    };
  });


  const primaryCount = mapped.filter((i) => i.isPrimary === true).length;
  if (primaryCount > 1) {
    const err = new Error("در media فقط یک آیتم می‌تواند اصلی باشد");
      err.statusCode = 400;
      throw err;
  }
  if (isActive && primaryCount !== 1) {
    const err = new Error("برای محصول فعال، باید دقیقاً یک رسانه اصلی انتخاب شود");
      err.statusCode = 400;
      throw err;
  }


  if (isActive) {
    for (const it of mapped) {
      if ((it.type === "image" || it.type === "gif") && !it.alt) {
        const err = new Error("برای تصویر/گیف، فیلد alt الزامی است");
      err.statusCode = 400;
      throw err;
      }
    }
  }


  mapped.sort((a, b) => (a.order || 0) - (b.order || 0));
  return mapped;
};

const safeBuildPublicUrl = (key) => {
  try {
    return buildPublicUrl(key);
  } catch (_) {
    return undefined;
  }
};

const buildUnifiedMediaForResponse = (p) => {
  const srcMedia = Array.isArray(p.media) ? p.media : [];
  if (srcMedia.length > 0) {
    const mapped = srcMedia
      .map((m, idx) => {
        if (!m) return null;
        const key = m.key ? String(m.key).trim() : undefined;
        const posterKey = m.posterKey ? String(m.posterKey).trim() : undefined;

        const url = key ? safeBuildPublicUrl(key) : (m.url ? String(m.url).trim() : undefined);
        const posterUrl = posterKey ? safeBuildPublicUrl(posterKey) : (m.posterUrl ? String(m.posterUrl).trim() : undefined);

        return {
          type: m.type,
          key,
          url,
          posterKey,
          posterUrl,
          alt: m.alt,
          isPrimary: !!m.isPrimary,
          order: m.order ?? idx,
        };
      })
      .filter(Boolean)
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    const primary = mapped.find((x) => x.isPrimary) || mapped[0];
    return { media: mapped, primaryMediaUrl: primary?.url };
  }


  const images = Array.isArray(p.images) ? p.images : [];
  const videos = Array.isArray(p.videos) ? p.videos : [];
  const mappedImages = images.map((img, idx) => ({
    type: "image",
    key: undefined,
    url: img?.url,
    posterKey: undefined,
    posterUrl: img?.poster,
    alt: img?.alt,
    isPrimary: !!img?.isPrimary,
    order: idx,
  }));
  const mappedVideos = videos.map((v, idx) => ({
    type: "video",
    key: undefined,
    url: v?.url,
    posterKey: undefined,
    posterUrl: v?.poster,
    alt: v?.title,
    isPrimary: false,
    order: mappedImages.length + idx,
  }));

  const combined = [...mappedImages, ...mappedVideos].filter((x) => x && x.url);
  const primary = combined.find((x) => x.isPrimary) || combined[0];

  return { media: combined, primaryMediaUrl: primary?.url };
};

const shapeProductForResponse = (p) => {
  const base = p && typeof p.toObject === "function" ? p.toObject() : p;
  const { media, primaryMediaUrl } = buildUnifiedMediaForResponse(base || {});
  return {
    ...(base || {}),
    media,
    primaryMediaUrl,
  };
};

//* 🟢 validateEnum Utility
const validateEnumIfProvided = (value, label, allowed) => {
  if (value === undefined || value === null || value === "") return undefined;
  if (!allowed.includes(value)) {
    const err = new Error(`${label} نامعتبر است`);
      err.statusCode = 400;
      throw err;
  }
  return value;
};

//* 🟢 validateOptionalObjectId Utility
const validateOptionalObjectId = (value, label) => {
  if (value === undefined || value === null || value === "") return undefined;
  if (!mongoose.Types.ObjectId.isValid(value)) {
    const err = new Error(`${label} نامعتبر است`);
      err.statusCode = 400;
      throw err;
  }
  return value;
};

//* 🟢 normalizeRelated Utility
const normalizeRelated = (related) => {
  if (!related || typeof related !== "object") return undefined;

  const result = {};

  if (Array.isArray(related.manualIds)) {
    result.manualIds = related.manualIds.map((id) =>
      validateOptionalObjectId(id, "شناسه محصول مرتبط")
    );
  }

  if (typeof related.matchByTags === "boolean") {
    result.matchByTags = related.matchByTags;
  }

  if (related.adminOnlySimilarTags !== undefined) {
    result.adminOnlySimilarTags = normalizeTags(related.adminOnlySimilarTags);
  }

  return result;
};

//* 🟢 normalizeTemplateOrCustom Utility
const normalizeTemplateOrCustom = (obj, label) => {
  if (!obj || typeof obj !== "object") return undefined;

  const result = {};

  if (obj.mode !== undefined) {
    result.mode = validateEnumIfProvided(obj.mode, `حالت ${label}`, [
      "TEMPLATE",
      "CUSTOM",
    ]);
  }

  if (obj.templateId !== undefined) {
    result.templateId = validateOptionalObjectId(
      obj.templateId,
      `templateId ${label}`
    );
  }

  if (obj.body !== undefined) {
    result.body = String(obj.body);
  }

  return result;
};

//* 🟢 normalizeTechSpecs Utility
const normalizeTechSpecs = (techSpecs) => {
  if (!Array.isArray(techSpecs)) return undefined;

  return techSpecs
    .map((section) => {
      if (!section || typeof section !== "object") return null;
      const title = section.title && String(section.title).trim();
      if (!title) return null;
      const items = Array.isArray(section.items) ? section.items : [];
      const mappedItems = items
        .map((it) => {
          if (!it || typeof it !== "object") return null;
          const k = it.k && String(it.k).trim();
          const v = it.v && String(it.v).trim();
          if (!k || !v) return null;
          return { k, v };
        })
        .filter(Boolean);

      return { title, items: mappedItems };
    })
    .filter(Boolean);
};

//* 🟢 normalizeFaqs Utility
const normalizeFaqs = (faqs) => {
  if (faqs === null) return [];
  if (!Array.isArray(faqs)) return undefined;

  return faqs
    .map((f) => {
      if (!f || typeof f !== "object") return null;
      const question = f.question && String(f.question).trim();
      const answerHtml =
        f.answerHtml === undefined || f.answerHtml === null
          ? ""
          : String(f.answerHtml);
      if (!question) return null;

      const out = {
        question,
        answerHtml,
        isActive: typeof f.isActive === "boolean" ? f.isActive : true,
        sortOrder:
          f.sortOrder === undefined || f.sortOrder === null || f.sortOrder === ""
            ? 0
            : parseIntegerField(f.sortOrder, "ترتیب FAQ", { required: false, min: 0 }),
      };
      return out;
    })
    .filter(Boolean)
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
};

//* 🟢 normalizeAttributes Utility
const normalizeAttributes = (attributes) => {
  if (!Array.isArray(attributes)) return undefined;
  return attributes
    .map((attr) => {
      if (!attr || typeof attr !== "object") return null;
      const key = attr.key && String(attr.key).trim();
      const value = attr.value && String(attr.value).trim();
      if (!key || !value) return null;
      return {
        key,
        value,
        pinToHero: !!attr.pinToHero,
      };
    })
    .filter(Boolean);
};

//* 🟢 normalizeSeo Utility
const normalizeSeo = (seo) => {
  if (!seo || typeof seo !== "object") return undefined;

  const result = {};
  if (seo.title !== undefined) {
    result.title = String(seo.title).trim();
  }
  if (seo.description !== undefined) {
    result.description = String(seo.description).trim();
  }
  if (seo.canonicalUrl !== undefined) {
    result.canonicalUrl = String(seo.canonicalUrl).trim();
  }
  return result;
};

//* 🟢 normalizeShipping Utility
const normalizeShipping = (shipping) => {
  if (!shipping || typeof shipping !== "object") return undefined;

  const result = {};
  if (shipping.weight !== undefined) {
    result.weight = parseIntegerField(shipping.weight, "وزن", {
      required: false,
      min: 0,
    });
  }

  if (shipping.dimensions && typeof shipping.dimensions === "object") {
    const d = {};
    if (shipping.dimensions.length !== undefined) {
      d.length = parseIntegerField(
        shipping.dimensions.length,
        "طول",
        { required: false, min: 0 }
      );
    }
    if (shipping.dimensions.width !== undefined) {
      d.width = parseIntegerField(
        shipping.dimensions.width,
        "عرض",
        { required: false, min: 0 }
      );
    }
    if (shipping.dimensions.height !== undefined) {
      d.height = parseIntegerField(
        shipping.dimensions.height,
        "ارتفاع",
        { required: false, min: 0 }
      );
    }
    result.dimensions = d;
  }

  return result;
};

//* 🟢 Option And Variant Utilities
const normalizeOptions = (options) => {
  if (!Array.isArray(options)) return undefined;
  return options
    .map((opt) => {
      if (!opt || typeof opt !== "object") return null;
      const name = opt.name && String(opt.name).trim();
      if (!name) return null;
      const values = Array.isArray(opt.values)
        ? opt.values.map((v) => String(v).trim()).filter(Boolean)
        : [];
      return { name, values };
    })
    .filter(Boolean);
};

const normalizeVariants = (variants) => {
  if (!Array.isArray(variants)) return undefined;

  return variants;
};

//* 🟢 Product Payload Utilities

module.exports = {
  REQUIRED,
  ALLOWED_UPDATE_FIELDS,
  validateRequired,
  validateAndNormalizeSlug,
  validateCategoryId,
  parseIntegerField,
  validateCurrency,
  normalizeTags,
  normalizeInventory,
  normalizeImages,
  normalizeMedia,
  safeBuildPublicUrl,
  buildUnifiedMediaForResponse,
  shapeProductForResponse,
  validateEnumIfProvided,
  validateOptionalObjectId,
  normalizeRelated,
  normalizeTemplateOrCustom,
  normalizeTechSpecs,
  normalizeFaqs,
  normalizeAttributes,
  normalizeSeo,
  normalizeShipping,
  normalizeOptions,
  normalizeVariants
};
