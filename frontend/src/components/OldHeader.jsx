"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { ShoppingCartIcon, UserCircle, Search } from "lucide-react";
import Image from "next/image";
import logo from "@/assets/images/logo.png";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import apiClient from "@/common/apiClient";
import backApis from "@/common/inedx";
import { clearUser } from "@/redux/userSlice";

const Header = () => {
  const user = useSelector((state) => state?.user?.user);
  const dispatch = useDispatch();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const handleLogout = async () => {
    if (!user?.name) return;

    try {
      const response = await apiClient.get(backApis.logOut.url);

      toast.success(response.data.message);
      dispatch(clearUser());
    } catch (error) {
      toast.error("خطا در خروج از حساب کاربری");
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsSearchOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <header className="backdrop-blur-md bg-gradient-to-r from-emerald-200/50 to-emerald-500/40 shadow-lg sticky top-0 z-50 rounded-b-2xl">
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap justify-between items-center gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Image
            src={logo}
            width={50}
            height={50}
            alt="Logo"
            priority
            className="rounded-full shadow-md md:w-[45px] md:h-[45px] w-[40px] h-[40px]"
          />
        </Link>

        {/* Desktop Search */}
        <div className="hidden md:flex flex-1 max-w-xl w-full">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="جستجو کنید..."
              className="w-full py-2 px-4 rounded-full border-[2px] border-slate-500 focus:border-none focus:outline-none focus:ring-2 focus:ring-emerald-700 transition-all shadow-md bg-slate-300/50"
            />
            <button className="absolute left-2 top-1/2 -translate-y-1/2 text-emerald-600 hover:text-emerald-800 transition">
              <Search size={26} />
            </button>
          </div>
        </div>

        {/* User + Search Icon + Cart + Login */}
        <div className="flex items-center gap-4">
          <button
            className="block md:hidden text-emerald-600 hover:text-emerald-800 transition"
            onClick={() => setIsSearchOpen(true)}
          >
            <Search size={24} />
          </button>

          <Link
            href={
              user?.role === "admin"
                ? "/admin-panel"
                : user?.role === "user"
                ? "/user-account"
                : "#"
            }
            className="relative group"
          >
            <UserCircle
              size={26}
              className="text-emerald-600 hover:text-emerald-800 transition-all"
            />
            {!user?.name && (
              <div className="absolute text-[10px] bg-red-500 text-white px-1 py-1 rounded-md top-9 opacity-0 group-hover:opacity-100 transition-all">
                ابتدا وارد شوید
              </div>
            )}
          </Link>

          <div className="relative cursor-pointer">
            <ShoppingCartIcon
              size={26}
              className="text-emerald-600 hover:text-emerald-800 transition-all"
            />
            <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-[10px] h-5 w-5 flex items-center justify-center rounded-full font-bold">
              0
            </span>
          </div>

          <button
            onClick={user?.name ? handleLogout : null}
            className="bg-emerald-500 hover:bg-emerald-700 text-white px-2 py-1 rounded-xl text-[10px] md:text-sm transition shadow-sm"
          >
            {
              <Link href="/login">
                {" "}
                {user?.name ? "خروج" : "ورود / ثبت‌ نام"}
              </Link>
            }
          </button>
        </div>
      </div>

      {/* Search Modal for Mobile/Tablet */}
      {isSearchOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center pt-[10vh] z-[1000] animate-fadeIn"
          onClick={() => setIsSearchOpen(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 shadow-2xl w-[90%] max-w-md animate-slideDown"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              autoFocus
              type="text"
              placeholder="عبارت مورد نظر را وارد کنید..."
              className="w-full py-2 px-4 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all"
            />
            <button
              onClick={() => setIsSearchOpen(false)}
              className="mt-4 w-full bg-emerald-500 text-white py-2 rounded-xl hover:bg-emerald-700 transition"
            >
              جستجو
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
