"use client";

import { useState } from "react";
import usePaginatedFetchHook from "@/hooks/usePaginatedFetchHook";
import backApis from "@/common/inedx";
import { Search, Eye, Edit, Trash2, ArrowLeft, ArrowRight } from "lucide-react";
import SearchModal from "@/components/Admin-Panel/SearchModal";
import axios from "axios";
import UserModal from "@/components/Admin-Panel/UserModal";

const AllUsersPage = () => {
  const {
    data: users,
    isLoading,
    page,
    setPage,
    totalPages,
    totalCount,
    refreshData,
  } = usePaginatedFetchHook(backApis.allUsers.url);

  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [selectedUser, setSelectedUser] = useState(null);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("view"); // "view" | "edit" | "delete"

  // Handle search input change
  const handleSearch = async () => {
    try {
      const { data } = await axios.get(
        `${backApis.searchUsers.url}?q=${searchTerm}`,
        { withCredentials: true }
      );
      setSearchResults(data.data);
      setIsModalOpen(true);
    } catch (error) {
      console.log("Search error:", error);
    }
  };

  // Handle read user modal
  const handleOpenModal = (user, mode) => {
    setSelectedUser(user);
    setModalMode(mode);
    setUserModalOpen(true);
  };

// Handle user modal update
const handleUpdateUser = async (updatedUser) => {
  try {
    const { url, method } = backApis.updateUser(updatedUser._id);
    const response = await axios({
      method,
      url,
      data: updatedUser,
      withCredentials: true,
    });

    console.log("✅ کاربر با موفقیت آپدیت شد", response.data);
    refreshData(); // 👈 رفرش دیتای کلی
    setUserModalOpen(false);
  } catch (err) {
    console.error("❌ خطا در آپدیت کاربر:", err);
  }
};

// Handle user modal delete
const handleDeleteUser = async (userId) => {
  try {
    const { url, method } = backApis.deleteUser(userId);
    const response = await axios({ method, url, withCredentials: true });

    console.log("✅ کاربر حذف شد", response.data);
    refreshData(); // 👈 رفرش دیتای کلی
    setUserModalOpen(false);
  } catch (err) {
    console.error("❌ خطا در حذف کاربر:", err);
  }
};

  // Generate colors for user avatars based on their names
  const getUserAvatarColor = (name) => {
    const colors = [
      "bg-primary-100 text-primary-700",
      "bg-purple-100 text-purple-700",
      "bg-blue-100 text-blue-700",
      "bg-pink-100 text-pink-700",
      "bg-yellow-100 text-yellow-700",
      "bg-red-100 text-red-700",
      "bg-indigo-100 text-indigo-700",
      "bg-green-100 text-green-700",
    ];

    // Simple hash function to get deterministic color
    const hash = name
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  // Get role badge variant
  const getRoleBadgeVariant = (role) => {
    switch (role?.toLowerCase()) {
      case "admin":
        return "bg-red-100 text-red-700";
      case "seller":
        return "bg-purple-100 text-purple-700";
      default:
        return "bg-blue-100 text-blue-700";
    }
  };

  return (
    <div>
      {/* Page header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-emerald-800">
            لیست کاربران
          </h1>
          <p className="mt-2 text-gray-600">
            مدیریت و مشاهده تمامی کاربران سیستم
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex flex-col sm:flex-row gap-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
            className="relative w-full max-w-xs"
          >
            <input
              type="text"
              placeholder="جستجوی کاربر..."
              className="w-full pl-12 pr-4 py-2 bg-white/20 backdrop-blur-md rounded-lg border border-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button
              type="submit"
              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-md hover:bg-emerald-100 transition"
            >
              <Search className="h-5 w-5 text-gray-500" />
            </button>
          </form>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <SearchModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          users={searchResults}
          getUserAvatarColor={getUserAvatarColor}
          getRoleBadgeVariant={getRoleBadgeVariant}
          onUserUpdate={() => refreshData()} // 👈 رفرش کن
          onUserDelete={() => refreshData()} // 👈 رفرش کن
        />
      )}

      {/* Users table container */}
      <div className="bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl shadow-xl overflow-hidden transition-all duration-300 mb-6 relative">
        {isLoading && (
          <div className="absolute inset-0 bg-white/30 backdrop-blur-[5px] flex items-center justify-center z-10">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-t-emerald-500 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
              <div
                className="absolute inset-2 rounded-full border-4 border-t-transparent border-r-emerald-500 border-b-transparent border-l-transparent animate-spin"
                style={{
                  animationDirection: "reverse",
                  animationDuration: "1s",
                }}
              ></div>
              <div className="absolute inset-5 bg-emerald-500 rounded-full animate-pulse"></div>
            </div>
          </div>
        )}

        {/* Table header with stats */}
        <div className="bg-gradient-to-l from-emerald-600 to-emerald-700 text-white p-4 sm:p-6">
          <div className="flex flex-wrap justify-between items-center">
            <div>
              <h2 className="text-xl font-bold">اطلاعات کاربران</h2>
              <p className="text-emerald-100 mt-1">
                لیست تمام کاربران ثبت شده در سیستم
              </p>
            </div>

            <div className="flex gap-4 mt-4 sm:mt-0">
              <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                <div className="text-2xl font-bold">{totalCount}</div>
                <div className="text-xs text-emerald-100">کل کاربران</div>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-emerald-900 text-white">
                <th className="py-4 px-6 font-medium">نام</th>
                <th className="py-4 px-6 font-medium">ایمیل</th>
                <th className="py-4 px-6 font-medium">شماره تلفن</th>
                <th className="py-4 px-6 font-medium">نقش</th>
                <th className="py-4 px-6 font-medium">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {users &&
                users.map((user) => {
                  const avatarColor = getUserAvatarColor(user.name || "کاربر");

                  return (
                    <tr
                      key={user._id || Math.random()}
                      className="border-b border-gray-100 bg-emerald-500/30 hover:bg-emerald-600/50 hover:cursor-pointer transition-all duration-75 transform"
                    >
                      <td className="py-4 px-6 flex items-center">
                        <div
                          className={`w-10 h-10 rounded-full ${avatarColor} flex items-center justify-center font-bold text-sm ml-3`}
                        >
                          {user.name?.charAt(0) || "U"}
                        </div>
                        <span>{user.name}</span>
                      </td>
                      <td className="py-4 px-6">{user.email}</td>
                      <td className="py-4 px-6">{user.phone || "-"}</td>
                      <td className="py-4 px-6">
                        <span
                          className={`${getRoleBadgeVariant(
                            user.role
                          )} px-3 py-1 rounded-full text-xs font-medium`}
                        >
                          {user.role === "admin" ? "مدیر" : "کاربر"}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex space-x-2 space-x-reverse">
                          <button
                            onClick={() => handleOpenModal(user, "view")}
                            className="p-1.5 rounded-lg text-gray-700 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                          >
                            <Eye className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleOpenModal(user, "edit")}
                            className="p-1.5 rounded-lg text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          >
                            <Edit className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleOpenModal(user, "delete")}
                            className="p-1.5 rounded-lg text-gray-700 hover:text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination section */}
      <div className="bg-white/20 backdrop-blur-md border border-white/30 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between">
        <div className="text-gray-600 mb-4 sm:mb-0">
          نمایش{" "}
          <span className="font-medium text-emerald-700">
            {users?.length || 0}
          </span>{" "}
          از
          <span className="font-medium text-emerald-700 mx-1">
            {users?.length || 0}
          </span>{" "}
          کاربر
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            disabled={page === 1}
            className="flex items-center justify-center h-10 w-10 rounded-lg bg-emerald-700/15 backdrop-blur-xl text-emerald-900 hover:bg-emerald-600 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowRight className="h-5 w-5" />
          </button>

          <div className="flex gap-1">
            {[...Array(Math.min(5, totalPages || 1))].map((_, idx) => {
              const pageNum =
                page <= 3
                  ? idx + 1
                  : page >= (totalPages || 1) - 2
                  ? (totalPages || 1) - 4 + idx
                  : page - 2 + idx;

              // Ensure we don't render page numbers beyond total pages
              if (pageNum > (totalPages || 1)) return null;

              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`h-10 w-10 rounded-lg font-medium transition-colors ${
                    page === pageNum
                      ? "bg-emerald-700/15 backdrop-blur-xl text-emerald-900"
                      : "hover:bg-emerald-50 text-gray-600"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            onClick={() =>
              setPage((prev) => Math.min(prev + 1, totalPages || 1))
            }
            disabled={page === (totalPages || 1)}
            className="flex items-center justify-center h-10 w-10 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        </div>
      </div>
      <UserModal
        isOpen={userModalOpen}
        onClose={() => setUserModalOpen(false)}
        mode={modalMode}
        user={selectedUser}
        onUpdate={handleUpdateUser}
        onDelete={handleDeleteUser}
      />
    </div>
  );
};

export default AllUsersPage;
