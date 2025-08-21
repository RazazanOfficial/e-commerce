"use client";
import Logo from "@/assets/images/Logo.png";
import { Heart, Search, ShoppingCart, Menu, X, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  { href: "/", label: "صفحه اصلی" },
  { href: "/products", label: "محصولات" },
  { href: "/about", label: "درباره ما" },
  { href: "/contact", label: "تماس با ما" },
];

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const NavLink = ({ href, label, onClick, className }) => (
    <Link
      href={href}
      onClick={onClick}
      className={`relative group w-fit ${className || ""}`}
    >
      <span className="transition-colors duration-300 group-hover:text-blue-600">
        {label}
      </span>
      <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full"></span>
    </Link>
  );

  return (
    <header className="border-b-2 border-gray-200 h-16 flex items-center justify-between px-6 bg-white shadow-sm relative">
      <div className="flex items-center gap-4">
        <ShoppingCart size={22} className="text-gray-800 cursor-pointer" />
        <Heart size={22} className="text-gray-800 cursor-pointer" />
        <div className="hidden lg:flex items-center bg-gray-200 rounded-md px-3 py-2">
          <input
            type="text"
            placeholder="دنبال چی میگردی؟"
            className="bg-gray-200 outline-none text-sm w-40"
          />
          <Search size={18} className="text-gray-600 cursor-pointer" />
        </div>
        <button className="lg:hidden" onClick={() => setMobileMenuOpen(true)}>
          <Menu size={26} />
        </button>
      </div>

      <nav className="hidden lg:flex gap-6 text-base text-gray-700">
        {navItems.map((item) => (
          <NavLink key={item.href} href={item.href} label={item.label} />
        ))}
      </nav>

      <div className="flex items-center gap-4">
        <Link
          href="/auth"
          className="px-3 py-1.5 bg-white text-gray-900 border-2 border-black hover:border-blue-800 hover:text-white rounded-lg text-sm hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
        >
          <span>ورود / ثبت‌نام</span>
          <User width={20} height={20} />
        </Link>
        <p className="font-extrabold text-xl text-gray-900 hidden lg:block">سرزمین دیتا</p>
        <Image
          src={Logo}
          alt="لوگو سرزمین دیتا"
          width={50}
          height={50}
          priority
          className="rounded-lg"
        />
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              className="fixed top-0 right-0 h-full w-2/3 bg-white shadow-lg p-6 flex flex-col gap-6 z-50"
            >
              <button
                className="self-end mb-4"
                onClick={() => setMobileMenuOpen(false)}
              >
                <X size={28} />
              </button>
              <div className="flex items-center bg-gray-200 rounded-md px-3 py-2">
                <input
                  type="text"
                  placeholder="دنبال چی میگردی؟"
                  className="bg-gray-200 outline-none text-sm w-full"
                />
                <Search size={18} className="text-gray-600 cursor-pointer" />
              </div>
              {navItems.map((item) => (
                <NavLink
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  className={`w-full h-12`}
                  onClick={() => setMobileMenuOpen(false)}
                />
              ))}
              <Link
                href="/auth"
                onClick={() => setMobileMenuOpen(false)}
                className="flex px-3 py-2 bg-white text-gray-900 border-2 border-black hover:border-blue-800 hover:text-white rounded-lg text-sm hover:bg-blue-700 transition-colors items-center justify-center gap-2"
              >
                <span>ورود / ثبت‌نام</span>
                <User width={20} height={20} />
              </Link>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
