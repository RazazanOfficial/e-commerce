const mongoose = require("mongoose");
const { Schema } = mongoose;

const CurrencyCatalogSchema = new Schema(
  {
    nameFa: { type: String, required: true, trim: true, maxlength: 40 },
    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      maxlength: 10,
      unique: true,
      index: true,
    },
    symbol: { type: String, trim: true, maxlength: 10 },
    isActive: { type: Boolean, default: true, index: true },
    sortOrder: { type: Number, default: 0, index: true },
  },
  { timestamps: true }
);

CurrencyCatalogSchema.set("toJSON", { virtuals: true, versionKey: false });
CurrencyCatalogSchema.set("toObject", { virtuals: true });

const CurrencyCatalog =
  mongoose.models.CurrencyCatalog ||
  mongoose.model("CurrencyCatalog", CurrencyCatalogSchema);

module.exports = CurrencyCatalog;
