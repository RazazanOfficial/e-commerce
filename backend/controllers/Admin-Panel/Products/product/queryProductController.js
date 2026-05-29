//? 🔵 Required Modules
const mongoose = require("mongoose");
const { Product } = require("../../../../models/productModel");
const CategoryModel = require("../../../../models/categoryModel");
const { shapeProductForResponse } = require("./productHelpers");

//* 🟢 Get All Products Controller
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

//* 🟢 Search Products Controller
const searchProducts = async (req, res) => {
  try {
    let {
      q,
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


    const matchedCategories = await CategoryModel.find({
      $or: [{ name: regex }, { slug: regex }],
    })
      .select("_id")
      .lean();

    const categoryIds =
      matchedCategories && matchedCategories.length
        ? matchedCategories.map((c) => c._id)
        : [];


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


//? 🔵 Export Controllers
module.exports = { getAllProducts, getProductById, searchProducts };
