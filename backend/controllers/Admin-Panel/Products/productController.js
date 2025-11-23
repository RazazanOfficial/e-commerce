//? 🔵Required Modules
const mongoose = require("mongoose");
const { Product } = require("../../../models/productModel");
const CategoryModel = require("../../../models/categoryModel");

//* 🟢 REQUIRED fields for create
const REQUIRED = {
  create: {
    title: "عنوان محصول الزامی است",
    slug: "اسلاگ (slug) محصول الزامی است",
    shortDescription: "توضیح کوتاه الزامی است",
    categoryId: "شناسه دسته‌بندی الزامی است",
    price: "قیمت محصول الزامی است",
    currency: "واحد پول محصول الزامی است",
    images: "حداقل یک تصویر برای محصول الزامی است",
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
  "images",
  "videos",
  "attributes",
  "techSpecs",
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
      throw new Error(`${label} الزامی است`);
    }
    return undefined;
  }

  const num = Number(value);
  if (!Number.isInteger(num)) {
    throw new Error(`${label} باید عدد صحیح باشد`);
  }
  if (num < min) {
    throw new Error(`${label} نباید کمتر از ${min} باشد`);
  }
  return num;
};

//* validateCurrency Utils
const ALLOWED_CURRENCIES = new Set(["IRT", "IRR", "USD"]);

const validateCurrency = (currency) => {
  if (typeof currency !== "string") {
    throw new Error("واحد پول نامعتبر است");
  }
  const cleaned = currency.trim().toUpperCase();
  if (!ALLOWED_CURRENCIES.has(cleaned)) {
    throw new Error("واحد پول نامعتبر است");
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
const normalizeImages = (images) => {
  if (images === undefined || images === null) {
    throw new Error("حداقل یک تصویر برای محصول الزامی است");
  }
  if (!Array.isArray(images)) {
    throw new Error("ساختار تصاویر نامعتبر است");
  }

  const mapped = images.map((img) => {
    if (!img || typeof img !== "object") {
      throw new Error("ساختار هر تصویر باید شیء باشد");
    }
    const url = img.url && String(img.url).trim();
    const alt = img.alt && String(img.alt).trim();
    if (!url || !alt) {
      throw new Error("هر تصویر باید فیلدهای url و alt داشته باشد");
    }
    return {
      url,
      alt,
      isPrimary: !!img.isPrimary,
      variants: img.variants || undefined,
    };
  });

  if (!mapped.length) {
    throw new Error("حداقل یک تصویر برای محصول الزامی است");
  }

  const primaryCount = mapped.filter((i) => i.isPrimary === true).length;
  if (primaryCount !== 1) {
    throw new Error("باید دقیقاً یک تصویر اصلی داشته باشد");
  }

  return mapped;
};

//* validateEnum Utils
const validateEnumIfProvided = (value, label, allowed) => {
  if (value === undefined || value === null || value === "") return undefined;
  if (!allowed.includes(value)) {
    throw new Error(`${label} نامعتبر است`);
  }
  return value;
};

//* validateOptionalObjectId Utils
const validateOptionalObjectId = (value, label) => {
  if (value === undefined || value === null || value === "") return undefined;
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new Error(`${label} نامعتبر است`);
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
      images,
      videos,
      attributes,
      techSpecs,
      seo,
      shipping,
      warranty,
      returnPolicy,
      handlingTime,
      related,
      breadcrumbsCache,
    } = req.body || {};

    // ۱) فیلدهای اجباری
    const requiredErr = validateRequired(REQUIRED.create, {
      title,
      slug,
      shortDescription,
      categoryId,
      price,
      currency,
      images,
    });
    if (requiredErr) {
      return res
        .status(400)
        .json({ success: false, error: true, message: requiredErr });
    }

    // ۲) slug
    let normalizedSlug;
    try {
      normalizedSlug = await validateAndNormalizeSlug(slug);
    } catch (e) {
      const statusCode = e.code === 409 ? 409 : 400;
      return res
        .status(statusCode)
        .json({ success: false, error: true, message: e.message });
    }

    // ۳) categoryId
    try {
      await validateCategoryId(categoryId);
    } catch (e) {
      return res
        .status(400)
        .json({ success: false, error: true, message: e.message });
    }

    // ۴) قیمت‌ها
    let priceInt, compareAtInt, costInt, lowStockThreshInt;
    try {
      priceInt = parseIntegerField(price, "قیمت", { required: true, min: 0 });
      compareAtInt = parseIntegerField(compareAt, "compareAt", {
        required: false,
        min: 0,
      });
      costInt = parseIntegerField(cost, "cost", {
        required: false,
        min: 0,
      });
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
      compareAtInt < priceInt
    ) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "compareAt باید بزرگ‌تر یا مساوی price باشد",
      });
    }

    // ۵) currency
    let normalizedCurrency;
    try {
      normalizedCurrency = validateCurrency(currency);
    } catch (e) {
      return res
        .status(400)
        .json({ success: false, error: true, message: e.message });
    }

    // ۶) status و stockStatus
    try {
      status = validateEnumIfProvided(status, "وضعیت محصول", [
        "DRAFT",
        "ACTIVE",
        "ARCHIVED",
      ]);
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

    // ۷) inventory
    let normalizedInventory;
    try {
      normalizedInventory = normalizeInventory(inventory);
    } catch (e) {
      return res
        .status(400)
        .json({ success: false, error: true, message: e.message });
    }

    // ۸) tags
    tags = normalizeTags(tags);

    // ۹) images
    let normalizedImages;
    try {
      normalizedImages = normalizeImages(images);
    } catch (e) {
      return res
        .status(400)
        .json({ success: false, error: true, message: e.message });
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

    // ۱۱) سایر نرمال‌سازی‌ها
    hasVariants = typeof hasVariants === "boolean" ? hasVariants : false;
    visible = typeof visible === "boolean" ? visible : true;
    allowBackorder =
      typeof allowBackorder === "boolean" ? allowBackorder : false;
    restockNotifyEnabled =
      typeof restockNotifyEnabled === "boolean"
        ? restockNotifyEnabled
        : true;

    if (typeof title === "string") {
      title = title.trim();
    }
    if (typeof shortDescription === "string") {
      shortDescription = shortDescription.trim();
    }
    if (typeof overviewHtml !== "string") {
      overviewHtml = "";
    }

    const normalizedOptions = normalizeOptions(options);
    const normalizedVariants = normalizeVariants(variants);
    const normalizedTechSpecs = normalizeTechSpecs(techSpecs);
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

    // ۱۲) payload نهایی
    const payload = {
      title,
      slug: normalizedSlug,
      shortDescription,
      overviewHtml,
      categoryId,
      price: priceInt,
      currency: normalizedCurrency,
      images: normalizedImages,
    };

    if (brandId !== undefined) {
      payload.brandId = validateOptionalObjectId(brandId, "شناسه برند");
    }
    if (tags !== undefined) payload.tags = tags;
    if (status) payload.status = status;
    if (typeof visible === "boolean") payload.visible = visible;
    if (compareAtInt !== undefined) payload.compareAt = compareAtInt;
    if (costInt !== undefined) payload.cost = costInt;
    if (normalizedInventory !== undefined) payload.inventory = normalizedInventory;
    if (stockStatus) payload.stockStatus = stockStatus;
    if (lowStockThreshInt !== undefined) {
      payload.lowStockThreshold = lowStockThreshInt;
    }
    if (publishAtDate) payload.publishAt = publishAtDate;
    payload.allowBackorder = allowBackorder;
    payload.restockNotifyEnabled = restockNotifyEnabled;
    payload.hasVariants = hasVariants;
    if (normalizedOptions !== undefined) payload.options = normalizedOptions;
    if (normalizedVariants !== undefined) payload.variants = normalizedVariants;
    if (Array.isArray(videos)) payload.videos = videos;
    if (normalizedAttributes !== undefined) payload.attributes = normalizedAttributes;
    if (normalizedTechSpecs !== undefined) payload.techSpecs = normalizedTechSpecs;
    if (normalizedSeo !== undefined) payload.seo = normalizedSeo;
    if (normalizedShipping !== undefined) payload.shipping = normalizedShipping;
    if (warranty !== undefined) payload.warranty = String(warranty);
    if (normalizedReturnPolicy !== undefined) {
      payload.returnPolicy = normalizedReturnPolicy;
    }
    if (normalizedHandlingTime !== undefined) {
      payload.handlingTime = normalizedHandlingTime;
    }
    if (normalizedRelated !== undefined) payload.related = normalizedRelated;
    if (Array.isArray(breadcrumbsCache)) {
      payload.breadcrumbsCache = breadcrumbsCache;
    }

    // ۱۳) ایجاد محصول
    const doc = await Product.create(payload);

    return res.status(201).json({
      success: true,
      error: false,
      data: doc,
    });
  } catch (err) {
    if (err?.code === 11000) {
      const field = Object.keys(err.keyValue || {})[0];
      return res.status(409).json({
        success: false,
        error: true,
        message: `${field} تکراری است`,
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

    return res.status(500).json({
      success: false,
      error: true,
      message: "خطای داخلی سرور در ایجاد محصول",
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
    } = req.query || {};

    page = Number(page) || 1;
    limit = Number(limit) || 20;
    if (page < 1) page = 1;
    if (limit < 1) limit = 1;
    if (limit > 100) limit = 100;

    const filter = {};

    if (
      status &&
      ["DRAFT", "ACTIVE", "ARCHIVED"].includes(String(status).trim())
    ) {
      filter.status = String(status).trim();
    }

    if (visible === "true" || visible === "false") {
      filter.visible = visible === "true";
    }

    if (categoryId && mongoose.Types.ObjectId.isValid(categoryId)) {
      filter.categoryId = categoryId;
    }

    if (search && String(search).trim()) {
      filter.$text = { $search: String(search).trim() };
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

    return res.status(200).json({
      success: true,
      error: false,
      data: {
        items,
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
      data: doc,
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
    const body = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "شناسه محصول نامعتبر است",
      });
    }

    const unknownKeys = Object.keys(body).filter(
      (k) => !ALLOWED_UPDATE_FIELDS.has(k)
    );
    if (unknownKeys.length) {
      return res.status(400).json({
        success: false,
        error: true,
        message: `فیلد(های) نامعتبر: ${unknownKeys.join(", ")}`,
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

    // slug
    let normalizedSlug;
    if (Object.prototype.hasOwnProperty.call(body, "slug")) {
      try {
        normalizedSlug = await validateAndNormalizeSlug(body.slug, prod._id);
      } catch (e) {
        const statusCode = e.code === 409 ? 409 : 400;
        return res
          .status(statusCode)
          .json({ success: false, error: true, message: e.message });
      }
    }

    // categoryId
    let newCategoryId;
    if (Object.prototype.hasOwnProperty.call(body, "categoryId")) {
      try {
        newCategoryId = await validateCategoryId(body.categoryId);
      } catch (e) {
        return res
          .status(400)
          .json({ success: false, error: true, message: e.message });
      }
    }

    // قیمت‌ها
    let priceInt;
    let compareAtInt;
    let costInt;
    let lowStockThreshInt;
    const hasPrice = Object.prototype.hasOwnProperty.call(body, "price");
    const hasCompareAt = Object.prototype.hasOwnProperty.call(
      body,
      "compareAt"
    );
    const hasCost = Object.prototype.hasOwnProperty.call(body, "cost");
    const hasLowStock = Object.prototype.hasOwnProperty.call(
      body,
      "lowStockThreshold"
    );

    try {
      if (hasPrice) {
        priceInt = parseIntegerField(body.price, "قیمت", {
          required: true,
          min: 0,
        });
      }
      if (hasCompareAt) {
        compareAtInt = parseIntegerField(body.compareAt, "compareAt", {
          required: false,
          min: 0,
        });
      }
      if (hasCost) {
        costInt = parseIntegerField(body.cost, "cost", {
          required: false,
          min: 0,
        });
      }
      if (hasLowStock) {
        lowStockThreshInt = parseIntegerField(
          body.lowStockThreshold,
          "آستانه موجودی کم",
          { required: false, min: 0 }
        );
      }
    } catch (e) {
      return res
        .status(400)
        .json({ success: false, error: true, message: e.message });
    }

    // بررسی نسبت compareAt و price فقط اگر compareAt ارسال شده
    if (hasCompareAt && compareAtInt !== undefined && compareAtInt !== null) {
      const effectivePrice =
        priceInt !== undefined && priceInt !== null
          ? priceInt
          : prod.price;
      if (effectivePrice != null && compareAtInt < effectivePrice) {
        return res.status(400).json({
          success: false,
          error: true,
          message: "compareAt باید بزرگ‌تر یا مساوی price باشد",
        });
      }
    }

    // currency
    let normalizedCurrency;
    if (Object.prototype.hasOwnProperty.call(body, "currency")) {
      try {
        normalizedCurrency = validateCurrency(body.currency);
      } catch (e) {
        return res
          .status(400)
          .json({ success: false, error: true, message: e.message });
      }
    }

    // status و stockStatus
    if (Object.prototype.hasOwnProperty.call(body, "status")) {
      try {
        body.status = validateEnumIfProvided(
          body.status,
          "وضعیت محصول",
          ["DRAFT", "ACTIVE", "ARCHIVED"]
        );
      } catch (e) {
        return res
          .status(400)
          .json({ success: false, error: true, message: e.message });
      }
    }

    if (Object.prototype.hasOwnProperty.call(body, "stockStatus")) {
      try {
        body.stockStatus = validateEnumIfProvided(
          body.stockStatus,
          "وضعیت موجودی",
          ["IN_STOCK", "OUT_OF_STOCK", "PREORDER"]
        );
      } catch (e) {
        return res
          .status(400)
          .json({ success: false, error: true, message: e.message });
      }
    }

    // inventory
    let normalizedInventory;
    if (Object.prototype.hasOwnProperty.call(body, "inventory")) {
      try {
        normalizedInventory = normalizeInventory(body.inventory);
      } catch (e) {
        return res
          .status(400)
          .json({ success: false, error: true, message: e.message });
      }
    }

    // tags
    let normalizedTags;
    if (Object.prototype.hasOwnProperty.call(body, "tags")) {
      normalizedTags = normalizeTags(body.tags);
    }

    // images
    let normalizedImages;
    if (Object.prototype.hasOwnProperty.call(body, "images")) {
      try {
        normalizedImages = normalizeImages(body.images);
      } catch (e) {
        return res
          .status(400)
          .json({ success: false, error: true, message: e.message });
      }
    }

    // publishAt
    let publishAtDate;
    if (Object.prototype.hasOwnProperty.call(body, "publishAt")) {
      if (
        body.publishAt === undefined ||
        body.publishAt === null ||
        body.publishAt === ""
      ) {
        publishAtDate = undefined;
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

    // سایر نرمال‌سازی‌ها
    const hasVisible = Object.prototype.hasOwnProperty.call(body, "visible");
    const hasAllowBackorder = Object.prototype.hasOwnProperty.call(
      body,
      "allowBackorder"
    );
    const hasRestockNotifyEnabled = Object.prototype.hasOwnProperty.call(
      body,
      "restockNotifyEnabled"
    );
    const hasHasVariants = Object.prototype.hasOwnProperty.call(
      body,
      "hasVariants"
    );

    const normalizedOptions = Object.prototype.hasOwnProperty.call(
      body,
      "options"
    )
      ? normalizeOptions(body.options)
      : undefined;
    const normalizedVariants = Object.prototype.hasOwnProperty.call(
      body,
      "variants"
    )
      ? normalizeVariants(body.variants)
      : undefined;
    const normalizedTechSpecs = Object.prototype.hasOwnProperty.call(
      body,
      "techSpecs"
    )
      ? normalizeTechSpecs(body.techSpecs)
      : undefined;
    const normalizedAttributes = Object.prototype.hasOwnProperty.call(
      body,
      "attributes"
    )
      ? normalizeAttributes(body.attributes)
      : undefined;
    const normalizedSeo = Object.prototype.hasOwnProperty.call(body, "seo")
      ? normalizeSeo(body.seo)
      : undefined;
    const normalizedShipping = Object.prototype.hasOwnProperty.call(
      body,
      "shipping"
    )
      ? normalizeShipping(body.shipping)
      : undefined;
    const normalizedRelated = Object.prototype.hasOwnProperty.call(
      body,
      "related"
    )
      ? normalizeRelated(body.related)
      : undefined;
    const normalizedReturnPolicy = Object.prototype.hasOwnProperty.call(
      body,
      "returnPolicy"
    )
      ? normalizeTemplateOrCustom(body.returnPolicy, "قوانین مرجوعی")
      : undefined;
    const normalizedHandlingTime = Object.prototype.hasOwnProperty.call(
      body,
      "handlingTime"
    )
      ? normalizeTemplateOrCustom(body.handlingTime, "زمان آماده‌سازی")
      : undefined;

    // اعمال تغییرات روی Document
    if (Object.prototype.hasOwnProperty.call(body, "title")) {
      prod.title =
        typeof body.title === "string" ? body.title.trim() : prod.title;
    }

    if (normalizedSlug !== undefined) {
      prod.slug = normalizedSlug;
    }

    if (Object.prototype.hasOwnProperty.call(body, "shortDescription")) {
      prod.shortDescription =
        typeof body.shortDescription === "string"
          ? body.shortDescription.trim()
          : prod.shortDescription;
    }

    if (Object.prototype.hasOwnProperty.call(body, "overviewHtml")) {
      prod.overviewHtml =
        typeof body.overviewHtml === "string" ? body.overviewHtml : "";
    }

    if (newCategoryId) {
      prod.categoryId = newCategoryId;
    }

    if (Object.prototype.hasOwnProperty.call(body, "brandId")) {
      const bid = validateOptionalObjectId(body.brandId, "شناسه برند");
      prod.brandId = bid;
    }

    if (normalizedTags !== undefined) {
      prod.tags = normalizedTags;
    }

    if (Object.prototype.hasOwnProperty.call(body, "status") && body.status) {
      prod.status = body.status;
    }

    if (hasVisible) {
      prod.visible = !!body.visible;
    }

    if (hasPrice && priceInt !== undefined) {
      prod.price = priceInt;
    }

    if (normalizedCurrency !== undefined) {
      prod.currency = normalizedCurrency;
    }

    if (hasCompareAt) {
      if (compareAtInt === undefined) {
        prod.compareAt = undefined;
      } else {
        prod.compareAt = compareAtInt;
      }
    }

    if (hasCost) {
      if (costInt === undefined) {
        prod.cost = undefined;
      } else {
        prod.cost = costInt;
      }
    }

    if (normalizedInventory !== undefined) {
      if (!prod.inventory) prod.inventory = {};
      if (Object.prototype.hasOwnProperty.call(normalizedInventory, "manage")) {
        prod.inventory.manage = normalizedInventory.manage;
      }
      if (Object.prototype.hasOwnProperty.call(normalizedInventory, "qty")) {
        prod.inventory.qty = normalizedInventory.qty;
      }
    }

    if (
      Object.prototype.hasOwnProperty.call(body, "stockStatus") &&
      body.stockStatus
    ) {
      prod.stockStatus = body.stockStatus;
    }

    if (hasLowStock) {
      prod.lowStockThreshold =
        lowStockThreshInt === undefined ? undefined : lowStockThreshInt;
    }

    if (Object.prototype.hasOwnProperty.call(body, "publishAt")) {
      prod.publishAt = publishAtDate;
    }

    if (hasAllowBackorder) {
      prod.allowBackorder = !!body.allowBackorder;
    }

    if (hasRestockNotifyEnabled) {
      prod.restockNotifyEnabled = !!body.restockNotifyEnabled;
    }

    if (hasHasVariants) {
      prod.hasVariants = !!body.hasVariants;
    }

    if (normalizedOptions !== undefined) {
      prod.options = normalizedOptions;
    }

    if (normalizedVariants !== undefined) {
      prod.variants = normalizedVariants;
    }

    if (normalizedImages !== undefined) {
      prod.images = normalizedImages;
    }

    if (Object.prototype.hasOwnProperty.call(body, "videos")) {
      if (Array.isArray(body.videos)) {
        prod.videos = body.videos;
      } else if (body.videos == null) {
        prod.videos = [];
      }
    }

    if (normalizedAttributes !== undefined) {
      prod.attributes = normalizedAttributes;
    }

    if (normalizedTechSpecs !== undefined) {
      prod.techSpecs = normalizedTechSpecs;
    }

    if (normalizedSeo !== undefined) {
      prod.seo = normalizedSeo;
    }

    if (normalizedShipping !== undefined) {
      prod.shipping = normalizedShipping;
    }

    if (Object.prototype.hasOwnProperty.call(body, "warranty")) {
      prod.warranty =
        body.warranty === undefined || body.warranty === null
          ? undefined
          : String(body.warranty);
    }

    if (normalizedReturnPolicy !== undefined) {
      prod.returnPolicy = normalizedReturnPolicy;
    }

    if (normalizedHandlingTime !== undefined) {
      prod.handlingTime = normalizedHandlingTime;
    }

    if (normalizedRelated !== undefined) {
      prod.related = normalizedRelated;
    }

    if (
      Object.prototype.hasOwnProperty.call(body, "breadcrumbsCache") &&
      Array.isArray(body.breadcrumbsCache)
    ) {
      prod.breadcrumbsCache = body.breadcrumbsCache;
    }

    await prod.save();

    return res.json({
      success: true,
      error: false,
      message: "محصول بروزرسانی شد",
    });
  } catch (err) {
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

    return res.status(500).json({
      success: false,
      error: true,
      message: "خطای غیرمنتظره در بروزرسانی محصول",
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

    return res.status(200).json({
      success: true,
      error: false,
      data: {
        items,
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

    // تصمیم: وقتی برمی‌گردد، ACTIVE و قابل نمایش باشد
    prod.status = "ACTIVE";
    prod.visible = true;

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


