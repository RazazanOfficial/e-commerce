import { useEffect, useState } from "react";
import { X } from "lucide-react";

const UserModal = ({ isOpen, onClose, mode, user, onUpdate, onDelete }) => {
  const [formData, setFormData] = useState(user || {});
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (isOpen) {
      setFormData(user || {});
      setCountdown(5);
    }
  }, [isOpen, user]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  useEffect(() => {
    let timer;
    if (mode === "delete" && isOpen && countdown > 0) {
      timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown, mode, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdate = () => {
    onUpdate(formData);
    onClose();
  };

  const handleDelete = () => {
    onDelete(user._id || user.id);
    onClose();
  };

  if (!isOpen || !user) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md mx-auto bg-white rounded-xl shadow-xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 left-4 text-gray-600 hover:text-red-500"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-lg font-bold text-emerald-700 mb-4">
          {mode === "view"
            ? "نمایش اطلاعات کاربر"
            : mode === "edit"
            ? "ویرایش اطلاعات کاربر"
            : "حذف کاربر"}
        </h2>

        {(mode === "view" || mode === "edit") && (
          <form className="space-y-4">
            <div>
              <label className="block text-sm mb-1">نام</label>
              <input
                type="text"
                name="name"
                value={formData.name || ""}
                disabled={mode === "view"}
                onChange={handleChange}
                className="w-full border rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">ایمیل</label>
              <input
                type="email"
                name="email"
                value={formData.email || ""}
                disabled={mode === "view"}
                onChange={handleChange}
                className="w-full border rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">شماره موبایل</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone || ""}
                disabled={mode === "view"}
                onChange={handleChange}
                className="w-full border rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">آدرس</label>
              <input
                type="text"
                name="address"
                value={formData.address || ""}
                disabled={mode === "view"}
                onChange={handleChange}
                className="w-full border rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">کد پستی</label>
              <input
                type="text"
                name="postalCode"
                value={formData.postalCode || ""}
                disabled={mode === "view"}
                onChange={handleChange}
                className="w-full border rounded-md px-3 py-2"
              />
            </div>

            {mode === "edit" && (
              <button
                type="button"
                onClick={handleUpdate}
                className="w-full mt-4 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700"
              >
                ذخیره تغییرات
              </button>
            )}
          </form>
        )}

        {mode === "delete" && (
          <div className="text-center">
            <p className="text-red-600 font-medium mb-4">
              آیا مطمئن هستید که می‌خواهید کاربر <strong>{user.name}</strong> را حذف کنید؟
            </p>
            <button
              disabled={countdown > 0}
              onClick={handleDelete}
              className={`w-full py-2 rounded-md ${
                countdown > 0
                  ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                  : "bg-red-600 text-white hover:bg-red-700"
              }`}
            >
              {countdown > 0 ? `در حال آماده‌سازی... (${countdown})` : "تایید حذف"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserModal;
