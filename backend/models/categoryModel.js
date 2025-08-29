// models/categoryModel.js
const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true }, // اگر خواستی بعداً یکتایی name برداشته بشه، بگو
    slug: { type: String, required: true, unique: true, index: true },
    sortOrder: { type: Number, default: 0 },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
      // 👇 طبق خواسته‌ی تو: هیچ ایندکسی نذاریم تا دردسر نداشته باشیم
      // index: false (پیش‌فرض)
    },
    isActive: { type: Boolean, default: true, index: true },

    description: { type: String },
    metaTitle: { type: String },
    metaDescription: { type: String },
    keywords: [{ type: String }],

    image: { type: String },
    imageAlt: { type: String },
  },
  { timestamps: true }
);

// 👇 هیچ ایندکس مرکبی روی parent/sortOrder تعریف نمی‌کنیم.
module.exports = mongoose.model("Category", categorySchema);
