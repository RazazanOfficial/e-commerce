//? 🔵Required Modules
const CategoryModel = require("../../../models/categoryModel");
const slugify = require("slugify");
const mongoose = require("mongoose");

//* 🟢Create Category Controller
const createCategory = async (req, res) => {
  try {
    let {
      name,
      slug,
      description,
      image,
      imageAlt,
      isActive,
      sortOrder,
      parent,
      metaTitle,
      metaDescription,
      keywords,
    } = req.body;

    if (sortOrder !== undefined && typeof sortOrder !== "number") {
      return res.status(400).json({
        success: false,
        error: true,
        message: "sortOrder باید عدد باشد",
      });
    }

    if (sortOrder === undefined) {
      const maxOrder = await CategoryModel.findOne()
        .sort("-sortOrder")
        .select("sortOrder");
      sortOrder = (maxOrder?.sortOrder || 0) + 1;
    }

    slug = slug || slugify(name, { lower: true });
    metaTitle = metaTitle || name;
    metaDescription = metaDescription || description;
    imageAlt = imageAlt || name;
    if (
      parent &&
      typeof parent === "string" &&
      !mongoose.Types.ObjectId.isValid(parent)
    ) {
      const parentCat = await CategoryModel.findOne({ name: parent });
      if (!parentCat) {
        return res.status(400).json({
          success: false,
          error: true,
          message: `دسته‌بندی مورد نظر پیدا نشد`,
        });
      }
      parent = parentCat._id;
    }

    if (parent) {
      let currentParent = await CategoryModel.findById(parent).select("parent");
      while (currentParent) {
        if (currentParent._id.toString() === parent?.toString()) break;
        if (!currentParent.parent) break;
        currentParent = await CategoryModel.findById(
          currentParent.parent
        ).select("parent");
      }
    }

    const category = new CategoryModel({
      name,
      slug,
      description,
      image,
      imageAlt,
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
      message: ".دسته‌بندی با موفقیت ایجاد شد",
    });
  } catch (err) {
    //! 🔴Handle errors
    // console.log("createCategory error:", err);
    res.status(500).json({
      success: false,
      error: true,
      message: "خطا در ایجاد دسته‌بندی",
    });
  }
};

//* 🟢Get All Categories Controller
const getAllCategories = async (req, res) => {
  try {
    const categories = await CategoryModel.find()
      .populate("parent", "name slug")
      .sort({ sortOrder: 1 })
      .lean();

    res.json({
      data: categories,
      success: true,
      error: false,
      message: ".لیست دسته‌بندی‌ها با موفقیت دریافت شد",
    });
  } catch (err) {
    //! 🔴Handle errors
    // console.log("getAllCategories error:", err);
    res.status(500).json({
      success: false,
      error: true,
      message: "خطا در گرفتن دسته‌بندی‌ها",
    });
  }
};

//* 🟢Update Category Controller
const updateCategory = async (req, res) => {
  try {
    let {
      name,
      slug,
      description,
      image,
      imageAlt,
      isActive,
      sortOrder,
      parent,
      metaTitle,
      metaDescription,
      keywords,
    } = req.body;

    if (sortOrder !== undefined && typeof sortOrder !== "number") {
      return res.status(400).json({
        success: false,
        error: true,
        message: "sortOrder باید عدد باشد",
      });
    }

    if (sortOrder === undefined) {
      const maxOrder = await CategoryModel.findOne()
        .sort("-sortOrder")
        .select("sortOrder");
      sortOrder = (maxOrder?.sortOrder || 0) + 1;
    }

    const { id } = req.params;

    if (parent && parent === id) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "یک دسته نمی‌تواند والد خودش باشد",
      });
    }

    if (
      parent &&
      typeof parent === "string" &&
      !mongoose.Types.ObjectId.isValid(parent)
    ) {
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

    if (parent) {
      const parentDoc = await CategoryModel.findById(parent).select("parent");
      if (!parentDoc) {
        return res.status(400).json({
          success: false,
          error: true,
          message: "دسته‌بندی والد پیدا نشد",
        });
      }

      let currentParent = parentDoc;
      while (currentParent) {
        if (currentParent._id.toString() === id.toString()) {
          return res.status(400).json({
            success: false,
            error: true,
            message: "حلقه والد–فرزند مجاز نیست",
          });
        }
        if (!currentParent.parent) break;
        currentParent = await CategoryModel.findById(
          currentParent.parent
        ).select("parent");
      }
    }
    const updateData = {};

    if (name !== undefined) updateData.name = name;
    if (slug !== undefined)
      updateData.slug =
        slug || slugify(name || updateData.name, { lower: true });
    if (description !== undefined) updateData.description = description;
    if (image !== undefined) updateData.image = image;
    if (imageAlt !== undefined) updateData.imageAlt = imageAlt;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;
    if (parent !== undefined) updateData.parent = parent;
    if (metaTitle !== undefined) updateData.metaTitle = metaTitle;
    if (metaDescription !== undefined)
      updateData.metaDescription = metaDescription;
    if (keywords !== undefined) updateData.keywords = keywords;

    const updatedCategory = await CategoryModel.findByIdAndUpdate(
      id,
      updateData,
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
      message: ".دسته‌بندی با موفقیت ویرایش شد",
    });
  } catch (err) {
    //! 🔴Handle errors
    // console.log("updateCategory error:", err);
    res.status(500).json({
      success: false,
      error: true,
      message: "خطا در ویرایش دسته‌بندی",
    });
  }
};

//* 🟢Delete Category Controller
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
      message: ".دسته‌بندی با موفقیت حذف شد",
    });
  } catch (err) {
    //! 🔴Handle errors
    // console.log("deleteCategory error:", err);
    res.status(500).json({
      success: false,
      error: true,
      message: "خطا در حذف دسته‌بندی",
    });
  }
};

//? 🔵Export Controllers
module.exports = {
  createCategory,
  getAllCategories,
  updateCategory,
  deleteCategory,
};
