"use client";

import { X, Eye, Edit, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import UserModal from "./UserModal";
import backApis from "@/common/inedx";
import axios from "axios";

const SearchModal = ({
  users,
  isOpen,
  onClose,
  getUserAvatarColor,
  getRoleBadgeVariant,
  onUserUpdate,
  onUserDelete,
}) => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionMode, setActionMode] = useState(null);
  const [searchResults, setSearchResults] = useState(users || []);

  useEffect(() => {
    setSearchResults(users || []);
  }, [users]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  const handleAction = (user, mode) => {
    setSelectedUser(user);
    setActionMode(mode);
  };

  const handleUpdateUser = async (updatedUser) => {
    try {
      const { url, method } = backApis.updateUser(updatedUser._id);
      const response = await axios({
        method,
        url,
        data: updatedUser,
        withCredentials: true,
      });

      const updated = response.data?.data;

      setSearchResults((prev) =>
        prev.map((user) => (user._id === updated._id ? updated : user))
      );

      onUserUpdate?.(updated);

      setSelectedUser(null);
      setActionMode(null);
    } catch (error) {
      console.error("خطا در آپدیت کاربر:", error);
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      const { url, method } = backApis.deleteUser(userId);
      await axios({ method, url, withCredentials: true });

      setSearchResults((prev) => prev.filter((user) => user._id !== userId));
      onUserDelete?.(userId);

      setSelectedUser(null);
      setActionMode(null);
    } catch (error) {
      console.error("خطا در حذف کاربر:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
      style={{ background: "var(--adm-overlay, rgba(0,0,0,0.55))" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl mx-auto rounded-2xl shadow-2xl p-6"
        style={{
          background: "var(--adm-surface, #111827)",
          border: "1px solid var(--adm-border, rgba(148,163,184,0.25))",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* دکمه بستن */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 transition-colors"
          style={{ color: "var(--adm-text-muted, #9CA3AF)" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--adm-error, #EF4444)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--adm-text-muted, #9CA3AF)")}
        >
          <X className="w-6 h-6" />
        </button>

        {/* عنوان */}
        <h2
          className="text-xl font-bold mb-6 pb-2"
          style={{
            color: "var(--adm-text, #E5E7EB)",
            borderBottom: "1px solid var(--adm-border, rgba(148,163,184,0.25))",
          }}
        >
          نتایج جستجو
        </h2>

        {/* محتوای جدول */}
        {searchResults.length === 0 ? (
          <p className="text-center" style={{ color: "var(--adm-text-muted, #9CA3AF)" }}>
            کاربری یافت نشد
          </p>
        ) : (
          <div
            className="overflow-x-auto max-h-[450px] rounded-xl"
            style={{ border: "1px solid var(--adm-border, rgba(148,163,184,0.25))" }}
          >
            <table className="w-full text-right text-sm">
              <thead
                style={{
                  background: "var(--adm-surface-2, #1F2937)",
                  color: "var(--adm-text-muted, #D1D5DB)",
                }}
              >
                <tr>
                  <th className="py-3 px-4 font-medium">نام</th>
                  <th className="py-3 px-4 font-medium">ایمیل</th>
                  <th className="py-3 px-4 font-medium">شماره موبایل</th>
                  <th className="py-3 px-4 font-medium">نقش</th>
                  <th className="py-3 px-4 font-medium">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {searchResults.map((user, idx) => (
                  <tr
                    key={user._id || user.id}
                    className="transition-colors"
                    style={{
                      background:
                        idx % 2 === 0
                          ? "var(--adm-surface, #111827)"
                          : "var(--adm-surface-2, #1F2937)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background =
                        "var(--adm-primary-soft, rgba(99,102,241,0.12))";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background =
                        idx % 2 === 0
                          ? "var(--adm-surface, #111827)"
                          : "var(--adm-surface-2, #1F2937)";
                    }}
                  >
                    {/* نام + آواتار */}
                    <td className="py-3 px-4 flex items-center">
                      <div
                        className={`w-8 h-8 rounded-full ${getUserAvatarColor(
                          user.name
                        )} flex items-center justify-center font-bold text-sm ml-2 text-white`}
                      >
                        {user.name?.charAt(0)}
                      </div>
                      <span style={{ color: "var(--adm-text, #E5E7EB)" }}>
                        {user.name}
                      </span>
                    </td>

                    {/* ایمیل */}
                    <td className="py-3 px-4" style={{ color: "var(--adm-text-muted, #D1D5DB)" }}>
                      {user.email}
                    </td>

                    {/* موبایل */}
                    <td className="py-3 px-4" style={{ color: "var(--adm-text-muted, #D1D5DB)" }}>
                      {user.phone || "-"}
                    </td>

                    {/* نقش */}
                    <td className="py-3 px-4">
                      <span
                        className={`${getRoleBadgeVariant(
                          user.role
                        )} px-3 py-1 rounded-full text-xs font-medium`}
                      >
                        {user.role === "admin" ? "مدیر" : "کاربر"}
                      </span>
                    </td>

                    {/* اکشن‌ها */}
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAction(user, "view")}
                          className="p-2 rounded-lg transition-colors"
                          style={{ color: "var(--adm-text-muted, #9CA3AF)" }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background =
                              "var(--adm-success-soft, rgba(34,197,94,0.14))";
                            e.currentTarget.style.color = "var(--adm-success, #22C55E)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "transparent";
                            e.currentTarget.style.color = "var(--adm-text-muted, #9CA3AF)";
                          }}
                        >
                          <Eye className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleAction(user, "edit")}
                          className="p-2 rounded-lg transition-colors"
                          style={{ color: "var(--adm-text-muted, #9CA3AF)" }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background =
                              "var(--adm-primary-soft, rgba(99,102,241,0.12))";
                            e.currentTarget.style.color = "var(--adm-primary, #6366F1)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "transparent";
                            e.currentTarget.style.color = "var(--adm-text-muted, #9CA3AF)";
                          }}
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleAction(user, "delete")}
                          className="p-2 rounded-lg transition-colors"
                          style={{ color: "var(--adm-text-muted, #9CA3AF)" }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background =
                              "var(--adm-error-soft, rgba(239,68,68,0.14))";
                            e.currentTarget.style.color = "var(--adm-error, #EF4444)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "transparent";
                            e.currentTarget.style.color = "var(--adm-text-muted, #9CA3AF)";
                          }}
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* مودال عملیات (ویرایش، مشاهده، حذف) */}
      <UserModal
        isOpen={!!selectedUser}
        user={selectedUser}
        mode={actionMode}
        onClose={() => {
          setSelectedUser(null);
          setActionMode(null);
        }}
        onUpdate={handleUpdateUser}
        onDelete={handleDeleteUser}
      />
    </div>
  );
};

export default SearchModal;
