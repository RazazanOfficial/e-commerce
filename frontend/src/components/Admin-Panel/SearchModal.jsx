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

      setSearchResults((prev) => prev.filter((user) => user._id !== userId));
      onUserDelete?.(userId);

      setSelectedUser(null);
      setActionMode(null);
    } catch (error) {
      console.error("❌ خطا در حذف کاربر:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl mx-auto bg-gray-900 border border-gray-700 rounded-xl shadow-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* دکمه بستن */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 text-gray-400 hover:text-red-500 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* عنوان */}
        <h2 className="text-xl font-bold text-white mb-6 border-b border-gray-700 pb-2">
          نتایج جستجو
        </h2>

        {/* محتوای جدول */}
        {searchResults.length === 0 ? (
          <p className="text-gray-400 text-center">کاربری یافت نشد</p>
        ) : (
          <div className="overflow-x-auto max-h-[450px] rounded-lg border border-gray-700">
            <table className="w-full text-right text-sm">
              <thead className="bg-gray-800 text-gray-300">
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
                    className={`${
                      idx % 2 === 0 ? "bg-gray-900" : "bg-gray-800/60"
                    } hover:bg-gray-700 transition-colors`}
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
                      <span className="text-gray-200">{user.name}</span>
                    </td>

                    {/* ایمیل */}
                    <td className="py-3 px-4 text-gray-300">{user.email}</td>

                    {/* موبایل */}
                    <td className="py-3 px-4 text-gray-300">
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
                          className="p-2 rounded-md text-gray-400 hover:text-emerald-400 hover:bg-gray-700 transition-colors"
                        >
                          <Eye className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleAction(user, "edit")}
                          className="p-2 rounded-md text-gray-400 hover:text-blue-400 hover:bg-gray-700 transition-colors"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleAction(user, "delete")}
                          className="p-2 rounded-md text-gray-400 hover:text-red-400 hover:bg-gray-700 transition-colors"
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
