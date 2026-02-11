const TagCatalog = require("../../../models/tagCatalogModel");
const Product = require("../../../models/productModel");

function normalizeKey(input) {
  return String(input || "")
    .trim()
    .replace(/\s+/g, "_");
}

// POST /api/admin/tag-catalogs
exports.createTagCatalog = async (req, res, next) => {
  try {
    const { label, key, isActive } = req.body;

    if (!label || !String(label).trim()) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "عنوان تگ الزامی است",
      });
    }

    const normalizedKey = normalizeKey(key || label);

    const exists = await TagCatalog.findOne({ key: normalizedKey });
    if (exists) {
      return res.status(409).json({
        success: false,
        error: true,
        message: "این تگ قبلاً ثبت شده است",
      });
    }

    const doc = await TagCatalog.create({
      label: String(label).trim(),
      key: normalizedKey,
      isActive: isActive !== undefined ? !!isActive : true,
    });

    return res.status(201).json({
      success: true,
      message: "تگ با موفقیت ایجاد شد",
      data: doc,
    });
  } catch (err) {
    return next(err);
  }
};

// GET /api/admin/tag-catalogs
exports.getAllTagCatalogs = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || "50", 10), 1), 200);
    const q = String(req.query.q || "").trim();
    const isActive = req.query.isActive;

    const filter = {};
    if (q) {
      filter.$or = [
        { label: { $regex: q, $options: "i" } },
        { key: { $regex: q, $options: "i" } },
      ];
    }
    if (isActive === "true") filter.isActive = true;
    if (isActive === "false") filter.isActive = false;

    const [items, total] = await Promise.all([
      TagCatalog.find(filter).sort({ updatedAt: -1 }).skip((page - 1) * limit).limit(limit),
      TagCatalog.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      page,
      limit,
      total,
      items,
    });
  } catch (err) {
    return next(err);
  }
};

// GET /api/admin/tag-catalogs/suggest?q=...
exports.suggestTags = async (req, res, next) => {
  try {
    const q = String(req.query.q || "").trim();
    if (!q) {
      return res.status(200).json({ success: true, items: [] });
    }
    const items = await TagCatalog.find({
      isActive: true,
      $or: [{ label: { $regex: `^${q}`, $options: "i" } }, { key: { $regex: `^${q}`, $options: "i" } }],
    })
      .sort({ updatedAt: -1 })
      .limit(15);

    return res.status(200).json({ success: true, items });
  } catch (err) {
    return next(err);
  }
};

// GET /api/admin/tag-catalogs/:id
exports.getTagCatalogById = async (req, res, next) => {
  try {
    const doc = await TagCatalog.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ success: false, error: true, message: "تگ یافت نشد" });
    }
    return res.status(200).json({ success: true, data: doc });
  } catch (err) {
    return next(err);
  }
};

// PUT /api/admin/tag-catalogs/:id
exports.updateTagCatalog = async (req, res, next) => {
  try {
    const { label, key, isActive } = req.body;
    const doc = await TagCatalog.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ success: false, error: true, message: "تگ یافت نشد" });
    }

    if (label !== undefined) doc.label = String(label).trim();
    if (key !== undefined) doc.key = normalizeKey(key);
    if (isActive !== undefined) doc.isActive = !!isActive;

    // Uniqueness check for key
    if (key !== undefined) {
      const exists = await TagCatalog.findOne({ key: doc.key, _id: { $ne: doc._id } });
      if (exists) {
        return res.status(409).json({ success: false, error: true, message: "کلید تگ تکراری است" });
      }
    }

    await doc.save();
    return res.status(200).json({ success: true, message: "تگ بروزرسانی شد", data: doc });
  } catch (err) {
    return next(err);
  }
};

// PATCH /api/admin/tag-catalogs/:id/toggle
exports.toggleTagCatalog = async (req, res, next) => {
  try {
    const doc = await TagCatalog.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ success: false, error: true, message: "تگ یافت نشد" });
    }
    if (req.body?.isActive !== undefined) {
      doc.isActive = !!req.body.isActive;
    } else {
      doc.isActive = !doc.isActive;
    }
    await doc.save();
    return res.status(200).json({ success: true, message: "وضعیت تگ تغییر کرد", data: doc });
  } catch (err) {
    return next(err);
  }
};

// DELETE /api/admin/tag-catalogs/:id
exports.deleteTagCatalog = async (req, res, next) => {
  try {
    const doc = await TagCatalog.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ success: false, error: true, message: "تگ یافت نشد" });
    }

    // Block delete if used in any product.tags
    const used = await Product.countDocuments({ tags: { $in: [doc.key, doc.label] } });
    if (used > 0) {
      return res.status(409).json({
        success: false,
        error: true,
        message: "این تگ در محصولات استفاده شده و قابل حذف نیست",
      });
    }

    await TagCatalog.deleteOne({ _id: doc._id });
    return res.status(200).json({ success: true, message: "تگ حذف شد" });
  } catch (err) {
    return next(err);
  }
};
