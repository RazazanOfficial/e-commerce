const TagCatalog = require("../../../models/tagCatalogModel");
const { Product } = require("../../../models/productModel");

function normalizeKey(input) {
  return String(input || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/_+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function escapeRegExp(str) {
  return String(str || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function sendErr(res, err, fallbackMessage = "خطای داخلی سرور") {
  // eslint-disable-next-line no-console
  console.error(err);
  return res.status(err?.statusCode || 500).json({
    success: false,
    error: true,
    message: err?.message || fallbackMessage,
  });
}

// POST /api/admin/tag-catalogs
exports.createTagCatalog = async (req, res) => {
  try {
    const label = req.body?.label ?? req.body?.name ?? req.body?.title;
    const key = req.body?.key;
    const isActive = req.body?.isActive;

    if (!label || !String(label).trim()) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "عنوان تگ الزامی است",
      });
    }

    const normalizedKey = normalizeKey(key || label);
    if (!normalizedKey) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "کلید تگ نامعتبر است",
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
    // Duplicate key (Mongo)
    if (err?.code === 11000) {
      return res.status(409).json({
        success: false,
        error: true,
        message: "این تگ قبلاً ثبت شده است",
      });
    }
    return sendErr(res, err);
  }
};

// GET /api/admin/tag-catalogs
exports.getAllTagCatalogs = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query?.page || "1", 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query?.limit || "50", 10), 1), 200);
    const q = String(req.query?.q || "").trim();
    const isActive = req.query?.isActive;

    const filter = {};
    if (q) {
      const safe = escapeRegExp(q);
      filter.$or = [
        { label: { $regex: safe, $options: "i" } },
        { key: { $regex: safe, $options: "i" } },
      ];
    }
    if (isActive !== undefined && isActive !== "") {
      filter.isActive = String(isActive) === "true";
    }

    const [items, total] = await Promise.all([
      TagCatalog.find(filter).sort({ updatedAt: -1 }).skip((page - 1) * limit).limit(limit),
      TagCatalog.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: items,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    return sendErr(res, err);
  }
};

// GET /api/admin/tag-catalogs/suggest?q=...
exports.suggestTags = async (req, res) => {
  try {
    const q = String(req.query?.q || "").trim();
    if (!q) {
      return res.status(200).json({ success: true, data: [] });
    }

    const safe = escapeRegExp(q);
    const items = await TagCatalog.find({
      isActive: true,
      $or: [
        { label: { $regex: safe, $options: "i" } },
        { key: { $regex: safe, $options: "i" } },
      ],
    })
      .sort({ updatedAt: -1 })
      .limit(15)
      .select("_id label key isActive");

    return res.status(200).json({ success: true, data: items });
  } catch (err) {
    return sendErr(res, err);
  }
};

// GET /api/admin/tag-catalogs/:id
exports.getTagCatalogById = async (req, res) => {
  try {
    const doc = await TagCatalog.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({
        success: false,
        error: true,
        message: "تگ یافت نشد",
      });
    }
    return res.status(200).json({ success: true, data: doc });
  } catch (err) {
    return sendErr(res, err);
  }
};

// PUT /api/admin/tag-catalogs/:id
exports.updateTagCatalog = async (req, res) => {
  try {
    const label = req.body?.label ?? req.body?.name ?? req.body?.title;
    const key = req.body?.key;
    const isActive = req.body?.isActive;

    const doc = await TagCatalog.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({
        success: false,
        error: true,
        message: "تگ یافت نشد",
      });
    }

    if (label !== undefined) {
      if (!String(label).trim()) {
        return res.status(400).json({
          success: false,
          error: true,
          message: "عنوان تگ الزامی است",
        });
      }
      doc.label = String(label).trim();
    }

    if (key !== undefined) {
      const normalizedKey = normalizeKey(key);
      if (!normalizedKey) {
        return res.status(400).json({
          success: false,
          error: true,
          message: "کلید تگ نامعتبر است",
        });
      }
      doc.key = normalizedKey;
    }

    if (isActive !== undefined) {
      doc.isActive = !!isActive;
    }

    await doc.save();

    return res.status(200).json({
      success: true,
      message: "تگ بروزرسانی شد",
      data: doc,
    });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({
        success: false,
        error: true,
        message: "این کلید تگ قبلاً استفاده شده است",
      });
    }
    return sendErr(res, err);
  }
};

// PATCH /api/admin/tag-catalogs/:id/toggle
exports.toggleTagCatalog = async (req, res) => {
  try {
    const doc = await TagCatalog.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({
        success: false,
        error: true,
        message: "تگ یافت نشد",
      });
    }

    if (req.body && typeof req.body.isActive === "boolean") {
      doc.isActive = req.body.isActive;
    } else {
      doc.isActive = !doc.isActive;
    }

    await doc.save();

    return res.status(200).json({
      success: true,
      message: "وضعیت تگ بروزرسانی شد",
      data: doc,
    });
  } catch (err) {
    return sendErr(res, err);
  }
};

// DELETE /api/admin/tag-catalogs/:id
exports.deleteTagCatalog = async (req, res) => {
  try {
    const doc = await TagCatalog.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({
        success: false,
        error: true,
        message: "تگ یافت نشد",
      });
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

    return res.status(200).json({
      success: true,
      message: "تگ حذف شد",
    });
  } catch (err) {
    return sendErr(res, err);
  }
};
