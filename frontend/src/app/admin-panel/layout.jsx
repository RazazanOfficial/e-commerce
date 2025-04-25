"use client";

import { useContext, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { notFound } from "next/navigation";
import { UserContext } from "@/context/UserContext";

import Link from "next/link";
import {
  Menu,
  X,
  Users,
  ShoppingBag,
  Settings,
  LogOut,
  Home,
  Bell,
  Search,
} from "lucide-react";
import { toast } from "react-toastify";
import Spinner from "@/components/Spinner";
import axios from "axios";

export default function AdminPanelLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useContext(UserContext);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [timeoutReached, setTimeoutReached] = useState(false);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setTimeoutReached(true);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (timeoutReached && !user) {
      toast.error("برای دسترسی به پنل ادمین، وارد شوید");
      setShouldRedirect(true);
    }

    if (user && user.role !== "admin") {
      notFound();
    }
  }, [timeoutReached, user]);

  useEffect(() => {
    if (shouldRedirect) {
      router.push("/login");
    }
  }, [shouldRedirect]);

  if (user === null && !timeoutReached) {
    return <Spinner />;
  }

  if (!user || user.role !== "admin") return null;

  const links = [
    { href: "/admin-panel", label: "داشبورد", icon: <Home size={20} /> },
    {
      href: "/admin-panel/all-users",
      label: "کاربران",
      icon: <Users size={20} />,
    },
    {
      href: "/admin-panel/all-products",
      label: "محصولات",
      icon: <ShoppingBag size={20} />,
    },
    {
      href: "/admin-panel/settings",
      label: "تنظیمات",
      icon: <Settings size={20} />,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-200 to-cyan-300">
      {/* Admin Layout */}
      <div className="min-h-screen flex flex-col">
        <div className="flex flex-1">
          {/* Sidebar toggle button for mobile */}
          <button
            className="lg:hidden fixed top-3 right-4 z-50 p-2 rounded-full bg-emerald-600 text-white shadow-lg"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>

          {/* Admin sidebar - collapsed on mobile */}
          <aside
            className={`${
              sidebarOpen ? "flex" : "hidden"
            } lg:flex lg:w-64 flex-col fixed inset-y-0 right-0 transform transition duration-300 ease-in-out z-30 h-full bg-gradient-to-b from-cyan-300 via-cyan-500 to-cyan-600 border-l border-white/10`}
          >
            <div className="p-5">
              <div className="flex items-center justify-start mb-8 mt-20 bg-green-600/50 rounded-lg p-4 shadow-md">
                <div className="w-12 h-12 rounded-full bg-emerald-600 flex items-center justify-center">
                  <Users className="h-7 w-7 text-white" />
                </div>
                <h1 className="text-white text-lg font-bold mr-3">پنل ادمین</h1>
              </div>

              <nav className="mt-8">
                <ul className="space-y-2">
                  {links.map(({ href, label, icon }) => (
                    <li key={href}>
                      <Link
                        href={href}
                        className={`flex items-center px-4 py-3 text-white ${
                          pathname === href
                            ? "bg-emerald-600"
                            : "hover:bg-emerald-500"
                        } rounded-lg transition-all duration-200`}
                        onClick={() => setSidebarOpen(false)}
                      >
                        <span className="ml-3">{icon}</span>
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>

            <div className="mt-auto p-5">
                  <p>settings</p>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 lg:mr-64 transition-all duration-300 p-4 md:p-8">
            {/* Top navigation */}
            <header className="bg-white/20 backdrop-blur-xl w-full p-3 rounded-xl flex justify-between items-center mb-6 border border-white/20 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="جستجو..."
                    className="py-2 pl-10 pr-4 rounded-lg bg-white/30 backdrop-blur-md border border-white/30 focus:outline-none focus:ring-2 focus:ring-emerald-500 w-64 transition-all"
                  />
                  <Search className="w-5 h-5 absolute left-3 top-2.5 text-gray-500" />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <button className="relative p-2 rounded-full hover:bg-white/30 transition-colors">
                  <Bell className="w-5 h-5 text-gray-700" />
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
                    3
                  </span>
                </button>

                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-r from-emerald-600 to-teal-500 flex items-center justify-center text-white font-bold text-sm">
                    {user?.name?.charAt(0) || "A"}
                  </div>
                  <div className="hidden md:block">
                    <p className="text-sm font-medium">
                      {user?.name || "ادمین"}
                    </p>
                    <p className="text-xs text-gray-600">مدیر</p>
                  </div>
                </div>
              </div>
            </header>

            {/* Page content */}
            <div className="animate-[fadeIn_0.5s_ease_forwards]">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
