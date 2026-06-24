//? 🔵 Backend URL
const backDomin = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:9999";

//* 🟢 API Registry
const backApis = {
  //? 🔵 Auth Endpoints
  register: { url: `${backDomin}/api/register`, method: "POST" },
  registerRequestCode: { url: `${backDomin}/api/register/request-code`, method: "POST" },
  registerVerifyCode: { url: `${backDomin}/api/register/verify-code`, method: "POST" },
  registerSetPassword: { url: `${backDomin}/api/register/set-password`, method: "POST" },
  login: { url: `${backDomin}/api/login`, method: "POST" },
  loginRequestCode: { url: `${backDomin}/api/login/request-code`, method: "POST" },
  loginVerifyCode: { url: `${backDomin}/api/login/verify-code`, method: "POST" },
  getUserInfo: { url: `${backDomin}/api/user-details`, method: "GET" },
  logOut: { url: `${backDomin}/api/logout`, method: "GET" },


  //? 🔵 Storefront Endpoints
  publicProducts: {
    url: `${backDomin}/api/products`,
    method: "GET",
  },
  publicProductBySlug: (slug) => ({
    url: `${backDomin}/api/products/${slug}`,
    method: "GET",
  }),


  //? 🔵 Admin User Endpoints
  allUsers: { url: `${backDomin}/api/admin/all-users`, method: "GET" },
  searchUsers: { url: `${backDomin}/api/admin/search-users`, method: "GET" },
  getSingleUser: (id) => ({
    url: `${backDomin}/api/admin/user/${id}`,
    method: "GET",
  }),
  updateUser: (id) => ({
    url: `${backDomin}/api/admin/user/${id}`,
    method: "PUT",
  }),
  deleteUser: (id) => ({
    url: `${backDomin}/api/admin/user/${id}`,
    method: "DELETE",
  }),

  //? 🔵 Category Endpoints
  getAllCategories: {
    url: `${backDomin}/api/admin/categories`,
    method: "GET",
  },


  createCategory: {
    url: `${backDomin}/api/admin/categories`,
    method: "POST",
  },


  updateCategory: (id) => ({
    url: `${backDomin}/api/admin/categories/${id}`,
    method: "PUT",
  }),


  deleteCategory: (id) => ({
    url: `${backDomin}/api/admin/categories/${id}`,
    method: "DELETE",
  }),

  //? 🔵 Product Endpoints
  getAllProducts: {
    url: `${backDomin}/api/admin/products`,
    method: "GET",
  },
  searchProducts: {
    url: `${backDomin}/api/admin/products/search`,
    method: "GET",
  },
  getSingleProduct: (id) => ({
    url: `${backDomin}/api/admin/products/${id}`,
    method: "GET",
  }),
  createProduct: {
    url: `${backDomin}/api/admin/products`,
    method: "POST",
  },
  updateProduct: (id) => ({
    url: `${backDomin}/api/admin/products/${id}`,
    method: "PUT",
  }),
  archiveProduct: (id) => ({
    url: `${backDomin}/api/admin/products/${id}`,
    method: "DELETE",
  }),
  restoreProduct: (id) => ({
    url: `${backDomin}/api/admin/products/${id}/restore`,
    method: "PATCH",
  }),
  deleteProductHard: (id) => ({
    url: `${backDomin}/api/admin/products/${id}/hard`,
    method: "DELETE",
  }),


  //? 🔵 Option Catalog Endpoints
  getOptionCatalogs: {
    url: `${backDomin}/api/admin/option-catalogs`,
    method: "GET",
  },
  createOptionCatalog: {
    url: `${backDomin}/api/admin/option-catalogs`,
    method: "POST",
  },
  updateOptionCatalog: (id) => ({
    url: `${backDomin}/api/admin/option-catalogs/${id}`,
    method: "PUT",
  }),
  toggleOptionCatalog: (id) => ({
    url: `${backDomin}/api/admin/option-catalogs/${id}/toggle`,
    method: "PATCH",
  }),
  deleteOptionCatalog: (id) => ({
    url: `${backDomin}/api/admin/option-catalogs/${id}`,
    method: "DELETE",
  }),


  //? 🔵 Tag Catalog Endpoints
  getTagCatalogs: {
    url: `${backDomin}/api/admin/tag-catalogs`,
    method: "GET",
  },
  createTagCatalog: {
    url: `${backDomin}/api/admin/tag-catalogs`,
    method: "POST",
  },
  suggestTagCatalogs: {
    url: `${backDomin}/api/admin/tag-catalogs/suggest`,
    method: "GET",
  },
  updateTagCatalog: (id) => ({
    url: `${backDomin}/api/admin/tag-catalogs/${id}`,
    method: "PUT",
  }),
  toggleTagCatalog: (id) => ({
    url: `${backDomin}/api/admin/tag-catalogs/${id}/toggle`,
    method: "PATCH",
  }),
  deleteTagCatalog: (id) => ({
    url: `${backDomin}/api/admin/tag-catalogs/${id}`,
    method: "DELETE",
  }),


  //? 🔵 Currency Catalog Endpoints
  getCurrencyCatalogs: {
    url: `${backDomin}/api/admin/currency-catalogs`,
    method: "GET",
  },
  createCurrencyCatalog: {
    url: `${backDomin}/api/admin/currency-catalogs`,
    method: "POST",
  },
  updateCurrencyCatalog: (id) => ({
    url: `${backDomin}/api/admin/currency-catalogs/${id}`,
    method: "PUT",
  }),
  toggleCurrencyCatalog: (id) => ({
    url: `${backDomin}/api/admin/currency-catalogs/${id}/toggle`,
    method: "PATCH",
  }),
  deleteCurrencyCatalog: (id) => ({
    url: `${backDomin}/api/admin/currency-catalogs/${id}`,
    method: "DELETE",
  }),


  //? 🔵 Media Endpoints
  mediaPresign: {
    url: `${backDomin}/api/admin/media/presign`,
    method: "POST",
  },
  mediaCommit: {
    url: `${backDomin}/api/admin/media/commit`,
    method: "POST",
  },
};

//? 🔵 Export API Registry
export default backApis;
