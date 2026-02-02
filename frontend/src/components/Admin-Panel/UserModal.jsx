"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { toast } from "react-toastify";
import { Btn1 } from "../ui/Buttons";

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
    toast.success("تغییرات با موفقیت ذخیره شد", { position: "top-center" });
    onClose();
  };

  const handleDelete = () => {
    onDelete(user._id || user.id);
    toast.error("کاربر با موفقیت حذف شد", { position: "top-center" });
    onClose();
  };

  if (!isOpen || !user) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md"
      style={{ background: "var(--adm-overlay, rgba(0,0,0,0.62))" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md mx-auto rounded-2xl shadow-xl p-6"
        style={{
          background: "var(--adm-surface, #111827)",
          border: "1px solid var(--adm-border, rgba(148,163,184,0.25))",
          color: "var(--adm-text, #E5E7EB)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* دکمه بستن */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 transition"
          style={{ color: "var(--adm-text-muted, #9CA3AF)" }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.color = "var(--adm-error, #EF4444)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.color = "var(--adm-text-muted, #9CA3AF)")
          }
        >
          <X className="w-5 h-5" />
        </button>

        {/* تیتر */}
        <h2 className="text-xl font-bold mb-6 text-center" style={{ color: "var(--adm-text, #E5E7EB)" }}>
          {mode === "view"
            ? "نمایش اطلاعات کاربر"
            : mode === "edit"
            ? "ویرایش اطلاعات کاربر"
            : "حذف کاربر"}
        </h2>

        {/* نمایش / ویرایش */}
        {(mode === "view" || mode === "edit") && (
          <form className="space-y-4">
            {[
              { label: "نام", name: "name", type: "text" },
              { label: "ایمیل", name: "email", type: "email" },
              { label: "شماره موبایل", name: "phone", type: "tel" },
              { label: "آدرس", name: "address", type: "text" },
              { label: "کد پستی", name: "postalCode", type: "text" },
            ].map((field) => (
              <div key={field.name}>
                <label
                  className="block text-sm mb-1"
                  style={{ color: "var(--adm-text-muted, #9CA3AF)" }}
                >
                  {field.label}
                </label>
                <input
                  type={field.type}
                  name={field.name}
                  value={formData[field.name] || ""}
                  disabled={mode === "view"}
                  onChange={handleChange}
                  className="w-full rounded-xl px-3 py-2 focus:outline-none focus:ring-2 disabled:opacity-50"
                  style={{
                    background: "var(--adm-surface-2, rgba(15,23,42,0.7))",
                    border: "1px solid var(--adm-border, rgba(148,163,184,0.25))",
                    color: "var(--adm-text, #E5E7EB)",
                    boxShadow: "none",
                  }}
                  onFocus={(e) =>
                    (e.currentTarget.style.boxShadow =
                      "0 0 0 3px var(--adm-ring, rgba(99,102,241,0.35))")
                  }
                  onBlur={(e) => (e.currentTarget.style.boxShadow = "none")}
                />
              </div>
            ))}

            {mode === "edit" && (
              <Btn1
                text="ذخیره تغییرات"
                onClick={handleUpdate}
                variant="blue"
                btnClassName="w-full mt-6"
              />
            )}
          </form>
        )}

        {/* حذف */}
        {mode === "delete" && (
          <div className="text-center space-y-4">
            <p className="font-medium" style={{ color: "var(--adm-text, #E5E7EB)" }}>
              آیا مطمئن هستید که می‌خواهید کاربر{" "}
              <strong style={{ color: "var(--adm-error, #EF4444)" }}>{user.name}</strong> را حذف کنید؟
            </p>
            <Btn1
              text={
                countdown > 0
                  ? `در حال آماده‌سازی... (${countdown})`
                  : "تایید حذف"
              }
              onClick={handleDelete}
              disabled={countdown > 0}
              variant={countdown > 0 ? "gray" : "red"}
              btnClassName="w-full"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default UserModal;
