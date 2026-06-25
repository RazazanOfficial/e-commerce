//? 🔵 Backend URL
const backDomain = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:9999";

//* 🟢 API Registry
const backApis = {
  //? 🔵 Auth Endpoints
  register: { url: `${backDomain}/api/register`, method: "POST" },
  registerRequestCode: { url: `${backDomain}/api/register/request-code`, method: "POST" },
  registerVerifyCode: { url: `${backDomain}/api/register/verify-code`, method: "POST" },
  registerSetPassword: { url: `${backDomain}/api/register/set-password`, method: "POST" },
  login: { url: `${backDomain}/api/login`, method: "POST" },
  loginRequestCode: { url: `${backDomain}/api/login/request-code`, method: "POST" },
  loginVerifyCode: { url: `${backDomain}/api/login/verify-code`, method: "POST" },
  getUserInfo: { url: `${backDomain}/api/user-details`, method: "GET" },
  logOut: { url: `${backDomain}/api/logout`, method: "GET" },


  //? 🔵 Storefront Endpoints
  publicProducts: {
    url: `${backDomain}/api/products`,
    method: "GET",
  },
  publicProductBySlug: (slug) => ({
    url: `${backDomain}/api/products/${slug}`,
    method: "GET",
  }),


  //? 🔵 Admin User Endpoints
  allUsers: { url: `${backDomain}/api/admin/all-users`, method: "GET" },
  searchUsers: { url: `${backDomain}/api/admin/search-users`, method: "GET" },
  getSingleUser: (id) => ({
    url: `${backDomain}/api/admin/user/${id}`,
    method: "GET",
  }),
  updateUser: (id) => ({
    url: `${backDomain}/api/admin/user/${id}`,
    method: "PUT",
  }),
  deleteUser: (id) => ({
    url: `${backDomain}/api/admin/user/${id}`,
    method: "DELETE",
  }),

  //? 🔵 Category Endpoints
  getAllCategories: {
    url: `${backDomain}/api/admin/categories`,
    method: "GET",
  },

  getSingleCategory: (id) => ({
    url: `${backDomain}/api/admin/categories/${id}`,
    method: "GET",
  }),


  createCategory: {
    url: `${backDomain}/api/admin/categories`,
    method: "POST",
  },


  updateCategory: (id) => ({
    url: `${backDomain}/api/admin/categories/${id}`,
    method: "PUT",
  }),


  deleteCategory: (id) => ({
    url: `${backDomain}/api/admin/categories/${id}`,
    method: "DELETE",
  }),

  //? 🔵 Product Endpoints
  getAllProducts: {
    url: `${backDomain}/api/admin/products`,
    method: "GET",
  },
  searchProducts: {
    url: `${backDomain}/api/admin/products/search`,
    method: "GET",
  },
  getSingleProduct: (id) => ({
    url: `${backDomain}/api/admin/products/${id}`,
    method: "GET",
  }),
  createProduct: {
    url: `${backDomain}/api/admin/products`,
    method: "POST",
  },
  updateProduct: (id) => ({
    url: `${backDomain}/api/admin/products/${id}`,
    method: "PUT",
  }),
  archiveProduct: (id) => ({
    url: `${backDomain}/api/admin/products/${id}`,
    method: "DELETE",
  }),
  restoreProduct: (id) => ({
    url: `${backDomain}/api/admin/products/${id}/restore`,
    method: "PATCH",
  }),
  deleteProductHard: (id) => ({
    url: `${backDomain}/api/admin/products/${id}/hard`,
    method: "DELETE",
  }),


  //? 🔵 Option Catalog Endpoints
  getOptionCatalogs: {
    url: `${backDomain}/api/admin/option-catalogs`,
    method: "GET",
  },
  createOptionCatalog: {
    url: `${backDomain}/api/admin/option-catalogs`,
    method: "POST",
  },
  updateOptionCatalog: (id) => ({
    url: `${backDomain}/api/admin/option-catalogs/${id}`,
    method: "PUT",
  }),
  toggleOptionCatalog: (id) => ({
    url: `${backDomain}/api/admin/option-catalogs/${id}/toggle`,
    method: "PATCH",
  }),
  deleteOptionCatalog: (id) => ({
    url: `${backDomain}/api/admin/option-catalogs/${id}`,
    method: "DELETE",
  }),


  //? 🔵 Tag Catalog Endpoints
  getTagCatalogs: {
    url: `${backDomain}/api/admin/tag-catalogs`,
    method: "GET",
  },
  createTagCatalog: {
    url: `${backDomain}/api/admin/tag-catalogs`,
    method: "POST",
  },
  suggestTagCatalogs: {
    url: `${backDomain}/api/admin/tag-catalogs/suggest`,
    method: "GET",
  },
  updateTagCatalog: (id) => ({
    url: `${backDomain}/api/admin/tag-catalogs/${id}`,
    method: "PUT",
  }),
  toggleTagCatalog: (id) => ({
    url: `${backDomain}/api/admin/tag-catalogs/${id}/toggle`,
    method: "PATCH",
  }),
  deleteTagCatalog: (id) => ({
    url: `${backDomain}/api/admin/tag-catalogs/${id}`,
    method: "DELETE",
  }),


  //? 🔵 Currency Catalog Endpoints
  getCurrencyCatalogs: {
    url: `${backDomain}/api/admin/currency-catalogs`,
    method: "GET",
  },
  createCurrencyCatalog: {
    url: `${backDomain}/api/admin/currency-catalogs`,
    method: "POST",
  },
  updateCurrencyCatalog: (id) => ({
    url: `${backDomain}/api/admin/currency-catalogs/${id}`,
    method: "PUT",
  }),
  toggleCurrencyCatalog: (id) => ({
    url: `${backDomain}/api/admin/currency-catalogs/${id}/toggle`,
    method: "PATCH",
  }),
  deleteCurrencyCatalog: (id) => ({
    url: `${backDomain}/api/admin/currency-catalogs/${id}`,
    method: "DELETE",
  }),


  //? 🔵 Media Endpoints
  mediaPresign: {
    url: `${backDomain}/api/admin/media/presign`,
    method: "POST",
  },
  mediaCommit: {
    url: `${backDomain}/api/admin/media/commit`,
    method: "POST",
  },
};

//? 🔵 Export API Registry
export default backApis;
