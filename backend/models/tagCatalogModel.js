const mongoose = require("mongoose");

/**
 * Tag catalog: used for tag suggestions/autocomplete in admin panel.
 * Products store tags as array of strings (keys).
 */

const TagCatalogSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: true,
      trim: true,
      maxlength: 64,
    },
    key: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      maxlength: 64,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

// Normalize key/label safely (sync middleware; no `next()` usage to avoid runtime mismatch)
TagCatalogSchema.pre("validate", function () {
  if (!this.label) return;

  this.label = String(this.label).trim();

  if (!this.key) {
    this.key = this.label;
  }

  // normalize key: lowercase, whitespace/_ -> -, allow [a-z0-9-]
  this.key = String(this.key)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/_+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
});

module.exports = mongoose.model("TagCatalog", TagCatalogSchema);
