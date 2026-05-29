//? 🔵 Required Modules
const mongoose = require("mongoose");
const { Product } = require("../../../../models/productModel");
const {
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
  normalizeVariants,
} = require("./productHelpers");

//* 🟢 Update Product Controller
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


    //* 🟢 Allowed Update Fields
    const rawBody = req.body || {};
    const body = {};
    for (const k of Object.keys(rawBody)) {
      if (ALLOWED_UPDATE_FIELDS.has(k)) body[k] = rawBody[k];
    }


    //* 🟢 Status Validation
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


    //* 🟢 Effective Values
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


    //* 🟢 Slug Validation
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


    //* 🟢 Category Validation
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


    //* 🟢 Pricing Validation
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


    //* 🟢 Currency Validation
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


    //* 🟢 Inventory Validation
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


    //* 🟢 Tag Normalization
    const normalizedTags = Object.prototype.hasOwnProperty.call(body, "tags")
      ? normalizeTags(body.tags)
      : undefined;


    //* 🟢 Media Validation
    let normalizedMedia;
    let normalizedImages;

    try {
      if (Object.prototype.hasOwnProperty.call(body, "media")) {
        normalizedMedia = normalizeMedia(body.media, { required: false, isActive });
      }

      if (Object.prototype.hasOwnProperty.call(body, "images")) {

        normalizedImages = normalizeImages(body.images, { required: false });
      }
    } catch (e) {
      return res
        .status(400)
        .json({ success: false, error: true, message: e.message });
    }


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


      try {
        if (!Object.prototype.hasOwnProperty.call(body, "media") && hasMedia) {

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


    //* 🟢 Publish Date Validation
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


    //* 🟢 Update Payload
    const payload = {
      status: effectiveStatus,

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


    //* 🟢 Database Write
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


//? 🔵 Export Controller
module.exports = { updateProduct };
