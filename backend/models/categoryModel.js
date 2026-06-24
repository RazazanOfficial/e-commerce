//? 🔵 Required Modules
const mongoose = require("mongoose");

//* 🟢 Category Slug Pattern
const CATEGORY_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

//* 🟢 Category Model
const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    slug: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      lowercase: true,
      match: [
        CATEGORY_SLUG_PATTERN,
        "اسلاگ باید فقط شامل حروف انگلیسی کوچک، عدد و خط تیره بین کلمات باشد",
      ],
    },
    sortOrder: { type: Number, default: 0 },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
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

//? 🔵 Export Controller
module.exports = mongoose.model("Category", categorySchema);
