"use client";

import { useContext, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { notFound } from "next/navigation";
import { UserContext } from "@/context/UserContext";
import ThemeProvider from "@/components/theme-provider";
import Spinner from "@/components/Spinner";
import { toast } from "react-toastify";
import axios from "axios";
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
  Sun,
  Monitor,
  Moon,
} from "lucide-react";
import { useTheme } from "next-themes";

// --- Theme toggle
function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const btnBase =
    "inline-flex items-center justify-center transition-colors " +
    "text-zinc-600 dark:text-zinc-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 " +
    "w-[var(--sz)] h-[var(--sz)] min-w-[var(--sz)] min-h-[var(--sz)] [--sz:32px] sm:[--sz:36px] md:[--sz:40px] " +
    "p-0.5 rounded-full hover:text-black dark:hover:text-white data-[state=active]:bg-blue-600/15";

  return (
    <div className="flex items-center p-[2px] sm:p-[3px] border border-zinc-400/60 dark:border-zinc-600/60 rounded-full w-max bg-white/70 dark:bg-slate-900/60 backdrop-blur">
      <button aria-label="Light" className={btnBase} onClick={() => setTheme("light")}>
        <Sun size={14} className="sm:w-4 sm:h-4 md:w-[18px] md:h-[18px]" />
      </button>
      <button aria-label="System" className={btnBase} onClick={() => setTheme("system")}>
        <Monitor size={14} className="sm:w-4 sm:h-4 md:w-[18px] md:h-[18px]" />
      </button>
      <button aria-label="Dark" className={btnBase} onClick={() => setTheme("dark")}>
        <Moon size={14} className="sm:w-4 sm:h-4 md:w-[18px] md:h-[18px]" />
      </button>
    </div>
  );
}

// --- Sidebar Item
function NavItem({ href, icon, label, active, onClick }) {
  const base =
    "group flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl transition-all " +
    "text-slate-700 dark:text-slate-200 hover:bg-blue-600/10 dark:hover:bg-slate-700/60";
  const act = "bg-blue-700 text-white shadow-inner hover:bg-blue-700 dark:shadow-black/20";

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      onClick={onClick}
      className={`${base} ${active ? act : ""}`}
    >
      <span className="shrink-0">{icon}</span>
      <span className="truncate text-sm sm:text-base">{label}</span>
    </Link>
  );
}

export default function AdminPanelLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useContext(UserContext);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [timeoutReached, setTimeoutReached] = useState(false);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  const links = useMemo(
    () => [
      { href: "/admin-panel", label: "داشبورد", icon: <Home size={16} /> },
      { href: "/admin-panel/all-users", label: "کاربران", icon: <Users size={16} /> },
      { href: "/admin-panel/all-products", label: "محصولات", icon: <ShoppingBag size={16} /> },
      { href: "/admin-panel/settings", label: "تنظیمات", icon: <Settings size={16} /> },
    ],
    []
  );

  const [activeHref, setActiveHref] = useState(pathname);
  useEffect(() => setActiveHref(pathname), [pathname]);

  useEffect(() => {
    const timer = setTimeout(() => setTimeoutReached(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (timeoutReached && !user) {
      toast.error("برای دسترسی به پنل ادمین، وارد شوید");
      setShouldRedirect(true);
    }
    if (user && user.role !== "admin" && user.role !== "developer") {
      notFound();
    }
  }, [timeoutReached, user]);

  useEffect(() => {
    if (shouldRedirect) router.push("/login");
  }, [shouldRedirect, router]);

  if (user === null && !timeoutReached) return <Spinner />;
  if (!user || (user.role !== "admin" && user.role !== "developer")) return null;

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        <div className="min-h-screen flex flex-col">
          <div className="flex flex-1">
            {/* Sidebar toggle (mobile) */}
            <button
              className="xl:hidden fixed top-3 right-3 z-50 p-2 rounded-full bg-blue-700 text-white shadow-lg"
              onClick={() => setSidebarOpen((s) => !s)}
            >
              {sidebarOpen ? <X className="h-5 w-5 sm:h-6 sm:w-6" /> : <Menu className="h-5 w-5 sm:h-6 sm:w-6" />}
            </button>

            {/* Sidebar */}
            <aside
              className={`${
                sidebarOpen ? "flex" : "hidden"
              } xl:flex xl:w-64 lg:w-60 flex-col fixed inset-y-0 right-0 transition duration-300 ease-in-out z-30 h-full 
              bg-white/80 dark:bg-slate-900/70 backdrop-blur border-l border-slate-200/60 dark:border-slate-700/60`}
            >
              <div className="p-4 sm:p-5 pt-14 sm:pt-16">
                <div className="flex items-center gap-2 sm:gap-3 mb-6 sm:mb-8 rounded-xl p-3 sm:p-4 border border-sky-400/30 bg-sky-400/10">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-blue-700 text-white flex items-center justify-center">
                    <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <h1 className="text-slate-900 dark:text-slate-100 text-sm sm:text-base font-bold">
                    پنل ادمین
                  </h1>
                </div>

                <nav className="mt-4 sm:mt-6">
                  <ul className="grid gap-2">
                    {links.map(({ href, label, icon }) => (
                      <li key={href}>
                        <NavItem
                          href={href}
                          label={label}
                          icon={icon}
                          active={activeHref === href}
                          onClick={() => {
                            setActiveHref(href);
                            setSidebarOpen(false);
                          }}
                        />
                      </li>
                    ))}
                  </ul>
                </nav>
              </div>

              <div className="mt-auto p-4 sm:p-5">
                <button
                  className="w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-red-600 hover:bg-red-600/10 transition-colors text-sm sm:text-base"
                  onClick={async () => {
                    try {
                      await axios.post("/api/logout");
                      router.push("/login");
                    } catch {
                      toast.error("خروج ناموفق بود");
                    }
                  }}
                >
                  <LogOut size={16} />
                  خروج
                </button>
              </div>
            </aside>

            {/* Main content */}
            <main className="flex-1 xl:mr-64 mr-0 transition-all duration-300">
              {/* Top bar */}
              
              {/* <header
                className="w-full mb-4 sm:mb-6 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 
              bg-white/70 dark:bg-slate-900/60 backdrop-blur p-2 sm:p-3 
                flex flex-wrap items-center justify-between gap-2"
              >
                <div className="relative flex-1 min-w-[140px] max-w-xs sm:max-w-sm md:max-w-md">
                  <input
                    type="text"
                    placeholder="جستجو..."
                    className="w-full py-1.5 sm:py-2 pl-9 pr-3 sm:pr-4 rounded-xl text-sm sm:text-base 
                  bg-white/80 dark:bg-slate-900/70 border border-slate-200/60 dark:border-slate-700/60 
                    focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
                  />
                  <Search className="w-4 h-4 sm:w-5 sm:h-5 absolute left-2.5 top-2 sm:top-2.5 text-slate-500 dark:text-slate-400" />
                </div>

                <div className="flex items-center gap-3 sm:gap-4">
                  <button className="relative p-1.5 sm:p-2 rounded-full hover:bg-blue-600/10 dark:hover:bg-slate-700/60">
                    <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700 dark:text-slate-200" />
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-red-500 rounded-full text-white text-[10px] sm:text-xs flex items-center justify-center">
                      3
                    </span>
                  </button>
                  <ThemeToggle />
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-blue-700 to-blue-900 text-white flex items-center justify-center text-xs sm:text-sm font-bold">
                      {user?.name?.charAt(0) || "A"}
                    </div>
                    <div className="hidden md:block">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {user?.name || "ادمین"}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">مدیر</p>
                    </div>
                  </div>
                </div>
              </header>  */}


              <div className="animate-[fadeIn_0.5s_ease_forwards] lg:p-3 md:p-3 py-3">{children}</div>
            </main>
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}
