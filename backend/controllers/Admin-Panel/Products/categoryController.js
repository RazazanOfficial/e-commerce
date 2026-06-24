//? 🔵 Required Modules
const mongoose = require("mongoose");
const CategoryModel = require("../../../models/categoryModel");
const { Product } = require("../../../models/productModel");

//* 🟢 Required Utilities
const REQUIRED = {
  create: {
    name: "نام دسته‌بندی الزامی است",
    slug: "اسلاگ (slug) الزامی است",
  },
  update: {},
};

//* 🟢 validateRequired Utility
const validateRequired = (schema, payload) => {
  for (const [field, message] of Object.entries(schema)) {
    const v = payload?.[field];
    if (v === undefined || v === null || (typeof v === "string" && !v.trim())) {
      return message;
    }
  }
  return null;
};

//* 🟢 normalizeKeywords Utility
const normalizeKeywords = (keywords) => {
  if (keywords === undefined) return undefined;
  if (Array.isArray(keywords))
    return keywords.map((k) => String(k).trim()).filter(Boolean);
  if (typeof keywords === "string")
    return keywords
      .split(/[،,]/)
      .map((k) => k.trim())
      .filter(Boolean);
  return [];
};

//* 🟢 resolveParentId Utility
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

//* 🟢 willCreateCycle Utility
const willCreateCycle = async (categoryId, targetParentId) => {
  if (!targetParentId) return false;
  let cursor = targetParentId;
  while (cursor) {
    if (String(cursor) === String(categoryId)) return true;
    const p = await CategoryModel.findById(cursor).select("parent").lean();
    if (!p) break;
    cursor = p.parent;
  }
  return false;
};

//* 🟢 validateAndNormalizeSlug Utility
const validateAndNormalizeSlug = async (slug, currentId = null) => {
  if (typeof slug === "undefined") return null;
  const cleaned = String(slug).trim().toLowerCase();
  const slugRegex = /^[a-z0-9-]+$/;
  if (!cleaned || !slugRegex.test(cleaned)) {
    throw new Error("اسلاگ نامعتبر است (فقط حروف انگلیسی، ارقام و -)");
  }
  const exists = await CategoryModel.exists({
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

//* 🟢 Allowed Update Fields
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

//* 🟢 Get All Categories Controller
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

//* 🟢 Create Category Controller
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
    } = req.body || {};

    const requiredErr = validateRequired(REQUIRED.create, { name, slug });
    if (requiredErr) {
      return res
        .status(400)
        .json({ success: false, error: true, message: requiredErr });
    }

    name = String(name).trim();

    let normalizedSlug;
    try {
      normalizedSlug = await validateAndNormalizeSlug(slug);
    } catch (e) {
      const status = e.code === 409 ? 409 : 400;
      return res
        .status(status)
        .json({ success: false, error: true, message: e.message });
    }

    const parentId = await resolveParentId(parent);
    if (parent !== undefined && parent !== null && parent !== "" && !parentId) {
      return res
        .status(400)
        .json({ success: false, error: true, message: "والد یافت نشد" });
    }
    keywords = normalizeKeywords(keywords) ?? [];

    const siblingFilter = { parent: parentId };
    const maxSibling = await CategoryModel.findOne(siblingFilter)
      .sort("-sortOrder")
      .select("sortOrder");
    const sortOrder = (maxSibling?.sortOrder || 0) + 1;

    const doc = await CategoryModel.create({
      name,
      slug: normalizedSlug,
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

//* 🟢 Update Category Controller
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

    const cat = await CategoryModel.findById(id);
    if (!cat) {
      return res
        .status(404)
        .json({ success: false, error: true, message: "دسته‌بندی پیدا نشد" });
    }

    const parentProvided = Object.prototype.hasOwnProperty.call(
      req.body,
      "parent"
    );
    const sortProvided = Object.prototype.hasOwnProperty.call(
      req.body,
      "sortOrder"
    );

    let targetParentId = cat.parent;
    if (parentProvided) {
      targetParentId = await resolveParentId(parent);
      if (
        parent !== null &&
        parent !== "" &&
        typeof parent !== "undefined" &&
        !targetParentId
      ) {
        return res.status(400).json({
          success: false,
          error: true,
          message: "والد یافت نشد",
        });
      }
    }

    const parentChanged =
      parentProvided &&
      String(targetParentId || "") !== String(cat.parent || "");

    if (parentChanged) {
      if (targetParentId && String(targetParentId) === String(cat._id)) {
        return res.status(400).json({
          success: false,
          error: true,
          message: "یک دسته نمی‌تواند والد خودش باشد",
        });
      }
      if (await willCreateCycle(cat._id, targetParentId)) {
        return res.status(400).json({
          success: false,
          error: true,
          message: "انتخاب والد باعث ایجاد حلقه در ساختار دسته‌بندی می‌شود",
        });
      }
    }

    let normalizedSlug = null;
    try {
      normalizedSlug = await validateAndNormalizeSlug(slug, cat._id);
    } catch (e) {
      const status = e.code === 409 ? 409 : 400;
      return res
        .status(status)
        .json({ success: false, error: true, message: e.message });
    }

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

    if (!parentChanged && !sortProvided) {
      if (Object.keys(optionalSets).length) {
        await CategoryModel.updateOne({ _id: cat._id }, { $set: optionalSets });
      }
      return res.json({
        success: true,
        error: false,
        message: "بروزرسانی انجام شد",
      });
    }

    const siblings = await CategoryModel.find({
      parent: parentChanged ? targetParentId : cat.parent,
    })
      .sort({ sortOrder: 1, _id: 1 })
      .lean();

    const withoutTarget = siblings.filter(
      (s) => String(s._id) !== String(cat._id)
    );

    const requested = Number(sortOrder);
    const newPosOneBased =
      requested > 0
        ? requested
        : !parentChanged && cat.sortOrder
        ? cat.sortOrder
        : withoutTarget.length + 1;

    const clamped = Math.min(
      Math.max(newPosOneBased, 1),
      withoutTarget.length + 1
    );
    const newIndex = clamped - 1;

    const reordered = [...withoutTarget];
    reordered.splice(newIndex, 0, { ...cat.toObject(), _id: cat._id });

    const allIds = reordered.map((d) => d._id);
    await CategoryModel.updateMany(
      { _id: { $in: allIds } },
      { $inc: { sortOrder: 100000 } }
    );

    const ops = reordered.map((doc, idx) => ({
      updateOne: {
        filter: { _id: doc._id },
        update: {
          $set: {
            sortOrder: idx + 1,
            parent: parentChanged ? targetParentId ?? null : cat.parent ?? null,
          },
        },
      },
    }));

    if (Object.keys(optionalSets).length) {
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

//* 🟢 Delete Category Controller
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

    const childrenCount = await CategoryModel.countDocuments({ parent: id });
    if (childrenCount > 0) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "این دسته‌بندی به‌دلیل داشتن زیرمجموعه قابل حذف نیست",
      });
    }

    const productsCount = await Product.countDocuments({ categoryId: id });
    if (productsCount > 0) {
      return res.status(409).json({
        success: false,
        error: true,
        message: "این دسته‌بندی به‌دلیل داشتن محصول قابل حذف نیست",
      });
    }

    await CategoryModel.findByIdAndDelete(id);

    await CategoryModel.updateMany(
      { parent: doc.parent, sortOrder: { $gt: doc.sortOrder } },
      { $inc: { sortOrder: -1 } }
    );

    return res.status(200).json({
      success: true,
      error: false,
      message: "دسته‌بندی با موفقیت حذف شد.",
    });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, error: true, message: "خطا در حذف دسته‌بندی" });
  }
};

//? 🔵 Export Controller
module.exports = {
  createCategory,
  getAllCategories,
  updateCategory,
  deleteCategory,
};
