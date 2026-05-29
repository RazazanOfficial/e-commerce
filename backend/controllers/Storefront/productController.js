const mongoose = require("mongoose");
const { Product } = require("../../models/productModel");
const CategoryModel = require("../../models/categoryModel");
const { escapeRegex } = require("../../utils/userSecurity");
const { shapeProductForResponse } = require("../Admin-Panel/Products/product/productHelpers");

const buildPublicProductFilter = async (query = {}) => {
  const now = new Date();
  const and = [
    { status: "ACTIVE", visible: true },
    {
      $or: [
        { publishAt: { $exists: false } },
        { publishAt: null },
        { publishAt: { $lte: now } },
      ],
    },
  ];

  if (query.categoryId && mongoose.Types.ObjectId.isValid(query.categoryId)) {
    and.push({ categoryId: query.categoryId });
  }

  if (query.categorySlug && String(query.categorySlug).trim()) {
    const category = await CategoryModel.findOne({
      slug: String(query.categorySlug).trim().toLowerCase(),
      isActive: true,
    })
      .select("_id")
      .lean();
    and.push({ categoryId: category?._id || { $in: [] } });
  }

  if (query.q && String(query.q).trim()) {
    const q = String(query.q).trim();
    const regex = new RegExp(escapeRegex(q), "i");
    and.push({
      $or: [
        { title: regex },
        { shortDescription: regex },
        { slug: regex },
        { tags: regex },
        { "attributes.key": regex },
        { "attributes.value": regex },
      ],
    });
  }

  return { $and: and };
};

const getPublicProducts = async (req, res) => {
  try {
    let { page = 1, limit = 20, sort = "newest" } = req.query || {};
    page = Math.max(1, Number(page) || 1);
    limit = Math.max(1, Math.min(60, Number(limit) || 20));

    const filter = await buildPublicProductFilter(req.query);
    const sortMap = {
      newest: { publishAt: -1, createdAt: -1 },
      oldest: { createdAt: 1 },
      price_asc: { price: 1, createdAt: -1 },
      price_desc: { price: -1, createdAt: -1 },
    };
    const sortBy = sortMap[String(sort)] || sortMap.newest;

    const [items, total] = await Promise.all([
      Product.find(filter)
        .sort(sortBy)
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("categoryId", "name slug")
        .lean(),
      Product.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      error: false,
      data: {
        items: items.map(shapeProductForResponse),
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: true,
      message: "خطا در دریافت محصولات",
    });
  }
};

const getPublicProductBySlug = async (req, res) => {
  try {
    const slug = String(req.params.slug || "").trim().toLowerCase();
    if (!slug) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "اسلاگ محصول الزامی است",
      });
    }

    const product = await Product.findOne({
      slug,
      status: "ACTIVE",
      visible: true,
      $or: [
        { publishAt: { $exists: false } },
        { publishAt: null },
        { publishAt: { $lte: new Date() } },
      ],
    })
      .populate("categoryId", "name slug")
      .lean();

    if (!product) {
      return res.status(404).json({
        success: false,
        error: true,
        message: "محصول پیدا نشد",
      });
    }

    return res.status(200).json({
      success: true,
      error: false,
      data: shapeProductForResponse(product),
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: true,
      message: "خطا در دریافت محصول",
    });
  }
};

module.exports = {
  getPublicProducts,
  getPublicProductBySlug,
};
