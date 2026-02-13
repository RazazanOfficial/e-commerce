//? 🔵Required Modules
const mongoose = require("mongoose");
const CurrencyCatalog = require("../../../models/currencyCatalogModel");
const { Product } = require("../../../models/productModel");

//* 🟢 REQUIRED fields for create
const REQUIRED = {
  create: {
    nameFa: "نام فارسی واحد پول الزامی است",
    code: "کد واحد پول الزامی است",
  },
};

//* 🟢 Fields allowed for update
const ALLOWED_UPDATE_FIELDS = new Set(["nameFa", "code", "symbol", "isActive", "sortOrder"]);

//* validateRequired Utils
const validateRequired = (schema, payload) => {
  for (const [field, message] of Object.entries(schema)) {
    const v = payload?.[field];
    if (v === undefined || v === null || (typeof v === "string" && !v.trim())) {
      return message;
    }
  }
  return null;
};

function normalizeCode(code) {
  if (typeof code !== "string") throw new Error("کد واحد پول نامعتبر است");
  const cleaned = code.trim().toUpperCase();
  if (!/^[A-Z0-9_]{2,10}$/.test(cleaned)) {
    throw new Error("کد واحد پول نامعتبر است (A-Z, 0-9, _)");
  }
  return cleaned;
}

function normalizeSortOrder(v) {
  if (v === undefined || v === null || v === "") return undefined;
  const n = Number(v);
  if (!Number.isInteger(n)) throw new Error("sortOrder باید عدد صحیح باشد");
  return n;
}

// POST /api/admin/currency-catalogs
exports.createCurrencyCatalog = async (req, res, next) => {
  try {
    const requiredErr = validateRequired(REQUIRED.create, req.body || {});
    if (requiredErr) {
      return res.status(400).json({ success: false, error: true, message: requiredErr });
    }

    const { nameFa, code, symbol, isActive, sortOrder } = req.body || {};
    const normalizedCode = normalizeCode(code);

    const exists = await CurrencyCatalog.findOne({ code: normalizedCode });
    if (exists) {
      return res.status(409).json({
        success: false,
        error: true,
        message: "این کد واحد پول قبلاً ثبت شده است",
      });
    }

    const doc = await CurrencyCatalog.create({
      nameFa: String(nameFa).trim(),
      code: normalizedCode,
      symbol: symbol ? String(symbol).trim() : undefined,
      isActive: isActive !== undefined ? !!isActive : true,
      sortOrder: normalizeSortOrder(sortOrder) ?? 0,
    });

    return res.status(201).json({ success: true, error: false, data: doc });
  } catch (err) {
    return next(err);
  }
};

// GET /api/admin/currency-catalogs
exports.getAllCurrencyCatalogs = async (req, res, next) => {
  try {
    const q = String(req.query.q || "").trim();
    const isActive = req.query.isActive;

    const filter = {};
    if (q) {
      filter.$or = [
        { nameFa: { $regex: q, $options: "i" } },
        { code: { $regex: q, $options: "i" } },
      ];
    }
    if (isActive === "true" || isActive === "false") {
      filter.isActive = isActive === "true";
    }

    const items = await CurrencyCatalog.find(filter)
      .sort({ sortOrder: 1, updatedAt: -1 })
      .limit(500);

    return res.status(200).json({ success: true, error: false, data: { items } });
  } catch (err) {
    return next(err);
  }
};

// GET /api/admin/currency-catalogs/:id
exports.getCurrencyCatalogById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: true, message: "شناسه نامعتبر است" });
    }
    const doc = await CurrencyCatalog.findById(id);
    if (!doc) {
      return res.status(404).json({ success: false, error: true, message: "یافت نشد" });
    }
    return res.status(200).json({ success: true, error: false, data: doc });
  } catch (err) {
    return next(err);
  }
};

// PUT /api/admin/currency-catalogs/:id
exports.updateCurrencyCatalog = async (req, res, next) => {
  try {
    const { id } = req.params;
    const body = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: true, message: "شناسه نامعتبر است" });
    }

    const unknown = Object.keys(body).filter((k) => !ALLOWED_UPDATE_FIELDS.has(k));
    if (unknown.length) {
      return res.status(400).json({
        success: false,
        error: true,
        message: `فیلد(های) نامعتبر: ${unknown.join(", ")}`,
      });
    }

    const doc = await CurrencyCatalog.findById(id);
    if (!doc) {
      return res.status(404).json({ success: false, error: true, message: "یافت نشد" });
    }

    // If code changes, prevent change when used by products
    if (Object.prototype.hasOwnProperty.call(body, "code")) {
      const newCode =
        body.code === "" || body.code === null ? undefined : normalizeCode(body.code);

      if (newCode && newCode !== doc.code) {
        const used = await Product.countDocuments({ currency: doc.code });
        if (used > 0) {
          return res.status(409).json({
            success: false,
            error: true,
            message: "این واحد پول در محصولات استفاده شده و تغییر کد آن مجاز نیست",
          });
        }
        const exists = await CurrencyCatalog.findOne({ code: newCode });
        if (exists) {
          return res.status(409).json({
            success: false,
            error: true,
            message: "این کد واحد پول قبلاً ثبت شده است",
          });
        }
        doc.code = newCode;
      }
    }

    if (Object.prototype.hasOwnProperty.call(body, "nameFa")) {
      if (!body.nameFa || !String(body.nameFa).trim()) {
        return res.status(400).json({
          success: false,
          error: true,
          message: "نام فارسی واحد پول الزامی است",
        });
      }
      doc.nameFa = String(body.nameFa).trim();
    }

    if (Object.prototype.hasOwnProperty.call(body, "symbol")) {
      doc.symbol =
        body.symbol === undefined || body.symbol === null || body.symbol === ""
          ? undefined
          : String(body.symbol).trim();
    }

    if (Object.prototype.hasOwnProperty.call(body, "isActive")) {
      doc.isActive = !!body.isActive;
    }

    if (Object.prototype.hasOwnProperty.call(body, "sortOrder")) {
      doc.sortOrder = normalizeSortOrder(body.sortOrder) ?? 0;
    }

    await doc.save();
    return res.status(200).json({ success: true, error: false, data: doc });
  } catch (err) {
    return next(err);
  }
};

// PATCH /api/admin/currency-catalogs/:id/toggle
exports.toggleCurrencyCatalog = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: true, message: "شناسه نامعتبر است" });
    }
    const doc = await CurrencyCatalog.findById(id);
    if (!doc) {
      return res.status(404).json({ success: false, error: true, message: "یافت نشد" });
    }

    doc.isActive = !doc.isActive;
    await doc.save();

    return res.status(200).json({ success: true, error: false, data: doc });
  } catch (err) {
    return next(err);
  }
};

// DELETE /api/admin/currency-catalogs/:id
exports.deleteCurrencyCatalog = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: true, message: "شناسه نامعتبر است" });
    }
    const doc = await CurrencyCatalog.findById(id);
    if (!doc) {
      return res.status(404).json({ success: false, error: true, message: "یافت نشد" });
    }

    const used = await Product.countDocuments({ currency: doc.code });
    if (used > 0) {
      return res.status(409).json({
        success: false,
        error: true,
        message: "این واحد پول در محصولات استفاده شده و قابل حذف نیست",
      });
    }

    await CurrencyCatalog.deleteOne({ _id: doc._id });
    return res.status(200).json({ success: true, error: false, message: "حذف شد" });
  } catch (err) {
    return next(err);
  }
};
