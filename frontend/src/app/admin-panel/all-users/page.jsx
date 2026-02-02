"use client";

import { useMemo, useState } from "react";
import usePaginatedFetchHook from "@/hooks/usePaginatedFetchHook";
import backApis from "@/common/inedx";
import { Search, Eye, Edit, Trash2, ArrowLeft, ArrowRight } from "lucide-react";
import SearchModal from "@/components/Admin-Panel/SearchModal";
import axios from "axios";
import UserModal from "@/components/Admin-Panel/UserModal";
import {
  AdminBadge,
  AdminCard,
  AdminCardContent,
  AdminCardDescription,
  AdminCardHeader,
  AdminCardTitle,
  AdminIconButton,
  AdminInput,
} from "@/components/admin-ui";

export default function AllUsersPage() {
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
    const styles = [
      { bg: "var(--adm-primary-soft)", fg: "var(--adm-primary)" },
      { bg: "var(--adm-info-soft)", fg: "var(--adm-info)" },
      { bg: "var(--adm-success-soft)", fg: "var(--adm-success)" },
      { bg: "var(--adm-warning-soft)", fg: "var(--adm-warning)" },
      { bg: "var(--adm-error-soft)", fg: "var(--adm-error)" },
      { bg: "var(--adm-surface-2)", fg: "var(--adm-text)" },
    ];

    const hash = (name || "")
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);

    return styles[hash % styles.length];
  };

  const roleLabel = (role) => {
    const r = (role || "").toLowerCase();
    if (r === "admin") return "مدیر";
    if (r === "seller") return "فروشنده";
    return "کاربر";
  };

  const roleVariant = (role) => {
    const r = (role || "").toLowerCase();
    if (r === "admin") return "error";
    if (r === "seller") return "info";
    return "primary";
  };

  const paginationPages = useMemo(() => {
    const tp = totalPages || 1;
    const cap = Math.min(5, tp);
    return Array.from({ length: cap }).map((_, idx) => {
      const pageNum =
        page <= 3
          ? idx + 1
          : page >= tp - 2
          ? tp - 4 + idx
          : page - 2 + idx;
      return pageNum;
    });
  }, [page, totalPages]);

  return (
    <div className="max-w-[100vw] py-12">
      {/* Header */}
      <div className="mb-8 flex sm:flex-row flex-col items-center justify-between responsive-table mx-auto">
        <div className="flex flex-col justify-center gap-1 sm:items-stretch items-center">
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--adm-text)] sm:text-start text-center">
            لیست کاربران
          </h1>
          <p className="mt-2 text-[var(--adm-text-muted)] text-center">
            مدیریت و مشاهده تمامی کاربران سیستم
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
          className="relative w-full max-w-xs mt-4 sm:mt-0"
        >
          <AdminInput
            type="text"
            placeholder="جستجوی کاربر..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-11"
          />
          <button
            type="submit"
            className="absolute left-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-xl text-[var(--adm-text-muted)] hover:bg-[var(--adm-primary-soft)] hover:text-[var(--adm-primary)] transition"
            aria-label="جستجو"
            title="جستجو"
          >
            <Search className="h-5 w-5 mx-auto" />
          </button>
        </form>
      </div>

      {isModalOpen && (
        <SearchModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          users={searchResults}
          getUserAvatarColor={getUserAvatarColor}
          getRoleBadgeVariant={null}
          onUserUpdate={() => refreshData()}
          onUserDelete={() => refreshData()}
        />
      )}

      <AdminCard elevated className="relative responsive-table mx-auto">
        {isLoading ? (
          <div
            className="absolute inset-0 z-10 flex items-center justify-center"
            style={{ background: "var(--adm-overlay)" }}
          >
            <div
              className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin"
              style={{
                borderColor: "var(--adm-primary)",
                borderTopColor: "transparent",
              }}
              aria-label="loading"
            />
          </div>
        ) : null}

        <AdminCardHeader>
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div>
              <AdminCardTitle>اطلاعات کاربران</AdminCardTitle>
              <AdminCardDescription>
                لیست تمام کاربران ثبت شده در سیستم
              </AdminCardDescription>
            </div>

            <div className="rounded-xl p-3 text-center bg-[var(--adm-surface)] border border-[color:var(--adm-border)]">
              <div className="text-2xl font-bold text-[var(--adm-text)]">
                {totalCount}
              </div>
              <div className="text-xs text-[var(--adm-text-muted)]">کل کاربران</div>
            </div>
          </div>
        </AdminCardHeader>

        <AdminCardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-[var(--adm-surface-2)] text-[var(--adm-text)]">
                <tr>
                  <th className="py-4 px-4 font-semibold">نام</th>
                  <th className="py-4 px-4 font-semibold">ایمیل</th>
                  <th className="py-4 px-4 font-semibold">شماره تلفن</th>
                  <th className="py-4 px-4 font-semibold">نقش</th>
                  <th className="py-4 px-4 font-semibold">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {users?.map((user) => {
                  const a = getUserAvatarColor(user.name || "کاربر");
                  return (
                    <tr
                      key={user._id}
                      className="border-b border-[color:var(--adm-border)] bg-[var(--adm-surface)] hover:bg-[var(--adm-primary-soft)] transition-colors"
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
                            style={{ background: a.bg, color: a.fg }}
                          >
                            {user.name?.charAt(0) || "U"}
                          </div>
                          <span
                            className="whitespace-nowrap truncate max-w-[180px]"
                            title={user.name}
                          >
                            {user.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-[var(--adm-text-muted)]">{user.email}</td>
                      <td className="py-4 px-4 text-[var(--adm-text-muted)]">{user.phone || "-"}</td>
                      <td className="py-4 px-4">
                        <AdminBadge variant={roleVariant(user.role)}>{roleLabel(user.role)}</AdminBadge>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex gap-1 justify-center sm:justify-start">
                          <AdminIconButton
                            intent="success"
                            label="مشاهده"
                            onClick={() => handleOpenModal(user, "view")}
                          >
                            <Eye className="h-5 w-5" />
                          </AdminIconButton>
                          <AdminIconButton
                            intent="primary"
                            label="ویرایش"
                            onClick={() => handleOpenModal(user, "edit")}
                          >
                            <Edit className="h-5 w-5" />
                          </AdminIconButton>
                          <AdminIconButton
                            intent="danger"
                            label="حذف"
                            onClick={() => handleOpenModal(user, "delete")}
                          >
                            <Trash2 className="h-5 w-5" />
                          </AdminIconButton>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </AdminCardContent>
      </AdminCard>

      {/* Pagination */}
      <AdminCard className="mt-6 responsive-table mx-auto">
        <AdminCardContent className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-[var(--adm-text-muted)]">
            نمایش <span className="font-bold text-[var(--adm-text)]">{users?.length || 0}</span> از{" "}
            <span className="font-bold text-[var(--adm-text)]">{users?.length || 0}</span> کاربر
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={page === 1}
              className="h-10 w-10 rounded-xl border border-[color:var(--adm-border)] bg-[var(--adm-surface-2)] text-[var(--adm-text)] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--adm-surface)] transition"
              aria-label="صفحه قبل"
            >
              <ArrowRight className="h-5 w-5 mx-auto" />
            </button>

            <div className="flex gap-1">
              {paginationPages.map((pageNum) => {
                if (pageNum < 1 || pageNum > (totalPages || 1)) return null;
                const active = page === pageNum;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={
                      active
                        ? "h-10 w-10 rounded-xl font-semibold bg-[var(--adm-primary)] text-[var(--adm-on-primary)]"
                        : "h-10 w-10 rounded-xl font-semibold text-[var(--adm-text-muted)] hover:bg-[var(--adm-surface-2)] hover:text-[var(--adm-text)] transition"
                    }
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setPage((prev) => Math.min(prev + 1, totalPages || 1))}
              disabled={page === (totalPages || 1)}
              className="h-10 w-10 rounded-xl bg-[var(--adm-primary)] text-[var(--adm-on-primary)] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--adm-primary-hover)] transition"
              aria-label="صفحه بعد"
            >
              <ArrowLeft className="h-5 w-5 mx-auto" />
            </button>
          </div>
        </AdminCardContent>
      </AdminCard>

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
}
