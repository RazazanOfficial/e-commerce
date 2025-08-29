// controllers/Admin-Panel/Products/categoryController.js

// ✅ No slugify here — user must provide slug explicitly.
const mongoose = require("mongoose");
const CategoryModel = require("../../../models/categoryModel");

// ---- Required fields config (controller-level, easy to edit later) ----
const REQUIRED = {
  create: {
    name: "نام دسته‌بندی الزامی است",
    slug: "اسلاگ (slug) الزامی است",
  },
  update: {},
};

const validateRequired = (schema, payload) => {
  for (const [field, message] of Object.entries(schema)) {
    const v = payload?.[field];
    if (v === undefined || v === null || (typeof v === "string" && !v.trim())) {
      return message;
    }
  }
  return null;
};

// Normalizes keywords to an array of trimmed strings
const normalizeKeywords = (keywords) => {
  if (keywords === undefined) return undefined;
  if (Array.isArray(keywords))
    return keywords.map((k) => String(k).trim()).filter(Boolean);
  if (typeof keywords === "string")
    return keywords
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);
  return [];
};

// Resolves a parent value (ObjectId | name | slug) to an ObjectId or null
const resolveParentId = async (parent) => {
  if (parent === undefined || parent === null || parent === "") return null;
  if (mongoose.Types.ObjectId.isValid(parent)) {
    const p = await CategoryModel.findById(parent).select("_id");
    return p ? p._id : null;
  }
  if (typeof parent === "string") {
    const p = await CategoryModel.findOne({
      $or: [{ name: parent }, { slug: parent }],
    }).select("_id");
    return p ? p._id : null;
  }
  return null;
};
// checks if targetParentId is inside the subtree of categoryId (to prevent cycles)
const willCreateCycle = async (categoryId, targetParentId) => {
  if (!targetParentId) return false;
  let cursor = targetParentId;
  // بالا رفتن در زنجیرهٔ والدها تا ریشه
  while (cursor) {
    if (String(cursor) === String(categoryId)) return true; // حلقه!
    const p = await CategoryModel.findById(cursor).select("parent").lean();
    if (!p) break;
    cursor = p.parent;
  }
  return false;
};

const validateAndNormalizeSlug = async (slug, currentId = null) => {
  if (typeof slug === "undefined") return null; // یعنی کاربر قصد تغییر slug ندارد

  const cleaned = String(slug).trim().toLowerCase();

  // اگر می‌خوای سخت‌گیر باشی روی کاراکترها:
  const slugRegex = /^[a-z0-9-]+$/; // فقط حروف/عدد/خط تیره
  if (!cleaned || !slugRegex.test(cleaned)) {
    throw new Error("اسلاگ نامعتبر است (فقط حروف انگلیسی، ارقام و -)");
  }

  // یکتا بودن به‌جز خود آیتم
  const exists = await CategoryModel.exists({
    slug: cleaned,
    ...(currentId ? { _id: { $ne: currentId } } : {}),
  });
  if (exists) {
    const err = new Error("slug تکراری است");
    err.code = 409; // برای مپ‌کردن به 409
    throw err;
  }

  return cleaned;
};
const ALLOWED_UPDATE_FIELDS = new Set([
  "name",
  "slug",
  "description",
  "image",
  "imageAlt",
  "isActive",
  "sortOrder",
  "parent",
  "keywords",
  "metaTitle",
  "metaDescription",
]);
// ---------------------------------------------------------------------
// Create Category
// ---------------------------------------------------------------------
const createCategory = async (req, res) => {
  try {
    let {
      name,
      slug,
      description,
      image,
      imageAlt,
      isActive,
      metaTitle,
      metaDescription,
      keywords,
      parent,
      // ⚠️ sortOrder intentionally ignored on create per spec
    } = req.body || {};

    // Required fields validation from map
    const requiredErr = validateRequired(REQUIRED.create, { name, slug });
    if (requiredErr) {
      return res
        .status(400)
        .json({ success: false, error: true, message: requiredErr });
    }

    // Trim/normalize minimal
    name = String(name).trim();
    slug = String(slug).trim();
    if (!slug) {
      return res
        .status(400)
        .json({ success: false, error: true, message: REQUIRED.create.slug });
    }

    // Unique slug check
    const slugExists = await CategoryModel.exists({ slug });
    if (slugExists) {
      return res
        .status(409)
        .json({ success: false, error: true, message: "slug تکراری است" });
    }

    // Resolve parent (ObjectId | name | slug)
    const parentId = await resolveParentId(parent);
    if (parent !== undefined && parent !== null && parent !== "" && !parentId) {
      return res
        .status(400)
        .json({ success: false, error: true, message: "والد یافت نشد" });
    }

    // Keywords
    keywords = normalizeKeywords(keywords) ?? [];

    // Compute sortOrder: ALWAYS last among siblings, user cannot set it
    const siblingFilter = { parent: parentId };
    const maxSibling = await CategoryModel.findOne(siblingFilter)
      .sort("-sortOrder")
      .select("sortOrder");
    const sortOrder = (maxSibling?.sortOrder || 0) + 1;

    const doc = await CategoryModel.create({
      name,
      slug,
      description,
      image,
      imageAlt,
      isActive: typeof isActive === "boolean" ? isActive : true,
      sortOrder,
      metaTitle: metaTitle || name,
      metaDescription: metaDescription || description || "",
      keywords,
      parent: parentId,
    });

    return res.status(201).json({ success: true, error: false, data: doc });
  } catch (err) {
    if (err?.code === 11000) {
      const field = Object.keys(err.keyValue || {})[0];
      return res.status(409).json({
        success: false,
        error: true,
        message: `${field} تکراری است`,
      });
    }
    return res.status(500).json({
      success: false,
      error: true,
      message: "خطای داخلی سرور",
    });
  }
};

// ---------------------------------------------------------------------
// Get All Categories
// ---------------------------------------------------------------------
const getAllCategories = async (_req, res) => {
  try {
    const list = await CategoryModel.find({})
      .sort({ parent: 1, sortOrder: 1, name: 1 })
      .lean();
    return res.status(200).json({ success: true, error: false, data: list });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: true,
      message: "خطا در دریافت دسته‌بندی‌ها",
    });
  }
};

// ---------------------------------------------------------------------
// Update Category (partial)
// ---------------------------------------------------------------------
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    let {
      name,
      slug,
      description,
      image,
      imageAlt,
      isActive,
      sortOrder,
      parent,
      metaTitle,
      metaDescription,
      keywords,
    } = req.body;

    const unknownKeys = Object.keys(req.body).filter(
      (k) => !ALLOWED_UPDATE_FIELDS.has(k)
    );
    if (unknownKeys.length) {
      return res.status(400).json({
        success: false,
        error: true,
        message: `فیلد(های) نامعتبر: ${unknownKeys.join(", ")}`,
      });
    }
    // 1) پیدا کردن آیتم
    const cat = await CategoryModel.findById(id);
    if (!cat) {
      return res
        .status(404)
        .json({ success: false, error: true, message: "دسته‌بندی پیدا نشد" });
    }

    // 2) تعیین parent هدف (و تبدیل به ObjectId یا null)
    let targetParentId = cat.parent;
    if (typeof parent !== "undefined") {
      // از همون resolveParentId که بالاتر داری استفاده کن
      targetParentId = await resolveParentId(parent);
      // اگر parent صریحاً ست شده ولی پیدا نشد، خطا بده
      if (
        parent !== null &&
        parent !== "" &&
        typeof parent !== "undefined" &&
        !targetParentId
      ) {
        return res
          .status(400)
          .json({ success: false, error: true, message: "والد یافت نشد" });
      }
    }

    // ✅ جلوگیری از self-parent
    if (targetParentId && String(targetParentId) === String(cat._id)) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "یک دسته نمی‌تواند والد خودش باشد",
      });
    }

    // ✅ جلوگیری از ایجاد حلقه (قرار دادن زیرشاخه زیر خودش)
    if (await willCreateCycle(cat._id, targetParentId)) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "انتخاب والد باعث ایجاد حلقه در ساختار دسته‌بندی می‌شود",
      });
    }

    // 3) همه سیبلیگ‌های والد هدف (شامل خود آیتم اگر در همون والده)
    const siblings = await CategoryModel.find({ parent: targetParentId })
      .sort({ sortOrder: 1, _id: 1 })
      .lean();

    // 4) آرایه بدون آیتم هدف
    const withoutTarget = siblings.filter(
      (s) => String(s._id) !== String(cat._id)
    );

    // 5) جایگاه جدید (۱-مبنایی)
    const requested = Number(sortOrder);
    const newPosOneBased =
      requested > 0
        ? requested
        : cat.parent?.toString() === (targetParentId?.toString() || null) &&
          cat.sortOrder
        ? cat.sortOrder
        : withoutTarget.length + 1;
    // clamp
    const clamped = Math.min(
      Math.max(newPosOneBased, 1),
      withoutTarget.length + 1
    );
    const newIndex = clamped - 1;

    // 6) آرایه نهایی با قرار دادن آیتم هدف
    const reordered = [...withoutTarget];
    reordered.splice(newIndex, 0, { ...cat.toObject(), _id: cat._id });

    // 7) فاز اول: بالا بردن موقت sortOrder همه سیبلیگ‌های درگیر تا برخورد یونیک پیش نیاد
    const allIds = reordered.map((d) => d._id);
    await CategoryModel.updateMany(
      { _id: { $in: allIds } },
      { $inc: { sortOrder: 100000 } }
    );
    // --- validate slug if provided ---
    let normalizedSlug = null;
    try {
      normalizedSlug = await validateAndNormalizeSlug(slug, cat._id);
    } catch (e) {
      const status = e.code === 409 ? 409 : 400;
      return res
        .status(status)
        .json({ success: false, error: true, message: e.message });
    }

    // 8) فاز دوم: نوشتن sortOrder نهایی (۱,۲,۳,…) + parent هدف برای همه
    const ops = reordered.map((doc, idx) => ({
      updateOne: {
        filter: { _id: doc._id },
        update: {
          $set: { sortOrder: idx + 1, parent: targetParentId ?? null },
        },
      },
    }));

    // 9) ست‌کردن سایر فیلدهای اختیاری روی خود آیتم (در صورت ارسال)
    const optionalSets = {};
    if (typeof name !== "undefined") optionalSets.name = String(name).trim();
    if (normalizedSlug !== null) optionalSets.slug = normalizedSlug;
    if (typeof description !== "undefined")
      optionalSets.description = description;
    if (typeof image !== "undefined") optionalSets.image = image;
    if (typeof imageAlt !== "undefined") optionalSets.imageAlt = imageAlt;
    if (typeof isActive !== "undefined") optionalSets.isActive = isActive;
    if (typeof metaTitle !== "undefined") optionalSets.metaTitle = metaTitle;
    if (typeof metaDescription !== "undefined")
      optionalSets.metaDescription = metaDescription;
    if (Object.prototype.hasOwnProperty.call(req.body, "keywords")) {
      optionalSets.keywords = normalizeKeywords(req.body.keywords) ?? [];
    }

    if (Object.keys(optionalSets).length) {
      // اگر slug تغییر کرد، ممکنه DuplicateKey بخوری؛ اشکالی نداره، هندل می‌کنیم
      ops.push({
        updateOne: {
          filter: { _id: cat._id },
          update: { $set: optionalSets },
        },
      });
    }

    await CategoryModel.bulkWrite(ops, { ordered: true });

    return res.json({
      success: true,
      error: false,
      message: "بروزرسانی انجام شد",
    });
  } catch (err) {
    // DuplicateKey خواناتر
    if (err?.code === 11000) {
      const which = Object.keys(err.keyPattern || {}).join(", ");
      return res.status(400).json({
        success: false,
        error: true,
        message: which ? `مقدار تکراری برای: ${which}` : "کلید تکراری",
      });
    }

    return res.status(500).json({
      success: false,
      error: true,
      message: "خطای غیرمنتظره در بروزرسانی",
    });
  }
};

// ---------------------------------------------------------------------
// Delete Category (block if children exist)
// ---------------------------------------------------------------------
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, error: true, message: "شناسه نامعتبر است" });
    }

    const doc = await CategoryModel.findById(id).select("parent sortOrder");
    if (!doc) {
      return res
        .status(404)
        .json({ success: false, error: true, message: "دسته‌بندی یافت نشد" });
    }

    // Block deletion if it has children
    const childrenCount = await CategoryModel.countDocuments({ parent: id });
    if (childrenCount > 0) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "این دسته‌بندی به‌دلیل داشتن زیرمجموعه قابل حذف نیست",
      });
    }

    await CategoryModel.findByIdAndDelete(id);

    // Compact sibling orders after deletion
    await CategoryModel.updateMany(
      { parent: doc.parent, sortOrder: { $gt: doc.sortOrder } },
      { $inc: { sortOrder: -1 } }
    );

    return res.status(200).json({ success: true, error: false , message: "دسته‌بندی با موفقیت حذف شد."});
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, error: true, message: "خطا در حذف دسته‌بندی" });
  }
};

module.exports = {
  createCategory,
  getAllCategories,
  updateCategory,
  deleteCategory,
};
