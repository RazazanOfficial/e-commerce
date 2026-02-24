//? 🔵Required Modules
const mongoose = require("mongoose");
const { Product } = require("../../../models/productModel");
const CurrencyCatalog = require("../../../models/currencyCatalogModel");
const CategoryModel = require("../../../models/categoryModel");
const { buildPublicUrl } = require("../../../utils/cloudSpace");

//* 🟢 REQUIRED fields for create
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

//* 🟢 فیلدهای مجاز برای بروزرسانی
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

//* validateRequired Utils
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

//* validateAndNormalizeSlug Utils
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

//* validateCategoryId Utils
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

//* parseIntegerField Utils
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

//* validateCurrency Utils
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

  // If admin has configured CurrencyCatalog, enforce it (active only).
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

  // Fallback mode (before CurrencyCatalog is configured)
  if (!ALLOWED_CURRENCIES_FALLBACK.has(cleaned)) {
    const err = new Error("واحد پول نامعتبر است");
      err.statusCode = 400;
      throw err;
  }
  return cleaned;
};


//* normalizeTags Utils (string | string[] → string[] lowercase)
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

//* normalizeInventory Utils
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

//* normalizeImages Utils
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

//* normalizeMedia Utils (unified: key-based)
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

    // For embed: url is required
    if (type === "embed" && !url) {
      const err = new Error("برای embed، فیلد url الزامی است");
      err.statusCode = 400;
      throw err;
    }

    // For other types: prefer key; allow url for backward compatibility
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

  // primary rules
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

  // For ACTIVE: image/gif must have alt (SEO/accessibility)
  if (isActive) {
    for (const it of mapped) {
      if ((it.type === "image" || it.type === "gif") && !it.alt) {
        const err = new Error("برای تصویر/گیف، فیلد alt الزامی است");
      err.statusCode = 400;
      throw err;
      }
    }
  }

  // sort by order (stable)
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

  // Legacy fallback: images/videos (url-based)
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

//* validateEnum Utils
const validateEnumIfProvided = (value, label, allowed) => {
  if (value === undefined || value === null || value === "") return undefined;
  if (!allowed.includes(value)) {
    const err = new Error(`${label} نامعتبر است`);
      err.statusCode = 400;
      throw err;
  }
  return value;
};

//* validateOptionalObjectId Utils
const validateOptionalObjectId = (value, label) => {
  if (value === undefined || value === null || value === "") return undefined;
  if (!mongoose.Types.ObjectId.isValid(value)) {
    const err = new Error(`${label} نامعتبر است`);
      err.statusCode = 400;
      throw err;
  }
  return value;
};

//* normalizeRelated Utils
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

//* normalizeTemplateOrCustom Utils (returnPolicy / handlingTime)
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

//* normalizeTechSpecs
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

//* normalizeFaqs (FAQ)
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

//* normalizeAttributes
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

//* normalizeSeo
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

//* normalizeShipping
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

//* normalizeOptions & Variants
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
  // ولیدیشن عمیق توسط Schema + hook انجام می‌شود
  return variants;
};

//* 🟢 Create Product Controller
const createProduct = async (req, res) => {
  try {
    let {
      title,
      slug,
      shortDescription,
      overviewHtml,
      categoryId,
      brandId,
      tags,
      status,
      visible,
      price,
      currency,
      compareAt,
      cost,
      inventory,
      stockStatus,
      lowStockThreshold,
      publishAt,
      allowBackorder,
      restockNotifyEnabled,
      hasVariants,
      options,
      variants,
      media,
      images,
      videos,
      attributes,
      techSpecs,
      faqs,
      seo,
      shipping,
      warranty,
      returnPolicy,
      handlingTime,
      related,
      breadcrumbsCache,
    } = req.body || {};

    // ۰) وضعیت نهایی
    let effectiveStatus = "DRAFT";
    try {
      effectiveStatus =
        validateEnumIfProvided(status, "وضعیت محصول", [
          "DRAFT",
          "ACTIVE",
          "ARCHIVED",
        ]) || "DRAFT";

      stockStatus = validateEnumIfProvided(
        stockStatus,
        "وضعیت موجودی",
        ["IN_STOCK", "OUT_OF_STOCK", "PREORDER"]
      );
    } catch (e) {
      return res
        .status(400)
        .json({ success: false, error: true, message: e.message });
    }

    const isActive = effectiveStatus === "ACTIVE";

    // ۱) فیلدهای اجباری (فقط برای محصول فعال)
    if (isActive) {
      const requiredErr = validateRequired(REQUIRED.create, {
        title,
        slug,
        shortDescription,
        categoryId,
        price,
        currency,
      });
      if (requiredErr) {
        return res
          .status(400)
          .json({ success: false, error: true, message: requiredErr });
      }
    }

    // ۲) slug (نامک) - فقط وقتی ارسال شده یا محصول فعال است
    let normalizedSlug;
    if (isActive || (typeof slug === "string" && slug.trim())) {
      try {
        normalizedSlug = await validateAndNormalizeSlug(slug);
      } catch (e) {
        const statusCode = e.code === 409 ? 409 : 400;
        return res
          .status(statusCode)
          .json({ success: false, error: true, message: e.message });
      }
    }

    // ۳) categoryId - فقط وقتی ارسال شده یا محصول فعال است
    if (isActive || (categoryId !== undefined && categoryId !== null && categoryId !== "")) {
      try {
        await validateCategoryId(categoryId);
      } catch (e) {
        return res
          .status(400)
          .json({ success: false, error: true, message: e.message });
      }
    }

    // ۴) قیمت‌ها
    let priceInt, compareAtInt, costInt, lowStockThreshInt;
    try {
      priceInt = parseIntegerField(price, "قیمت", { required: isActive, min: 0 });
      compareAtInt = parseIntegerField(compareAt, "compareAt", {
        required: false,
        min: 0,
      });
      costInt = parseIntegerField(cost, "cost", { required: false, min: 0 });
      lowStockThreshInt = parseIntegerField(
        lowStockThreshold,
        "آستانه موجودی کم",
        { required: false, min: 0 }
      );
    } catch (e) {
      return res
        .status(400)
        .json({ success: false, error: true, message: e.message });
    }

    if (
      compareAtInt !== undefined &&
      compareAtInt !== null &&
      priceInt !== undefined &&
      priceInt !== null &&
      compareAtInt < priceInt
    ) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "compareAt باید بزرگ‌تر یا مساوی price باشد",
      });
    }

    // ۵) currency - فقط وقتی ارسال شده یا محصول فعال است
    let normalizedCurrency;
    if (isActive || (currency !== undefined && currency !== null && currency !== "")) {
      try {
        normalizedCurrency = await validateCurrency(currency);
      } catch (e) {
        return res
          .status(400)
          .json({ success: false, error: true, message: e.message });
      }
    }

    // ۶) inventory
    let normalizedInventory;
    try {
      normalizedInventory = normalizeInventory(inventory);
    } catch (e) {
      return res
        .status(400)
        .json({ success: false, error: true, message: e.message });
    }

    // ۷) tags
    tags = normalizeTags(tags);

    // ۸) media
    let normalizedMedia;
    try {
      normalizedMedia = normalizeMedia(media, { required: false, isActive });
    } catch (e) {
      return res
        .status(400)
        .json({ success: false, error: true, message: e.message });
    }

    // ۹) images
    let normalizedImages;
    try {
      normalizedImages = normalizeImages(images, { required: isActive && !(Array.isArray(normalizedMedia) && normalizedMedia.length > 0) });
    } catch (e) {
      return res
        .status(400)
        .json({ success: false, error: true, message: e.message });
    }

    if (isActive) {
      const hasMedia = Array.isArray(normalizedMedia) && normalizedMedia.length > 0;
      const hasImages = Array.isArray(normalizedImages) && normalizedImages.length > 0;
      if (!hasMedia && !hasImages) {
        return res.status(400).json({
          success: false,
          error: true,
          message: "برای محصول فعال، حداقل یک رسانه یا تصویر لازم است",
        });
      }
    }

    // ۱۰) publishAt
    let publishAtDate;
    if (publishAt !== undefined && publishAt !== null && publishAt !== "") {
      const d = new Date(publishAt);
      if (Number.isNaN(d.getTime())) {
        return res.status(400).json({
          success: false,
          error: true,
          message: "تاریخ انتشار نامعتبر است",
        });
      }
      publishAtDate = d;
    }

    // ۱۰) سایر نرمال‌سازی‌ها
    hasVariants = typeof hasVariants === "boolean" ? hasVariants : false;

    allowBackorder =
      typeof allowBackorder === "boolean" ? allowBackorder : false;
    restockNotifyEnabled =
      typeof restockNotifyEnabled === "boolean" ? restockNotifyEnabled : true;

    const finalVisible =
      isActive ? (typeof visible === "boolean" ? visible : true) : false;

    if (typeof title === "string") title = title.trim();
    if (typeof shortDescription === "string") shortDescription = shortDescription.trim();
    if (typeof overviewHtml !== "string") overviewHtml = "";

    const normalizedOptions = normalizeOptions(options);
    const normalizedVariants = normalizeVariants(variants);
    const normalizedTechSpecs = normalizeTechSpecs(techSpecs);
    const normalizedFaqs = normalizeFaqs(faqs);
    const normalizedAttributes = normalizeAttributes(attributes);
    const normalizedSeo = normalizeSeo(seo);
    const normalizedShipping = normalizeShipping(shipping);
    const normalizedRelated = normalizeRelated(related);
    const normalizedReturnPolicy = normalizeTemplateOrCustom(
      returnPolicy,
      "قوانین مرجوعی"
    );
    const normalizedHandlingTime = normalizeTemplateOrCustom(
      handlingTime,
      "زمان آماده‌سازی"
    );

    // ۱۱) payload نهایی (فقط فیلدهای ارسال‌شده)
    const payload = {
      status: effectiveStatus,
      visible: finalVisible,
      allowBackorder,
      restockNotifyEnabled,
      hasVariants,
    };

    if (title !== undefined) payload.title = title;
    if (normalizedSlug !== undefined) payload.slug = normalizedSlug;
    if (shortDescription !== undefined) payload.shortDescription = shortDescription;
    if (overviewHtml !== undefined) payload.overviewHtml = overviewHtml;
    if (normalizedFaqs !== undefined) payload.faqs = normalizedFaqs;

    if (categoryId !== undefined && categoryId !== null && categoryId !== "") {
      payload.categoryId = categoryId;
    }

    if (brandId !== undefined) {
      payload.brandId = validateOptionalObjectId(brandId, "شناسه برند");
    }

    if (tags !== undefined) payload.tags = tags;

    if (priceInt !== undefined) payload.price = priceInt;
    if (normalizedCurrency !== undefined) payload.currency = normalizedCurrency;
    if (compareAtInt !== undefined) payload.compareAt = compareAtInt;
    if (costInt !== undefined) payload.cost = costInt;
    if (normalizedInventory !== undefined) payload.inventory = normalizedInventory;
    if (stockStatus) payload.stockStatus = stockStatus;
    if (lowStockThreshInt !== undefined) payload.lowStockThreshold = lowStockThreshInt;
    if (publishAtDate) payload.publishAt = publishAtDate;

    if (normalizedOptions !== undefined) payload.options = normalizedOptions;
    if (normalizedVariants !== undefined) payload.variants = normalizedVariants;
    if (normalizedMedia !== undefined) payload.media = normalizedMedia;
    if (normalizedImages !== undefined) payload.images = normalizedImages;

    if (Array.isArray(videos)) payload.videos = videos;
    if (normalizedAttributes !== undefined) payload.attributes = normalizedAttributes;
    if (normalizedTechSpecs !== undefined) payload.techSpecs = normalizedTechSpecs;
    if (normalizedSeo !== undefined) payload.seo = normalizedSeo;
    if (normalizedShipping !== undefined) payload.shipping = normalizedShipping;
    if (warranty !== undefined) payload.warranty = String(warranty);

    if (normalizedReturnPolicy !== undefined) payload.returnPolicy = normalizedReturnPolicy;
    if (normalizedHandlingTime !== undefined) payload.handlingTime = normalizedHandlingTime;
    if (normalizedRelated !== undefined) payload.related = normalizedRelated;

    if (Array.isArray(breadcrumbsCache)) payload.breadcrumbsCache = breadcrumbsCache;

    // ۱۲) ایجاد محصول
    const doc = await Product.create(payload);

    const full = await Product.findById(doc._id)
      .select("+cost")
      .populate("categoryId", "name slug")
      .lean();

    return res.status(201).json({
      success: true,
      error: false,
      data: shapeProductForResponse(full),
    });
  } catch (err) {
    // Client-side errors we intentionally throw (validation)
    const sc = Number(err?.statusCode || err?.code);
    if (sc && sc >= 400 && sc < 500) {
      return res.status(sc).json({
        success: false,
        error: true,
        message: err?.message || "درخواست نامعتبر است",
      });
    }

    if (err?.name === "CastError") {
      return res.status(400).json({
        success: false,
        error: true,
        message: "داده ارسالی نامعتبر است",
      });
    }

    if (err?.code === 11000) {
      const which = Object.keys(err.keyPattern || {}).join(", ");
      return res.status(400).json({
        success: false,
        error: true,
        message: which ? `مقدار تکراری برای: ${which}` : "کلید تکراری",
      });
    }

    if (err?.name === "ValidationError") {
      const firstKey = Object.keys(err.errors || {})[0];
      const message =
        (firstKey && err.errors[firstKey]?.message) ||
        "داده‌های ارسالی نامعتبر است";
      return res.status(400).json({
        success: false,
        error: true,
        message,
      });
    }

    // Server-side unexpected errors
    console.error("createProduct error:", err);
    const msg =
      process.env.NODE_ENV === "production"
        ? "خطای داخلی سرور در ایجاد محصول"
        : err?.message || "خطای داخلی سرور در ایجاد محصول";

    return res.status(500).json({
      success: false,
      error: true,
      message: msg,
    });
  }
};


//* 🟢 Get All Products (لیست برای پنل ادمین)
const getAllProducts = async (req, res) => {
  try {
    let {
      page = 1,
      limit = 20,
      status,
      categoryId,
      visible,
      search,
      q,
    } = req.query || {};

    page = Number(page) || 1;
    limit = Number(limit) || 20;
    if (page < 1) page = 1;
    if (limit < 1) limit = 1;
    if (limit > 100) limit = 100;

    const filter = {};

    if (status && ["DRAFT", "ACTIVE", "ARCHIVED"].includes(String(status).trim())) {
      filter.status = String(status).trim();
    }

    if (visible === "true" || visible === "false") {
      filter.visible = visible === "true";
    }

    if (categoryId && mongoose.Types.ObjectId.isValid(categoryId)) {
      filter.categoryId = categoryId;
    }

    const searchText = (search ?? q);
    if (searchText && String(searchText).trim()) {
      filter.$text = { $search: String(searchText).trim() };
    }

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Product.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select("+cost")
        .populate("categoryId", "name slug")
        .lean(),
      Product.countDocuments(filter),
    ]);

    const shapedItems = items.map(shapeProductForResponse);

    return res.status(200).json({
      success: true,
      error: false,
      data: {
        items: shapedItems,
        page,
        limit,
        total,
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: true,
      message: "خطا در دریافت لیست محصولات",
    });
  }
};

//* 🟢 Get One Product By ID
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "شناسه محصول نامعتبر است",
      });
    }

    const doc = await Product.findById(id)
      .select("+cost")
      .populate("categoryId", "name slug")
      .lean();

    if (!doc) {
      return res.status(404).json({
        success: false,
        error: true,
        message: "محصول یافت نشد",
      });
    }

    return res.status(200).json({
      success: true,
      error: false,
      data: shapeProductForResponse(doc),
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: true,
      message: "خطا در دریافت جزئیات محصول",
    });
  }
};

//* 🟢 Update Product
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "شناسه محصول نامعتبر است",
      });
    }

    const existingDoc = await Product.findById(id).select("+cost");
    if (!existingDoc) {
      return res.status(404).json({
        success: false,
        error: true,
        message: "محصول یافت نشد",
      });
    }

    // Only allow known fields (ignore everything else)
    const rawBody = req.body || {};
    const body = {};
    for (const k of Object.keys(rawBody)) {
      if (ALLOWED_UPDATE_FIELDS.has(k)) body[k] = rawBody[k];
    }

    // ۰) وضعیت نهایی
    let effectiveStatus = existingDoc.status || "DRAFT";
    let normalizedStockStatus;

    try {
      if (Object.prototype.hasOwnProperty.call(body, "status")) {
        effectiveStatus =
          validateEnumIfProvided(body.status, "وضعیت محصول", [
            "DRAFT",
            "ACTIVE",
            "ARCHIVED",
          ]) || effectiveStatus;
      }

      if (Object.prototype.hasOwnProperty.call(body, "stockStatus")) {
        normalizedStockStatus = validateEnumIfProvided(
          body.stockStatus,
          "وضعیت موجودی",
          ["IN_STOCK", "OUT_OF_STOCK", "PREORDER"]
        );
      }
    } catch (e) {
      return res
        .status(400)
        .json({ success: false, error: true, message: e.message });
    }

    const isActive = effectiveStatus === "ACTIVE";

    // ۱) مقدارهای موثر (برای چک required وقتی ACTIVE می‌شود)
    const effectiveTitle =
      Object.prototype.hasOwnProperty.call(body, "title")
        ? body.title
        : existingDoc.title;

    const effectiveSlug =
      Object.prototype.hasOwnProperty.call(body, "slug")
        ? body.slug
        : existingDoc.slug;

    const effectiveShortDescription =
      Object.prototype.hasOwnProperty.call(body, "shortDescription")
        ? body.shortDescription
        : existingDoc.shortDescription;

    const effectiveCategoryId =
      Object.prototype.hasOwnProperty.call(body, "categoryId")
        ? body.categoryId
        : existingDoc.categoryId;

    const effectivePrice =
      Object.prototype.hasOwnProperty.call(body, "price")
        ? body.price
        : existingDoc.price;

    const effectiveCurrency =
      Object.prototype.hasOwnProperty.call(body, "currency")
        ? body.currency
        : existingDoc.currency;

    if (isActive) {
      const requiredErr = validateRequired(REQUIRED.create, {
        title: effectiveTitle,
        slug: effectiveSlug,
        shortDescription: effectiveShortDescription,
        categoryId: effectiveCategoryId,
        price: effectivePrice,
        currency: effectiveCurrency,
      });
      if (requiredErr) {
        return res
          .status(400)
          .json({ success: false, error: true, message: requiredErr });
      }
    }

    // ۲) slug validation (if provided or needed)
    let normalizedSlug;
    if (
      Object.prototype.hasOwnProperty.call(body, "slug") ||
      (isActive && (!existingDoc.slug || !String(existingDoc.slug).trim()))
    ) {
      try {
        normalizedSlug = await validateAndNormalizeSlug(effectiveSlug, id);
      } catch (e) {
        const statusCode = e.code === 409 ? 409 : 400;
        return res
          .status(statusCode)
          .json({ success: false, error: true, message: e.message });
      }
    }

    // ۳) category validation (if provided or needed)
    if (
      Object.prototype.hasOwnProperty.call(body, "categoryId") ||
      (isActive && !existingDoc.categoryId)
    ) {
      try {
        await validateCategoryId(effectiveCategoryId);
      } catch (e) {
        return res
          .status(400)
          .json({ success: false, error: true, message: e.message });
      }
    }

    // ۴) قیمت‌ها
    let priceInt, compareAtInt, costInt, lowStockThreshInt;
    try {
      priceInt = parseIntegerField(effectivePrice, "قیمت", {
        required: isActive,
        min: 0,
      });

      const effectiveCompareAt =
        Object.prototype.hasOwnProperty.call(body, "compareAt")
          ? body.compareAt
          : existingDoc.compareAt;

      const effectiveCost =
        Object.prototype.hasOwnProperty.call(body, "cost")
          ? body.cost
          : existingDoc.cost;

      const effectiveLowStock =
        Object.prototype.hasOwnProperty.call(body, "lowStockThreshold")
          ? body.lowStockThreshold
          : existingDoc.lowStockThreshold;

      compareAtInt = parseIntegerField(effectiveCompareAt, "compareAt", {
        required: false,
        min: 0,
      });
      costInt = parseIntegerField(effectiveCost, "cost", {
        required: false,
        min: 0,
      });
      lowStockThreshInt = parseIntegerField(
        effectiveLowStock,
        "آستانه موجودی کم",
        { required: false, min: 0 }
      );
    } catch (e) {
      return res
        .status(400)
        .json({ success: false, error: true, message: e.message });
    }

    if (
      compareAtInt !== undefined &&
      compareAtInt !== null &&
      priceInt !== undefined &&
      priceInt !== null &&
      compareAtInt < priceInt
    ) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "compareAt باید بزرگ‌تر یا مساوی price باشد",
      });
    }

    // ۵) currency validation (if provided or needed)
    let normalizedCurrency;
    if (
      Object.prototype.hasOwnProperty.call(body, "currency") ||
      (isActive && (!existingDoc.currency || !String(existingDoc.currency).trim()))
    ) {
      try {
        normalizedCurrency = await validateCurrency(effectiveCurrency);
      } catch (e) {
        return res
          .status(400)
          .json({ success: false, error: true, message: e.message });
      }
    }

    // ۶) inventory
    let normalizedInventory;
    try {
      if (Object.prototype.hasOwnProperty.call(body, "inventory")) {
        normalizedInventory = normalizeInventory(body.inventory);
      }
    } catch (e) {
      return res
        .status(400)
        .json({ success: false, error: true, message: e.message });
    }

    // ۷) tags
    const normalizedTags = Object.prototype.hasOwnProperty.call(body, "tags")
      ? normalizeTags(body.tags)
      : undefined;

    // ۸) media/images
    let normalizedMedia;
    let normalizedImages;

    try {
      if (Object.prototype.hasOwnProperty.call(body, "media")) {
        normalizedMedia = normalizeMedia(body.media, { required: false, isActive });
      }

      if (Object.prototype.hasOwnProperty.call(body, "images")) {
        // images primary rule is enforced inside normalizeImages
        normalizedImages = normalizeImages(body.images, { required: false });
      }
    } catch (e) {
      return res
        .status(400)
        .json({ success: false, error: true, message: e.message });
    }

    // Validate existing media/images when product becomes ACTIVE but client didn't re-send them
    const finalMedia = Object.prototype.hasOwnProperty.call(body, "media")
      ? normalizedMedia
      : existingDoc.media;

    const finalImages = Object.prototype.hasOwnProperty.call(body, "images")
      ? normalizedImages
      : existingDoc.images;

    if (isActive) {
      const hasMedia = Array.isArray(finalMedia) && finalMedia.length > 0;
      const hasImages = Array.isArray(finalImages) && finalImages.length > 0;

      if (!hasMedia && !hasImages) {
        return res.status(400).json({
          success: false,
          error: true,
          message: "برای محصول فعال، حداقل یک رسانه یا تصویر لازم است",
        });
      }

      // If images/media were not provided in this request, still validate stored values.
      try {
        if (!Object.prototype.hasOwnProperty.call(body, "media") && hasMedia) {
          // will throw if invalid for ACTIVE
          normalizeMedia(finalMedia, { required: false, isActive: true });
        }
        if (!Object.prototype.hasOwnProperty.call(body, "images") && hasImages) {
          normalizeImages(finalImages, { required: false });
        }
      } catch (e) {
        return res
          .status(400)
          .json({ success: false, error: true, message: e.message });
      }
    }

    // ۹) publishAt
    let publishAtDate;
    if (Object.prototype.hasOwnProperty.call(body, "publishAt")) {
      if (body.publishAt === null || body.publishAt === "") {
        publishAtDate = null;
      } else {
        const d = new Date(body.publishAt);
        if (Number.isNaN(d.getTime())) {
          return res.status(400).json({
            success: false,
            error: true,
            message: "تاریخ انتشار نامعتبر است",
          });
        }
        publishAtDate = d;
      }
    }

    // ۱۰) سایر نرمال‌سازی‌ها (فقط اگر ارسال شده)
    const payload = {
      status: effectiveStatus,
      // visible policy
      visible: isActive
        ? (typeof body.visible === "boolean" ? body.visible : (typeof existingDoc.visible === "boolean" ? existingDoc.visible : true))
        : false,
    };

    if (Object.prototype.hasOwnProperty.call(body, "title")) {
      payload.title = typeof body.title === "string" ? body.title.trim() : body.title;
    }

    if (normalizedSlug !== undefined) payload.slug = normalizedSlug;

    if (Object.prototype.hasOwnProperty.call(body, "shortDescription")) {
      payload.shortDescription =
        typeof body.shortDescription === "string"
          ? body.shortDescription.trim()
          : body.shortDescription;
    }

    if (Object.prototype.hasOwnProperty.call(body, "overviewHtml")) {
      payload.overviewHtml = typeof body.overviewHtml === "string" ? body.overviewHtml : "";
    }

    if (Object.prototype.hasOwnProperty.call(body, "categoryId")) {
      payload.categoryId = body.categoryId;
    }

    if (Object.prototype.hasOwnProperty.call(body, "brandId")) {
      payload.brandId = validateOptionalObjectId(body.brandId, "شناسه برند");
    }

    if (normalizedTags !== undefined) payload.tags = normalizedTags;

    if (priceInt !== undefined) payload.price = priceInt;
    if (normalizedCurrency !== undefined) payload.currency = normalizedCurrency;
    if (Object.prototype.hasOwnProperty.call(body, "compareAt")) payload.compareAt = compareAtInt;
    if (Object.prototype.hasOwnProperty.call(body, "cost")) payload.cost = costInt;

    if (normalizedInventory !== undefined) payload.inventory = normalizedInventory;
    if (normalizedStockStatus) payload.stockStatus = normalizedStockStatus;
    if (Object.prototype.hasOwnProperty.call(body, "lowStockThreshold")) payload.lowStockThreshold = lowStockThreshInt;

    if (Object.prototype.hasOwnProperty.call(body, "allowBackorder")) {
      payload.allowBackorder = typeof body.allowBackorder === "boolean" ? body.allowBackorder : false;
    }

    if (Object.prototype.hasOwnProperty.call(body, "restockNotifyEnabled")) {
      payload.restockNotifyEnabled = typeof body.restockNotifyEnabled === "boolean" ? body.restockNotifyEnabled : true;
    }

    if (Object.prototype.hasOwnProperty.call(body, "hasVariants")) {
      payload.hasVariants = typeof body.hasVariants === "boolean" ? body.hasVariants : false;
    }

    if (Object.prototype.hasOwnProperty.call(body, "options")) payload.options = normalizeOptions(body.options);
    if (Object.prototype.hasOwnProperty.call(body, "variants")) payload.variants = normalizeVariants(body.variants);
    if (Object.prototype.hasOwnProperty.call(body, "media")) payload.media = normalizedMedia;
    if (Object.prototype.hasOwnProperty.call(body, "images")) payload.images = normalizedImages;

    if (Object.prototype.hasOwnProperty.call(body, "videos") && Array.isArray(body.videos)) payload.videos = body.videos;
    if (Object.prototype.hasOwnProperty.call(body, "attributes")) payload.attributes = normalizeAttributes(body.attributes);
    if (Object.prototype.hasOwnProperty.call(body, "techSpecs")) payload.techSpecs = normalizeTechSpecs(body.techSpecs);
    if (Object.prototype.hasOwnProperty.call(body, "faqs")) payload.faqs = normalizeFaqs(body.faqs);
    if (Object.prototype.hasOwnProperty.call(body, "seo")) payload.seo = normalizeSeo(body.seo);
    if (Object.prototype.hasOwnProperty.call(body, "shipping")) payload.shipping = normalizeShipping(body.shipping);

    if (Object.prototype.hasOwnProperty.call(body, "warranty")) payload.warranty = String(body.warranty);

    if (Object.prototype.hasOwnProperty.call(body, "returnPolicy")) {
      payload.returnPolicy = normalizeTemplateOrCustom(body.returnPolicy, "قوانین مرجوعی");
    }

    if (Object.prototype.hasOwnProperty.call(body, "handlingTime")) {
      payload.handlingTime = normalizeTemplateOrCustom(body.handlingTime, "زمان آماده‌سازی");
    }

    if (Object.prototype.hasOwnProperty.call(body, "related")) payload.related = normalizeRelated(body.related);

    if (Object.prototype.hasOwnProperty.call(body, "breadcrumbsCache") && Array.isArray(body.breadcrumbsCache)) {
      payload.breadcrumbsCache = body.breadcrumbsCache;
    }

    if (Object.prototype.hasOwnProperty.call(body, "publishAt")) payload.publishAt = publishAtDate;

    // Apply payload
    for (const [k, v] of Object.entries(payload)) {
      existingDoc[k] = v;
    }

    await existingDoc.save();

    const full = await Product.findById(existingDoc._id)
      .select("+cost")
      .populate("categoryId", "name slug")
      .lean();

    return res.status(200).json({
      success: true,
      error: false,
      data: shapeProductForResponse(full),
    });
  } catch (err) {
    const sc = Number(err?.statusCode || err?.code);
    if (sc && sc >= 400 && sc < 500) {
      return res.status(sc).json({
        success: false,
        error: true,
        message: err?.message || "درخواست نامعتبر است",
      });
    }

    if (err?.name === "CastError") {
      return res.status(400).json({
        success: false,
        error: true,
        message: "داده ارسالی نامعتبر است",
      });
    }

    if (err?.code === 11000) {
      const which = Object.keys(err.keyPattern || {}).join(", ");
      return res.status(400).json({
        success: false,
        error: true,
        message: which ? `مقدار تکراری برای: ${which}` : "کلید تکراری",
      });
    }

    if (err?.name === "ValidationError") {
      const firstKey = Object.keys(err.errors || {})[0];
      const message =
        (firstKey && err.errors[firstKey]?.message) ||
        "داده‌های ارسالی نامعتبر است";
      return res.status(400).json({
        success: false,
        error: true,
        message,
      });
    }

    console.error("updateProduct error:", err);
    const msg =
      process.env.NODE_ENV === "production"
        ? "خطای غیرمنتظره در بروزرسانی محصول"
        : err?.message || "خطای غیرمنتظره در بروزرسانی محصول";

    return res.status(500).json({
      success: false,
      error: true,
      message: msg,
    });
  }
};


//* 🟢 Archive Product (soft delete)
const archiveProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "شناسه محصول نامعتبر است",
      });
    }

    const prod = await Product.findById(id);
    if (!prod) {
      return res.status(404).json({
        success: false,
        error: true,
        message: "محصول یافت نشد",
      });
    }

    prod.status = "ARCHIVED";
    prod.visible = false;

    await prod.save();

    return res.status(200).json({
      success: true,
      error: false,
      message: "محصول به آرشیو منتقل شد",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: true,
      message: "خطا در آرشیو محصول",
    });
  }
};

//* 🟢 Hard Delete Product (حذف دائمی)
const deleteProductPermanently = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "شناسه محصول نامعتبر است",
      });
    }

    const prod = await Product.findById(id).select("_id");
    if (!prod) {
      return res.status(404).json({
        success: false,
        error: true,
        message: "محصول یافت نشد",
      });
    }

    await Product.deleteOne({ _id: prod._id });

    return res.status(200).json({
      success: true,
      error: false,
      message: "محصول برای همیشه حذف شد",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: true,
      message: "خطا در حذف دائمی محصول",
    });
  }
};
//* 🟢 Search Products (برای پنل ادمین)
const searchProducts = async (req, res) => {
  try {
    let {
      q,        // متن جستجو
      page = 1,
      limit = 20,
      status,
      visible,
    } = req.query || {};

    if (!q || !String(q).trim()) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "پارامتر q (متن جستجو) الزامی است",
      });
    }

    q = String(q).trim();

    // تبدیل رشته به regex امن (escape کردن کاراکترهای خاص)
    const escapeRegex = (value) =>
      value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const regex = new RegExp(escapeRegex(q), "i");

    page = Number(page) || 1;
    limit = Number(limit) || 20;
    if (page < 1) page = 1;
    if (limit < 1) limit = 1;
    if (limit > 100) limit = 100;

    const baseFilter = {};

    if (
      status &&
      ["DRAFT", "ACTIVE", "ARCHIVED"].includes(String(status).trim())
    ) {
      baseFilter.status = String(status).trim();
    }

    if (visible === "true" || visible === "false") {
      baseFilter.visible = visible === "true";
    }

    // جستجو در دسته‌بندی‌ها بر اساس name / slug
    const matchedCategories = await CategoryModel.find({
      $or: [{ name: regex }, { slug: regex }],
    })
      .select("_id")
      .lean();

    const categoryIds =
      matchedCategories && matchedCategories.length
        ? matchedCategories.map((c) => c._id)
        : [];

    // شرط‌های OR برای خود محصول
    const orConditions = [
      { title: regex },
      { shortDescription: regex },
      { slug: regex },
      { tags: regex },
      { "attributes.key": regex },
      { "attributes.value": regex },
    ];

    if (categoryIds.length) {
      orConditions.push({ categoryId: { $in: categoryIds } });
    }

    const filter = {
      ...baseFilter,
      $or: orConditions,
    };

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Product.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select("+cost")
        .populate("categoryId", "name slug")
        .lean(),
      Product.countDocuments(filter),
    ]);

    const shapedItems = items.map(shapeProductForResponse);

    return res.status(200).json({
      success: true,
      error: false,
      data: {
        items: shapedItems,
        page,
        limit,
        total,
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: true,
      message: "خطا در جستجوی محصولات",
    });
  }
};
//* 🟢 Restore Product (خارج کردن از آرشیو)
const restoreProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "شناسه محصول نامعتبر است",
      });
    }

    const prod = await Product.findById(id);
    if (!prod) {
      return res.status(404).json({
        success: false,
        error: true,
        message: "محصول یافت نشد",
      });
    }

    // فقط محصولی که در آرشیو است قابل بازگردانی است
    if (prod.status !== "ARCHIVED") {
      return res.status(400).json({
        success: false,
        error: true,
        message: "این محصول در آرشیو نیست",
      });
    }

    // تصمیم: وقتی برمی‌گردد، به DRAFT برگردد تا دوباره بررسی/انتشار شود
    prod.status = "DRAFT";
    prod.visible = false;

    await prod.save();

    return res.status(200).json({
      success: true,
      error: false,
      message: "محصول از آرشیو خارج شد",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: true,
      message: "خطا در خارج کردن محصول از آرشیو",
    });
  }
};

//? 🔵Export Controller
module.exports = {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  archiveProduct,
  deleteProductPermanently,
  searchProducts,
  restoreProduct,
};


