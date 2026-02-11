const mongoose = require("mongoose");

// Tag catalog: used for tag suggestions/autocomplete in admin panel.
// Product model still keeps `tags: [String]` for simplicity.

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
    },
  },
  { timestamps: true }
);

// Normalize: key derived from label if missing; spaces -> underscore
TagCatalogSchema.pre("validate", function (next) {
  if (!this.label) return next();
  this.label = String(this.label).trim();
  if (!this.key) {
    this.key = this.label.replace(/\s+/g, "_");
  }
  this.key = String(this.key).trim().replace(/\s+/g, "_");
  next();
});

module.exports = mongoose.model("TagCatalog", TagCatalogSchema);
