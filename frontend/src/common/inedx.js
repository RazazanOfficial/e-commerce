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
};

export default backApis;
