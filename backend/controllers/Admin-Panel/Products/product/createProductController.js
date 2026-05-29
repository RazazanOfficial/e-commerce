//? 🔵 Required Modules
const { Product } = require("../../../../models/productModel");
const {
  REQUIRED,
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


    //* 🟢 Status Validation
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


    //* 🟢 Active Product Requirements
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


    //* 🟢 Slug Validation
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


    //* 🟢 Category Validation
    if (isActive || (categoryId !== undefined && categoryId !== null && categoryId !== "")) {
      try {
        await validateCategoryId(categoryId);
      } catch (e) {
        return res
          .status(400)
          .json({ success: false, error: true, message: e.message });
      }
    }


    //* 🟢 Pricing Validation
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


    //* 🟢 Currency Validation
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


    //* 🟢 Inventory Validation
    let normalizedInventory;
    try {
      normalizedInventory = normalizeInventory(inventory);
    } catch (e) {
      return res
        .status(400)
        .json({ success: false, error: true, message: e.message });
    }


    //* 🟢 Tag Normalization
    tags = normalizeTags(tags);


    //* 🟢 Media Validation
    let normalizedMedia;
    try {
      normalizedMedia = normalizeMedia(media, { required: false, isActive });
    } catch (e) {
      return res
        .status(400)
        .json({ success: false, error: true, message: e.message });
    }


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


    //* 🟢 Publish Date Validation
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


    hasVariants = typeof hasVariants === "boolean" ? hasVariants : false;

    allowBackorder =
      typeof allowBackorder === "boolean" ? allowBackorder : false;
    restockNotifyEnabled =
      typeof restockNotifyEnabled === "boolean" ? restockNotifyEnabled : true;

    //* 🟢 Content Normalization
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


    //* 🟢 Product Payload
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


    //* 🟢 Database Write
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


//? 🔵 Export Controller
module.exports = { createProduct };
