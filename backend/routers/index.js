const express = require("express");
const router = express.Router();

const authRouters = require("./Auth/authRouters");
const allUsers = require("./Admin-Panel/allUsers/allUsers");
const user = require("./Admin-Panel/allUsers/user");
const searchUsers = require("./Admin-Panel/allUsers/searchUsers");
const categoryRouters = require("./Admin-Panel/products/categoryRouters");

//! Auth
router.use("", authRouters);

//! Panel Admin Routes
//! All-Users
router.use("/admin/all-users", allUsers);
router.use("/admin/user", user);
router.use("/admin/search-users", searchUsers);
//! Products
router.use("/admin/categories", categoryRouters);

module.exports = router;
