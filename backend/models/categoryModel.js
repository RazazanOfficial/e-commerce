//? 🔵Required Modules
const mongoose = require("mongoose");

//* 🟢Gategories Model
const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String },
    image: { type: String },
    imageAlt: { type: String },
    isActive: { type: Boolean, default: true, index: true },
    sortOrder: { type: Number, default: 0 },

    metaTitle: { type: String },
    metaDescription: { type: String },
    keywords: [{ type: String }],

    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
  },
  { timestamps: true }
);

//? 🔵Export Controller
module.exports = mongoose.model("Category", categorySchema);
