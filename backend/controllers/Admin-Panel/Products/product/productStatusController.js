//? 🔵 Required Modules
const mongoose = require("mongoose");
const { Product } = require("../../../../models/productModel");

//* 🟢 Archive Product Controller
const archiveProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "شناسه محصول نامعتبر است",
      });
    }

    const prod = await Product.findById(id);
    if (!prod) {
      return res.status(404).json({
        success: false,
        error: true,
        message: "محصول یافت نشد",
      });
    }

    prod.status = "ARCHIVED";
    prod.visible = false;

    await prod.save();

    return res.status(200).json({
      success: true,
      error: false,
      message: "محصول به آرشیو منتقل شد",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: true,
      message: "خطا در آرشیو محصول",
    });
  }
};


//* 🟢 Hard Delete Product Controller
const deleteProductPermanently = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "شناسه محصول نامعتبر است",
      });
    }

    const prod = await Product.findById(id).select("_id");
    if (!prod) {
      return res.status(404).json({
        success: false,
        error: true,
        message: "محصول یافت نشد",
      });
    }

    await Product.deleteOne({ _id: prod._id });

    return res.status(200).json({
      success: true,
      error: false,
      message: "محصول برای همیشه حذف شد",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: true,
      message: "خطا در حذف دائمی محصول",
    });
  }
};

//* 🟢 Restore Product Controller
const restoreProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "شناسه محصول نامعتبر است",
      });
    }

    const prod = await Product.findById(id);
    if (!prod) {
      return res.status(404).json({
        success: false,
        error: true,
        message: "محصول یافت نشد",
      });
    }


    if (prod.status !== "ARCHIVED") {
      return res.status(400).json({
        success: false,
        error: true,
        message: "این محصول در آرشیو نیست",
      });
    }


    prod.status = "DRAFT";
    prod.visible = false;

    await prod.save();

    return res.status(200).json({
      success: true,
      error: false,
      message: "محصول از آرشیو خارج شد",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: true,
      message: "خطا در خارج کردن محصول از آرشیو",
    });
  }
};

//? 🔵 Export Controllers
module.exports = { archiveProduct, deleteProductPermanently, restoreProduct };
