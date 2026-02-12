const express = require("express");
const router = express.Router();

const authRouters = require("./Auth/authRouters");
const allUsers = require("./Admin-Panel/allUsers/allUsers");
const user = require("./Admin-Panel/allUsers/user");
const searchUsers = require("./Admin-Panel/allUsers/searchUsers");
const categoryRouters = require("./Admin-Panel/products/categoryRouters");
const productRouters = require("./Admin-Panel/products/productRouters");
const optionCatalogRouters = require("./Admin-Panel/products/optionCatalogRouters");
const mediaRouters = require("./Admin-Panel/media/mediaRouters");

//! Auth
router.use("", authRouters);

//! Panel Admin Routes
//? All-Users
router.use("/admin/all-users", allUsers);
router.use("/admin/user", user);
router.use("/admin/search-users", searchUsers);

//? Products
router.use("/admin/categories", categoryRouters);
router.use("/admin/products", productRouters);
router.use("/admin/option-catalogs", optionCatalogRouters);

//? Media (Parspack Cloud Space)
router.use("/admin/media", mediaRouters);

module.exports = router;
