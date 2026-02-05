const backDomin = "http://localhost:9999";

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
};

export default backApis;
