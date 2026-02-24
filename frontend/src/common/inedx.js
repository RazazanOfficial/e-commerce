// Backend base URL (configure in .env.local)
// Example: NEXT_PUBLIC_BACKEND_URL=http://localhost:9999
const backDomin = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:9999";

const backApis = {
  register: { url: `${backDomin}/api/register`, method: "POST" },
  login: { url: `${backDomin}/api/login`, method: "POST" },
  getUserInfo: { url: `${backDomin}/api/user-details`, method: "GET" },
  logOut: { url: `${backDomin}/api/logout`, method: "GET" },

  // !Panel Admin
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

  getAllCategories: {
    url: `${backDomin}/api/admin/categories`,
    method: "GET",
  },

  // ایجاد دسته‌بندی جدید
  createCategory: {
    url: `${backDomin}/api/admin/categories`,
    method: "POST",
  },

  // آپدیت دسته‌بندی بر اساس id
  updateCategory: (id) => ({
    url: `${backDomin}/api/admin/categories/${id}`,
    method: "PUT",
  }),

  // حذف دسته‌بندی بر اساس id
  deleteCategory: (id) => ({
    url: `${backDomin}/api/admin/categories/${id}`,
    method: "DELETE",
  }),

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

  // --- Product Config: OptionCatalog
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

  // --- Product Config: TagCatalog
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

  // --- Product Config: CurrencyCatalog
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

  // --- Media: Direct Upload (Presign -> PUT to ParsPack -> Commit)
  mediaPresign: {
    url: `${backDomin}/api/admin/media/presign`,
    method: "POST",
  },
  mediaCommit: {
    url: `${backDomin}/api/admin/media/commit`,
    method: "POST",
  },
};

export default backApis;
