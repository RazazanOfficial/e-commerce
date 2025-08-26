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
  const [modalMode, setModalMode] = useState("view");

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

  const handleOpenModal = (user, mode) => {
    setSelectedUser(user);
    setModalMode(mode);
    setUserModalOpen(true);
  };

  const handleUpdateUser = async (updatedUser) => {
    try {
      const { url, method } = backApis.updateUser(updatedUser._id);
      await axios({
        method,
        url,
        data: updatedUser,
        withCredentials: true,
      });

      refreshData();
      setUserModalOpen(false);
    } catch (err) {
      console.error("خطا در آپدیت کاربر:", err);
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      const { url, method } = backApis.deleteUser(userId);
      await axios({ method, url, withCredentials: true });

      refreshData();
      setUserModalOpen(false);
    } catch (err) {
      console.error("خطا در حذف کاربر:", err);
    }
  };

  const getUserAvatarColor = (name) => {
    const colors = [
      "bg-indigo-800 text-indigo-200",
      "bg-purple-800 text-purple-200",
      "bg-blue-800 text-blue-200",
      "bg-pink-800 text-pink-200",
      "bg-yellow-800 text-yellow-200",
      "bg-red-800 text-red-200",
      "bg-slate-700 text-slate-200",
      "bg-green-800 text-green-200",
    ];
    const hash = name
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const getRoleBadgeVariant = (role) => {
    switch (role?.toLowerCase()) {
      case "admin":
        return "bg-red-900 text-red-200";
      case "seller":
        return "bg-purple-900 text-purple-200";
      default:
        return "bg-indigo-900 text-indigo-200";
    }
  };

  return (
    <div className="max-w-[100vw] py-12">
      {/* Page header */}
      <div className="mb-8 flex sm:flex-row flex-col items-center justify-between responsive-table mx-auto">
        <div className="flex flex-col justify-center gap-1 sm:items-stretch items-center">
          <h1 className="text-2xl md:text-3xl font-bold text-white sm:text-start text-center">
            لیست کاربران
          </h1>
          <p className="mt-2 text-gray-400 text-center">
            مدیریت و مشاهده تمامی کاربران سیستم
          </p>
        </div>
        <div className="sm:mr-0 mt-4 flex flex-col sm:flex-row gap-3 sm:items-stretch items-center">
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
              className="w-full pl-12 pr-4 py-2 bg-slate-800 rounded-lg border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button
              type="submit"
              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-md hover:bg-indigo-500/20 transition"
            >
              <Search className="h-5 w-5 text-gray-400" />
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
          onUserUpdate={() => refreshData()}
          onUserDelete={() => refreshData()}
        />
      )}

      {/* Users table */}
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-lg overflow-hidden mb-6 relative responsive-table mx-auto">
        {isLoading && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center z-10">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {/* Table header */}
        <div className="bg-gradient-to-l from-slate-800 to-indigo-900 text-white p-4 sm:p-6">
          <div className="flex flex-wrap justify-between items-center">
            <div>
              <h2 className="text-xl font-bold">اطلاعات کاربران</h2>
              <p className="text-gray-300 mt-1">
                لیست تمام کاربران ثبت شده در سیستم
              </p>
            </div>

            <div className="flex gap-4 mt-4 sm:mt-0">
              <div className="bg-slate-800 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-white">
                  {totalCount}
                </div>
                <div className="text-xs text-gray-300">کل کاربران</div>
              </div>
            </div>
          </div>
        </div>

        {/* Table body */}
        <div className="overflow-x-scroll top-0 bg-slate-900 z-10">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-slate-800 text-white">
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
                      key={user._id}
                      className="border-b border-slate-700 bg-slate-800/40 hover:bg-indigo-600/30 transition-colors"
                    >
                      <td className="py-4 px-2 flex flex-col lg:flex-row items-center gap-2">
                        <div
                          className={`w-10 h-10 rounded-full ${avatarColor} flex items-center justify-center font-bold text-sm`}
                        >
                          {user.name?.charAt(0) || "U"}
                        </div>
                        <span
                          className="text-gray-200 whitespace-nowrap truncate max-w-[150px] sm:max-w-[200px] md:max-w-[250px] lg:max-w-none"
                          title={user.name}
                        >
                          {user.name}
                        </span>
                      </td>
                      <td className="py-4 px-2 text-gray-300">{user.email}</td>
                      <td className="py-4 px-2 text-gray-300">
                        {user.phone || "-"}
                      </td>
                      <td className="py-4 px-2">
                        <span
                          className={`${getRoleBadgeVariant(
                            user.role
                          )} px-3 py-1 rounded-full text-xs font-medium`}
                        >
                          {user.role === "admin" ? "مدیر" : "کاربر"}
                        </span>
                      </td>
                      <td className="py-4 px-2">
                        <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                          <button
                            onClick={() => handleOpenModal(user, "view")}
                            className="p-2 sm:p-1.5 rounded-lg text-gray-400 hover:text-indigo-400 hover:bg-slate-700 transition-colors min-w-[36px] min-h-[36px]"
                          >
                            <Eye className="w-4 h-4 sm:h-5 sm:w-5" />
                          </button>
                          <button
                            onClick={() => handleOpenModal(user, "edit")}
                            className="p-2 sm:p-1.5 rounded-lg text-gray-400 hover:text-blue-400 hover:bg-slate-700 transition-colors min-w-[36px] min-h-[36px]"
                          >
                            <Edit className="w-4 h-4 sm:h-5 sm:w-5" />
                          </button>
                          <button
                            onClick={() => handleOpenModal(user, "delete")}
                            className="p-2 sm:p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-slate-700 transition-colors min-w-[36px] min-h-[36px]"
                          >
                            <Trash2 className="w-4 h-4 sm:h-5 sm:w-5" />
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

      {/* Pagination */}
      <div className="bg-slate-900 border border-slate-700 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between responsive-table mx-auto">
        <div className="text-gray-300 mb-4 sm:mb-0">
          نمایش{" "}
          <span className="font-medium text-white">{users?.length || 0}</span>{" "}
          از
          <span className="font-medium text-white mx-1">
            {users?.length || 0}
          </span>{" "}
          کاربر
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            disabled={page === 1}
            className="flex items-center justify-center h-10 w-10 rounded-lg bg-slate-800 text-gray-300 hover:bg-indigo-600 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

              if (pageNum > (totalPages || 1)) return null;

              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`h-10 w-10 rounded-lg font-medium transition-colors ${
                    page === pageNum
                      ? "bg-indigo-600 text-white"
                      : "hover:bg-slate-700 text-gray-300"
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
            className="flex items-center justify-center h-10 w-10 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
