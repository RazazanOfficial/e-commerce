"use client";

import { useContext, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { notFound } from "next/navigation";
import { UserContext } from "@/context/UserContext";

import Link from "next/link";
import { Menu, X, PackageOpen, Heart, Settings } from "lucide-react";
import { toast } from "react-toastify";

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
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-gray-600">در حال بارگذاری...</p>
      </div>
    );
  }

  if (!user || user.role !== "admin") return null;

  const links = [
    { href: "/admin-panel/all-users", label: "همه مشتریان", icon: <PackageOpen size={20} /> },
    { href: "/admin-panel/all-products", label: "همه محصولات", icon: <Heart size={20} /> },
    { href: "/admin-panel/settings", label: "تنظیمات", icon: <Settings size={20} /> },
  ];

  return (
    <div className="flex flex-col md:flex-row min-h-screen relative">
      {/* Mobile menu toggle */}
      <button
        className="md:hidden absolute top-4 right-4 z-50 bg-emerald-500 text-white p-2 rounded-lg"
        onClick={() => setSidebarOpen((prev) => !prev)}
        aria-label="Toggle menu"
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`bg-white border-l border-emerald-100 shadow-sm w-64 md:w-1/4 px-6 py-10 space-y-4
        fixed md:static top-0 right-0 h-full z-40 transform transition-transform duration-300
        ${sidebarOpen ? "translate-x-0" : "translate-x-full"} md:translate-x-0`}
      >
        <ul>
          {links.map(({ href, label, icon }) => (
            <li key={href}>
              <Link
                href={href}
                className={`flex items-center gap-3 p-3 rounded-xl text-sm font-medium transition-all duration-200
                ${
                  pathname === href
                    ? "bg-emerald-100 text-emerald-700"
                    : "text-gray-600 hover:bg-emerald-50 hover:text-emerald-600"
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <span className="text-lg">{icon}</span>
                <span>{label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:basis-3/4 py-14 pr-7 mt-16 md:mt-0">{children}</main>
    </div>
  );
}
