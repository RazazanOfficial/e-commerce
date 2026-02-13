const mongoose = require("mongoose");
const { Schema } = mongoose;

/**
 * MediaAsset
 * Stores uploaded media metadata (key-based).
 * key is the object key inside the ParsPack bucket.
 */
const MediaAssetSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, trim: true, index: true },
    mimeType: { type: String, required: true, trim: true },
    size: { type: Number, min: 0 },
    originalName: { type: String, trim: true },
    kind: {
      type: String,
      enum: ["image", "video", "gif", "embed", "other"],
      default: "other",
      index: true,
    },
    uploadedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

MediaAssetSchema.set("toJSON", { virtuals: true, versionKey: false });
MediaAssetSchema.set("toObject", { virtuals: true });

const MediaAsset =
  mongoose.models.MediaAsset || mongoose.model("MediaAsset", MediaAssetSchema);

module.exports = MediaAsset;
