const CategoryModel = require("../../../models/categoryModel");
const slugify = require("slugify");
const mongoose = require("mongoose");

const createCategory = async (req, res) => {
  try {
    let {
      name,
      slug,
      description,
      image,
      isActive,
      sortOrder,
      parent,
      metaTitle,
      metaDescription,
      keywords,
    } = req.body;

    slug = slug || slugify(name, { lower: true });

    if (parent && typeof parent === "string" && !mongoose.Types.ObjectId.isValid(parent)) {
      const parentCat = await CategoryModel.findOne({ name: parent });
      if (!parentCat) {
        return res.status(400).json({
          success: false,
          error: true,
          message: `دسته‌بندی با نام "${parent}" پیدا نشد`,
        });
      }
      parent = parentCat._id;
    }

    const category = new CategoryModel({
      name,
      slug,
      description,
      image,
      isActive,
      sortOrder,
      parent,
      metaTitle,
      metaDescription,
      keywords,
    });

    await category.save();

    res.json({
      data: category,
      success: true,
      error: false,
      message: "✅ دسته‌بندی با موفقیت ایجاد شد",
    });
  } catch (err) {
    console.log("❌ createCategory error:", err);
    res.status(500).json({
      success: false,
      error: true,
      message: "خطا در ایجاد دسته‌بندی",
    });
  }
};

const getAllCategories = async (req, res) => {
  try {
    const categories = await CategoryModel.find()
      .populate("parent")
      .sort({ sortOrder: 1 });

    res.json({
      data: categories,
      success: true,
      error: false,
      message: "✅ لیست دسته‌بندی‌ها با موفقیت دریافت شد",
    });
  } catch (err) {
    console.log("❌ getAllCategories error:", err);
    res.status(500).json({
      success: false,
      error: true,
      message: "خطا در گرفتن دسته‌بندی‌ها",
    });
  }
};

const updateCategory = async (req, res) => {
  try {
    let {
      name,
      slug,
      description,
      image,
      isActive,
      sortOrder,
      parent,
      metaTitle,
      metaDescription,
      keywords,
    } = req.body;

    const { id } = req.params;

    if (parent && parent === id) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "یک دسته نمی‌تواند والد خودش باشد",
      });
    }

    if (parent && typeof parent === "string" && !mongoose.Types.ObjectId.isValid(parent)) {
      const parentCat = await CategoryModel.findOne({ name: parent });
      if (!parentCat) {
        return res.status(400).json({
          success: false,
          error: true,
          message: `دسته‌بندی با نام "${parent}" پیدا نشد`,
        });
      }
      parent = parentCat._id;
    }

    const updatedCategory = await CategoryModel.findByIdAndUpdate(
      id,
      {
        name,
        slug: slug || slugify(name, { lower: true }),
        description,
        image,
        isActive,
        sortOrder,
        parent,
        metaTitle,
        metaDescription,
        keywords,
      },
      { new: true }
    );

    if (!updatedCategory) {
      return res.status(404).json({
        success: false,
        error: true,
        message: "دسته‌بندی مورد نظر پیدا نشد",
      });
    }

    res.json({
      data: updatedCategory,
      success: true,
      error: false,
      message: "✅ دسته‌بندی با موفقیت ویرایش شد",
    });
  } catch (err) {
    console.log("❌ updateCategory error:", err);
    res.status(500).json({
      success: false,
      error: true,
      message: "خطا در ویرایش دسته‌بندی",
    });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const hasChildren = await CategoryModel.findOne({ parent: id });
    if (hasChildren) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "نمی‌توان دسته‌ای را که زیر‌دسته دارد حذف کرد",
      });
    }

    const deletedCategory = await CategoryModel.findByIdAndDelete(id);

    if (!deletedCategory) {
      return res.status(404).json({
        success: false,
        error: true,
        message: "دسته‌بندی مورد نظر پیدا نشد",
      });
    }

    res.json({
      data: deletedCategory,
      success: true,
      error: false,
      message: "✅ دسته‌بندی با موفقیت حذف شد",
    });
  } catch (err) {
    console.log("❌ deleteCategory error:", err);
    res.status(500).json({
      success: false,
      error: true,
      message: "خطا در حذف دسته‌بندی",
    });
  }
};

module.exports = {
  createCategory,
  getAllCategories,
  updateCategory,
  deleteCategory,
};
