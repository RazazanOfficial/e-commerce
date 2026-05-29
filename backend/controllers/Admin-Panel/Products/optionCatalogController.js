//? 🔵 Required Modules
const mongoose = require("mongoose");
const { OptionCatalog, Product } = require("../../../models/productModel");

//* 🟢 Create Required Fields
const REQUIRED = {
  create: {
    name: "نام آپشن الزامی است",
    code: "کد آپشن الزامی است",
  },
};

//* 🟢 Allowed Update Fields
const ALLOWED_UPDATE_FIELDS = new Set(["name", "code", "values", "isActive"]);

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

//* 🟢 normalizeValues Utility
const normalizeValues = (values) => {
  if (values === undefined) return undefined;
  if (values === null) return [];
  let arr = [];
  if (Array.isArray(values)) {
    arr = values.map((v) => String(v).trim()).filter(Boolean);
  } else if (typeof values === "string") {
    arr = values
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
  } else {
    return [];
  }


  const seen = new Set();
  const uniq = [];
  for (const v of arr) {
    const key = v.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      uniq.push(v);
    }
  }
  return uniq;
};

//* 🟢 validateAndNormalizeCode Utility
const validateAndNormalizeCode = async (code, currentId = null) => {
  if (code === undefined) return undefined;
  const cleaned = String(code).trim().toLowerCase();
  const codeRegex = /^[a-z0-9-]+$/;
  if (!cleaned || !codeRegex.test(cleaned)) {
    const err = new Error("کد نامعتبر است (فقط حروف انگلیسی، ارقام و -)");
    err.code = 400;
    throw err;
  }

  const exists = await OptionCatalog.exists({
    code: cleaned,
    ...(currentId ? { _id: { $ne: currentId } } : {}),
  });
  if (exists) {
    const err = new Error("code تکراری است");
    err.code = 409;
    throw err;
  }
  return cleaned;
};

//* 🟢 validateUniqueName Utility
const validateUniqueName = async (name, currentId = null) => {
  if (name === undefined) return undefined;
  const cleaned = String(name).trim();
  if (!cleaned) {
    const err = new Error("نام آپشن الزامی است");
    err.code = 400;
    throw err;
  }
  const exists = await OptionCatalog.exists({
    name: cleaned,
    ...(currentId ? { _id: { $ne: currentId } } : {}),
  });
  if (exists) {
    const err = new Error("name تکراری است");
    err.code = 409;
    throw err;
  }
  return cleaned;
};

//* 🟢 Get All Option Catalogs Controller
const getAllOptionCatalogs = async (req, res) => {
  try {
    const {
      q,
      isActive,
      page = "1",
      limit = "50",
      sort = "name",
      dir = "asc",
    } = req.query || {};

    const filter = {};
    if (q && String(q).trim()) {
      const s = String(q).trim();
      filter.$or = [
        { name: { $regex: s, $options: "i" } },
        { code: { $regex: s, $options: "i" } },
      ];
    }
    if (isActive !== undefined) {
      if (isActive === "true" || isActive === true) filter.isActive = true;
      else if (isActive === "false" || isActive === false) filter.isActive = false;
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));
    const sortDir = String(dir).toLowerCase() === "desc" ? -1 : 1;
    const sortField = ["name", "code", "isActive", "createdAt", "updatedAt"].includes(sort)
      ? sort
      : "name";

    const total = await OptionCatalog.countDocuments(filter);
    const pages = Math.max(1, Math.ceil(total / limitNum));
    const skip = (pageNum - 1) * limitNum;

    const items = await OptionCatalog.find(filter)
      .sort({ [sortField]: sortDir, _id: 1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    return res.status(200).json({
      success: true,
      error: false,
      data: {
        items,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages,
        },
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: true,
      message: "خطا در دریافت لیست آپشن‌ها",
    });
  }
};

//* 🟢 Create Option Catalog Controller
const createOptionCatalog = async (req, res) => {
  try {
    let { name, code, values, isActive } = req.body || {};

    const requiredErr = validateRequired(REQUIRED.create, { name, code });
    if (requiredErr) {
      return res.status(400).json({ success: false, error: true, message: requiredErr });
    }

    name = await validateUniqueName(name);
    code = await validateAndNormalizeCode(code);
    values = normalizeValues(values) ?? [];

    const doc = await OptionCatalog.create({
      name,
      code,
      values,
      isActive: typeof isActive === "boolean" ? isActive : true,
    });

    return res.status(201).json({ success: true, error: false, data: doc });
  } catch (err) {
    const status = err?.code === 409 ? 409 : err?.code === 400 ? 400 : 500;
    if (err?.code === 11000) {
      const field = Object.keys(err.keyValue || {})[0] || "field";
      return res.status(409).json({ success: false, error: true, message: `${field} تکراری است` });
    }
    return res.status(status).json({
      success: false,
      error: true,
      message: err?.message || "خطای داخلی سرور",
    });
  }
};

//* 🟢 Get All Option Catalogs Controller/:id
const getOptionCatalogById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: true, message: "شناسه نامعتبر است" });
    }
    const doc = await OptionCatalog.findById(id).lean();
    if (!doc) {
      return res.status(404).json({ success: false, error: true, message: "آپشن پیدا نشد" });
    }
    return res.status(200).json({ success: true, error: false, data: doc });
  } catch (err) {
    return res.status(500).json({ success: false, error: true, message: "خطا در دریافت آپشن" });
  }
};

//* 🟢 Update Option Catalog Controller
const updateOptionCatalog = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: true, message: "شناسه نامعتبر است" });
    }

    const unknownKeys = Object.keys(req.body || {}).filter((k) => !ALLOWED_UPDATE_FIELDS.has(k));
    if (unknownKeys.length) {
      return res.status(400).json({
        success: false,
        error: true,
        message: `فیلد(های) نامعتبر: ${unknownKeys.join(", ")}`,
      });
    }

    const doc = await OptionCatalog.findById(id);
    if (!doc) {
      return res.status(404).json({ success: false, error: true, message: "آپشن پیدا نشد" });
    }


    if (Object.prototype.hasOwnProperty.call(req.body, "name")) {
      doc.name = await validateUniqueName(req.body.name, id);
    }


    if (Object.prototype.hasOwnProperty.call(req.body, "code")) {
      doc.code = await validateAndNormalizeCode(req.body.code, id);
    }


    if (Object.prototype.hasOwnProperty.call(req.body, "values")) {
      doc.values = normalizeValues(req.body.values) ?? [];
    }


    if (Object.prototype.hasOwnProperty.call(req.body, "isActive")) {
      doc.isActive = !!req.body.isActive;
    }

    await doc.save();
    return res.status(200).json({ success: true, error: false, data: doc });
  } catch (err) {
    const status = err?.code === 409 ? 409 : err?.code === 400 ? 400 : 500;
    if (err?.code === 11000) {
      const field = Object.keys(err.keyValue || {})[0] || "field";
      return res.status(409).json({ success: false, error: true, message: `${field} تکراری است` });
    }
    return res.status(status).json({ success: false, error: true, message: err?.message || "خطای داخلی سرور" });
  }
};

//* 🟢 Toggle Option Catalog Controller
const toggleOptionCatalogActive = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: true, message: "شناسه نامعتبر است" });
    }
    const doc = await OptionCatalog.findById(id);
    if (!doc) {
      return res.status(404).json({ success: false, error: true, message: "آپشن پیدا نشد" });
    }
    doc.isActive = !doc.isActive;
    await doc.save();
    return res.status(200).json({ success: true, error: false, data: doc });
  } catch (err) {
    return res.status(500).json({ success: false, error: true, message: "خطا در تغییر وضعیت" });
  }
};

//* 🟢 Delete Option Catalog Controller
const deleteOptionCatalog = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: true, message: "شناسه نامعتبر است" });
    }

    const doc = await OptionCatalog.findById(id);
    if (!doc) {
      return res.status(404).json({ success: false, error: true, message: "آپشن پیدا نشد" });
    }

    const used = await Product.exists({
      $or: [{ "options.name": doc.name }, { "options.name": doc.code }],
    });
    if (used) {
      return res.status(409).json({
        success: false,
        error: true,
        message: "این آپشن در برخی محصولات استفاده شده و قابل حذف نیست (ابتدا محصولات را بروزرسانی کنید)",
      });
    }

    await doc.deleteOne();
    return res.status(200).json({ success: true, error: false, message: "آپشن حذف شد" });
  } catch (err) {
    return res.status(500).json({ success: false, error: true, message: "خطا در حذف آپشن" });
  }
};

module.exports = {
  createOptionCatalog,
  getAllOptionCatalogs,
  getOptionCatalogById,
  updateOptionCatalog,
  deleteOptionCatalog,
  toggleOptionCatalogActive,
};
