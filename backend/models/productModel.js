const mongoose = require("mongoose");
const { Schema, Types } = mongoose;
const { ObjectId } = Types;

/* ========== Option Catalog (برای مدیریت آپشن‌های عمومی توسط ادمین) ========== */
const OptionCatalogSchema = new Schema(
    {
        name: { type: String, required: true, trim: true, unique: true },
        code: { type: String, required: true, trim: true, lowercase: true, unique: true },
        values: [{ type: String, trim: true }],
        isActive: { type: Boolean, default: true, index: true },
    },
    { timestamps: true }
);

/* ========== Sub-schemas ========== */
const AttributeSchema = new Schema(
    {
        key: { type: String, required: true, trim: true },
        value: { type: String, required: true, trim: true },
        pinToHero: { type: Boolean, default: false },
    },
    { _id: false }
);

const TechSpecItemSchema = new Schema(
    { k: { type: String, required: true, trim: true }, v: { type: String, required: true, trim: true } },
    { _id: false }
);
const TechSpecSectionSchema = new Schema(
    { title: { type: String, required: true, trim: true }, items: { type: [TechSpecItemSchema], default: [] } },
    { _id: false }
);

const MediaImageSchema = new Schema(
    {
        url: { type: String, required: true, trim: true },
        alt: { type: String, required: true, maxlength: 120, trim: true },
        isPrimary: { type: Boolean, default: false },
        variants: { thumb: String, md: String, lg: String },
    },
    { _id: false }
);

const MediaVideoSchema = new Schema(
    {
        url: { type: String, required: true, trim: true },
        poster: String,
        durationSec: Number,
        title: String,
        variants: { "360p": String, "720p": String },
    },
    { _id: false }
);

/* قیمت‌ها و اعداد صحیح */
const isIntOrUndef = v => v == null || Number.isInteger(v);

/* Variant */
const VariantSchema = new Schema(
    {
        variantKey: { type: String, required: true, index: true },
        optionValues: { type: Schema.Types.Mixed, default: {} },

        price: { type: Number, min: 0, validate: { validator: isIntOrUndef } },
        compareAt: {
            type: Number,
            min: 0,
            validate: [
                { validator: isIntOrUndef },
                {
                    validator: function (v) {
                        if (v == null || this.price == null) return true;
                        return v >= this.price;
                    },
                    message: "compareAt باید بزرگ‌تر یا مساوی price باشد",
                },
            ],
        },
        cost: { type: Number, min: 0, validate: { validator: isIntOrUndef } },

        inventory: {
            manage: { type: Boolean, default: true },
            qty: { type: Number, default: 0, min: 0, validate: { validator: isIntOrUndef } },
        },
        stockStatus: { type: String, enum: ["IN_STOCK", "OUT_OF_STOCK", "PREORDER"], default: "IN_STOCK" },

        images: [MediaImageSchema],
    },
    { _id: true, timestamps: false }
);

/* ========== Product ========== */
const ProductSchema = new Schema(
    {
        title: { type: String, required: true, maxlength: 120, trim: true },
        slug: { type: String, required: true, index: true, lowercase: true, trim: true },
        shortDescription: { type: String, required: true, maxlength: 160, trim: true },

        overviewHtml: { type: String, default: "" },

        categoryId: { type: ObjectId, ref: "Category", required: true, index: true },
        brandId: { type: ObjectId, ref: "Brand" },
        tags: [{ type: String, lowercase: true, trim: true }],

        status: { type: String, enum: ["DRAFT", "ACTIVE", "ARCHIVED"], default: "DRAFT", index: true },
        visible: { type: Boolean, default: true, index: true },

        price: { type: Number, required: true, min: 0, validate: { validator: Number.isInteger } }, // تومان به صورت عدد صحیح
        currency: { type: String, required: true, enum: ["IRT", "IRR", "USD"] },
        compareAt: {
            type: Number,
            min: 0,
            validate: [
                { validator: isIntOrUndef },
                {
                    validator: function (v) {
                        if (v == null) return true;
                        return v >= this.price;
                    },
                    message: "compareAt باید بزرگ‌تر یا مساوی price باشد",
                },
            ],
        },
        cost: { type: Number, min: 0, select: false, validate: { validator: isIntOrUndef } },

        inventory: {
            manage: { type: Boolean, default: true },
            qty: { type: Number, min: 0, default: 0, validate: { validator: isIntOrUndef } },
        },
        stockStatus: { type: String, enum: ["IN_STOCK", "OUT_OF_STOCK", "PREORDER"], default: "IN_STOCK" },
        lowStockThreshold: { type: Number, min: 0, validate: { validator: isIntOrUndef } },

        publishAt: { type: Date },
        allowBackorder: { type: Boolean, default: false },
        restockNotifyEnabled: { type: Boolean, default: true },

        hasVariants: { type: Boolean, default: false },
        options: [
            {
                name: { type: String, trim: true },
                values: [{ type: String, trim: true }],
            },
        ],
        variants: [VariantSchema],

        images: {
            type: [MediaImageSchema],
            validate: {
                validator(arr) {
                    if (!Array.isArray(arr) || arr.length === 0) return false;
                    return arr.filter(i => i && i.isPrimary === true).length === 1;
                },
                message: "باید دقیقاً یک تصویر اصلی داشته باشد",
            },
        },
        videos: [MediaVideoSchema],

        attributes: [AttributeSchema],
        techSpecs: { type: [TechSpecSectionSchema], default: [] },

        seo: {
            title: { type: String, maxlength: 60, trim: true },
            description: { type: String, maxlength: 160, trim: true },
            canonicalUrl: { type: String, trim: true },
        },

        shipping: {
            weight: { type: Number, min: 0 },
            dimensions: {
                length: { type: Number, min: 0 },
                width: { type: Number, min: 0 },
                height: { type: Number, min: 0 },
            },
        },

        warranty: { type: String },

        returnPolicy: {
            mode: { type: String, enum: ["TEMPLATE", "CUSTOM"], default: "TEMPLATE" },
            templateId: { type: ObjectId, ref: "ReturnPolicyTemplate" },
            body: { type: String },
        },
        handlingTime: {
            mode: { type: String, enum: ["TEMPLATE", "CUSTOM"], default: "TEMPLATE" },
            templateId: { type: ObjectId, ref: "HandlingTimeTemplate" },
            body: { type: String },
        },

        related: {
            manualIds: [{ type: ObjectId, ref: "Product" }],
            matchByTags: { type: Boolean, default: true },
            adminOnlySimilarTags: [{ type: String, lowercase: true, trim: true }],
        },

        breadcrumbsCache: [{ title: String, slug: String }],
    },
    { timestamps: true }
);

/* Hooks: مشتق‌سازی وضعیت و کنترل یکتایی واریانت‌ها */
ProductSchema.pre("validate", function (next) {
    const inv = this.inventory || {};
    const inStock = inv.manage === false || (Number.isInteger(inv.qty) ? inv.qty : 0) > 0;
    if (!this.allowBackorder) this.stockStatus = inStock ? "IN_STOCK" : "OUT_OF_STOCK";

    if (Array.isArray(this.variants) && this.variants.length) {
        const keys = this.variants.map(v => v && v.variantKey).filter(Boolean);
        if (new Set(keys).size !== keys.length) {
            this.invalidate("variants", "variantKey تکراری است");
        }
        if (!this.allowBackorder) {
            for (const v of this.variants) {
                if (!v) continue;
                const vinv = v.inventory || {};
                const vInStock = vinv.manage === false || (Number.isInteger(vinv.qty) ? vinv.qty : 0) > 0;
                v.stockStatus = vInStock ? "IN_STOCK" : "OUT_OF_STOCK";
            }
        }
    }

    next();
});

/* Indexes */
ProductSchema.index({ slug: 1 }, { unique: true, collation: { locale: "en", strength: 2 } });
ProductSchema.index({ status: 1, visible: 1, categoryId: 1 });
ProductSchema.index({ categoryId: 1, status: 1, visible: 1, price: 1 });
ProductSchema.index({ publishAt: 1, status: 1, visible: 1 });
ProductSchema.index({ tags: 1 });
ProductSchema.index(
    { title: "text", shortDescription: "text", "attributes.key": "text", "attributes.value": "text" },
    { weights: { title: 5, shortDescription: 3 } }
);

/* JSON shaping */
ProductSchema.set("toJSON", { virtuals: true, versionKey: false });
ProductSchema.set("toObject", { virtuals: true });

const OptionCatalog =
    mongoose.models.OptionCatalog || mongoose.model("OptionCatalog", OptionCatalogSchema);
const Product = mongoose.models.Product || mongoose.model("Product", ProductSchema);

module.exports = { Product, OptionCatalog };
