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
      console.error("❌ خطا در آپدیت کاربر:", error);
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      const { url, method } = backApis.deleteUser(userId);
      await axios({ method, url, withCredentials: true });

      // حذف از لیست لوکال
      setSearchResults((prev) => prev.filter((user) => user._id !== userId));

      onUserDelete?.(userId); // حذف از لیست اصلی

      setSelectedUser(null);
      setActionMode(null);
    } catch (error) {
      console.error("❌ خطا در حذف کاربر:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl mx-auto bg-white rounded-xl shadow-xl p-4 sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 left-4 text-gray-600 hover:text-red-500"
        >
          <X className="w-6 h-6" />
        </button>
        <h2 className="text-xl font-bold text-emerald-700 mb-4">نتایج جستجو</h2>

        {searchResults.length === 0 ? (
          <p className="text-gray-500 text-center">کاربری یافت نشد</p>
        ) : (
          <div className="overflow-x-auto max-h-[400px]">
            <table className="w-full text-right">
              <thead>
                <tr className="bg-emerald-800 text-white">
                  <th className="py-3 px-4">نام</th>
                  <th className="py-3 px-4">ایمیل</th>
                  <th className="py-3 px-4">شماره موبایل</th>
                  <th className="py-3 px-4">نقش</th>
                  <th className="py-3 px-4">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {searchResults.map((user) => (
                  <tr
                    key={user._id || user.id}
                    className="border-b border-gray-100 bg-emerald-100/50 hover:bg-emerald-200/60 transition-colors duration-75"
                  >
                    <td className="py-3 px-4 flex items-center">
                      <div
                        className={`w-8 h-8 rounded-full ${getUserAvatarColor(
                          user.name
                        )} flex items-center justify-center font-bold text-sm ml-2`}
                      >
                        {user.name?.charAt(0)}
                      </div>
                      {user.name}
                    </td>
                    <td className="py-3 px-4">{user.email}</td>
                    <td className="py-3 px-4">{user.phone || "-"}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`${getRoleBadgeVariant(
                          user.role
                        )} px-2 py-1 rounded-full text-xs font-medium`}
                      >
                        {user.role === "admin" ? "مدیر" : "کاربر"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex space-x-2 space-x-reverse">
                        <button
                          onClick={() => handleAction(user, "view")}
                          className="p-1.5 rounded-lg text-gray-700 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                        >
                          <Eye className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleAction(user, "edit")}
                          className="p-1.5 rounded-lg text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleAction(user, "delete")}
                          className="p-1.5 rounded-lg text-gray-700 hover:text-red-600 hover:bg-red-50 transition-colors"
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
