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
    // Friendly in both light/dark.
    const colors = [
      "bg-indigo-50 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200",
      "bg-purple-50 text-purple-700 dark:bg-purple-900 dark:text-purple-200",
      "bg-sky-50 text-sky-700 dark:bg-sky-900 dark:text-sky-200",
      "bg-pink-50 text-pink-700 dark:bg-pink-900 dark:text-pink-200",
      "bg-amber-50 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
      "bg-rose-50 text-rose-700 dark:bg-rose-900 dark:text-rose-200",
      "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200",
    ];
    const hash = name
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const getRoleBadgeVariant = (role) => {
    switch (role?.toLowerCase()) {
      case "admin":
        return "bg-[var(--adm-error-soft)] text-[var(--adm-error)]";
      case "seller":
        return "bg-[var(--adm-info-soft)] text-[var(--adm-info)]";
      default:
        return "bg-[var(--adm-primary-soft)] text-[var(--adm-primary)]";
    }
  };

  return (
    <div className="max-w-[100vw] py-12">
      {/* Page header */}
      <div className="mb-8 flex sm:flex-row flex-col items-center justify-between responsive-table mx-auto">
        <div className="flex flex-col justify-center gap-1 sm:items-stretch items-center">
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--adm-text)] sm:text-start text-center">
            لیست کاربران
          </h1>
          <p className="mt-2 text-[var(--adm-text-muted)] text-center">
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
              className="w-full pl-12 pr-4 py-2 rounded-xl border focus:outline-none focus:ring-2"
              style={{
                background: "var(--adm-surface)",
                borderColor: "var(--adm-border)",
                color: "var(--adm-text)",
                boxShadow: "none",
              }}
              onFocus={(e) => (e.currentTarget.style.boxShadow = "0 0 0 3px var(--adm-ring)")}
              onBlur={(e) => (e.currentTarget.style.boxShadow = "none")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button
              type="submit"
              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition"
              style={{ color: "var(--adm-text-muted)" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--adm-primary-soft)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <Search className="h-5 w-5" />
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
      <div
        className="rounded-2xl shadow-lg overflow-hidden mb-6 relative responsive-table mx-auto"
        style={{
          background: "var(--adm-surface)",
          border: "1px solid var(--adm-border)",
          boxShadow: "0 20px 60px var(--adm-shadow)",
        }}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center z-10" style={{ background: "var(--adm-overlay)" }}>
            <div
              className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: "var(--adm-primary)", borderTopColor: "transparent" }}
            ></div>
          </div>
        )}

        {/* Table header */}
        <div
          className="p-4 sm:p-6"
          style={{
            background: "var(--adm-surface-2)",
            borderBottom: "1px solid var(--adm-border)",
          }}
        >
          <div className="flex flex-wrap justify-between items-center">
            <div>
              <h2 className="text-xl font-bold" style={{ color: "var(--adm-text)" }}>اطلاعات کاربران</h2>
              <p className="mt-1" style={{ color: "var(--adm-text-muted)" }}>
                لیست تمام کاربران ثبت شده در سیستم
              </p>
            </div>

            <div className="flex gap-4 mt-4 sm:mt-0">
              <div className="rounded-xl p-3 text-center" style={{ background: "var(--adm-surface)" }}>
                <div className="text-2xl font-bold" style={{ color: "var(--adm-text)" }}>
                  {totalCount}
                </div>
                <div className="text-xs" style={{ color: "var(--adm-text-muted)" }}>کل کاربران</div>
              </div>
            </div>
          </div>
        </div>

        {/* Table body */}
        <div className="overflow-x-scroll top-0 z-10">
          <table className="w-full text-right">
            <thead>
              <tr style={{ background: "var(--adm-surface-2)", color: "var(--adm-text)" }}>
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
                      className="transition-colors"
                      style={{ borderBottom: "1px solid var(--adm-border)", background: "var(--adm-surface)" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--adm-primary-soft)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "var(--adm-surface)")}
                    >
                      <td className="py-4 px-2 flex flex-col lg:flex-row items-center gap-2">
                        <div
                          className={`w-10 h-10 rounded-full ${avatarColor} flex items-center justify-center font-bold text-sm`}
                        >
                          {user.name?.charAt(0) || "U"}
                        </div>
                        <span
                          className="whitespace-nowrap truncate max-w-[150px] sm:max-w-[200px] md:max-w-[250px] lg:max-w-none"
                          style={{ color: "var(--adm-text)" }}
                          title={user.name}
                        >
                          {user.name}
                        </span>
                      </td>
                      <td className="py-4 px-2" style={{ color: "var(--adm-text-muted)" }}>{user.email}</td>
                      <td className="py-4 px-2" style={{ color: "var(--adm-text-muted)" }}>
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
                            className="p-2 sm:p-1.5 rounded-lg transition-colors min-w-[36px] min-h-[36px]"
                            style={{ color: "var(--adm-text-muted)" }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = "var(--adm-success-soft)";
                              e.currentTarget.style.color = "var(--adm-success)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = "transparent";
                              e.currentTarget.style.color = "var(--adm-text-muted)";
                            }}
                          >
                            <Eye className="w-4 h-4 sm:h-5 sm:w-5" />
                          </button>
                          <button
                            onClick={() => handleOpenModal(user, "edit")}
                            className="p-2 sm:p-1.5 rounded-lg transition-colors min-w-[36px] min-h-[36px]"
                            style={{ color: "var(--adm-text-muted)" }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = "var(--adm-primary-soft)";
                              e.currentTarget.style.color = "var(--adm-primary)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = "transparent";
                              e.currentTarget.style.color = "var(--adm-text-muted)";
                            }}
                          >
                            <Edit className="w-4 h-4 sm:h-5 sm:w-5" />
                          </button>
                          <button
                            onClick={() => handleOpenModal(user, "delete")}
                            className="p-2 sm:p-1.5 rounded-lg transition-colors min-w-[36px] min-h-[36px]"
                            style={{ color: "var(--adm-text-muted)" }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = "var(--adm-error-soft)";
                              e.currentTarget.style.color = "var(--adm-error)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = "transparent";
                              e.currentTarget.style.color = "var(--adm-text-muted)";
                            }}
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
      <div
        className="p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between responsive-table mx-auto"
        style={{ background: "var(--adm-surface)", border: "1px solid var(--adm-border)" }}
      >
        <div className="mb-4 sm:mb-0" style={{ color: "var(--adm-text-muted)" }}>
          نمایش{" "}
          <span className="font-medium" style={{ color: "var(--adm-text)" }}>{users?.length || 0}</span>{" "}
          از
          <span className="font-medium mx-1" style={{ color: "var(--adm-text)" }}>
            {users?.length || 0}
          </span>{" "}
          کاربر
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            disabled={page === 1}
            className="flex items-center justify-center h-10 w-10 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: "var(--adm-surface-2)",
              color: "var(--adm-text)",
              border: "1px solid var(--adm-border)",
            }}
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
                  className="h-10 w-10 rounded-xl font-medium transition-colors"
                  style={
                    page === pageNum
                      ? { background: "var(--adm-primary)", color: "var(--adm-on-primary)" }
                      : { background: "transparent", color: "var(--adm-text-muted)" }
                  }
                  onMouseEnter={(e) => {
                    if (page === pageNum) return;
                    e.currentTarget.style.background = "var(--adm-surface-2)";
                    e.currentTarget.style.color = "var(--adm-text)";
                  }}
                  onMouseLeave={(e) => {
                    if (page === pageNum) return;
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "var(--adm-text-muted)";
                  }}
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
            className="flex items-center justify-center h-10 w-10 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: "var(--adm-primary)", color: "var(--adm-on-primary)" }}
            onMouseEnter={(e) => {
              if (page === (totalPages || 1)) return;
              e.currentTarget.style.background = "var(--adm-primary-hover)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--adm-primary)";
            }}
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
