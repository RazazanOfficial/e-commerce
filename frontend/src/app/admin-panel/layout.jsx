"use client";
import { useTheme } from "next-themes";
import apiClient from "@/common/apiClient";
import backApis from "@/common/inedx";
import Link from "next/link";
import { toast } from "react-toastify";
import Spinner from "@/components/Spinner";
import { notFound } from "next/navigation";
import { UserContext } from "@/context/UserContext";
import { AdminThemeProvider } from "@/context/AdminThemeContext";
import ThemeProvider from "@/components/theme-provider";
import { usePathname, useRouter } from "next/navigation";
import { useContext, useEffect, useMemo, useState } from "react";
import {
  Menu,
  X,
  Users,
  ShoppingBag,
  Settings,
  LogOut,
  Home,
  Sun,
  Monitor,
  Moon,
  Search,
  Bell,
  Folder,
} from "lucide-react";

// --- Theme toggle
function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const btnBase =
    "inline-flex items-center justify-center transition-colors " +
    "text-[var(--adm-text-muted)] hover:text-[var(--adm-text)] " +
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--adm-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--adm-bg)] " +
    "w-[var(--sz)] h-[var(--sz)] min-w-[var(--sz)] min-h-[var(--sz)] [--sz:32px] sm:[--sz:36px] md:[--sz:40px] " +
    "p-0.5 rounded-full hover:bg-[var(--adm-surface-2)]";

  return (
    <div className="flex items-center p-[2px] sm:p-[3px] border border-[color:var(--adm-border)] rounded-full w-max bg-[var(--adm-surface)]">
      <button
        aria-label="Light"
        className={`${btnBase} ${theme === "light" ? "bg-[var(--adm-primary-soft)]" : ""}`}
        onClick={() => setTheme("light")}
      >
        <Sun size={14} className="sm:w-4 sm:h-4 md:w-[18px] md:h-[18px]" />
      </button>
      <button
        aria-label="System"
        className={`${btnBase} ${theme === "system" ? "bg-[var(--adm-primary-soft)]" : ""}`}
        onClick={() => setTheme("system")}
      >
        <Monitor size={14} className="sm:w-4 sm:h-4 md:w-[18px] md:h-[18px]" />
      </button>
      <button
        aria-label="Dark"
        className={`${btnBase} ${theme === "dark" ? "bg-[var(--adm-primary-soft)]" : ""}`}
        onClick={() => setTheme("dark")}
      >
        <Moon size={14} className="sm:w-4 sm:h-4 md:w-[18px] md:h-[18px]" />
      </button>
    </div>
  );
}

// --- Sidebar Item
function NavItem({ href, icon, label, active, onClick }) {
  const base =
    "group flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl transition-colors " +
    "text-[var(--adm-text-muted)] hover:text-[var(--adm-text)] hover:bg-[var(--adm-surface-2)]";
  const act =
    "bg-[var(--adm-primary-soft)] text-[var(--adm-text)] ring-1 ring-inset ring-[color:var(--adm-ring)]";

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
      {
        href: "/admin-panel/all-users",
        label: "کاربران",
        icon: <Users size={16} />,
      },
      {
        href: "/admin-panel/categories",
        label: "دسته‌بندی‌ها",
        icon: <Folder size={16} />,
      },

      {
        href: "/admin-panel/all-products",
        label: "محصولات",
        icon: <ShoppingBag size={16} />,
      },
      {
        href: "/admin-panel/settings",
        label: "تنظیمات",
        icon: <Settings size={16} />,
      },
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
    if (shouldRedirect) router.push("/auth");
  }, [shouldRedirect, router]);

  if (user === null && !timeoutReached) return <Spinner />;
  if (!user || (user.role !== "admin" && user.role !== "developer"))
    return null;

  return (
    <ThemeProvider>
      <AdminThemeProvider>
      <div className="min-h-screen bg-[var(--adm-bg)] text-[var(--adm-text)]">
        <div className="min-h-screen flex flex-col">
          <div className="flex flex-1">
            {/* Sidebar toggle (mobile) */}
            <button
              className="xl:hidden fixed top-3 right-3 z-50 p-2 rounded-full bg-[var(--adm-primary)] text-[var(--adm-on-primary)] shadow-[0_10px_30px_var(--adm-shadow)]"
              onClick={() => setSidebarOpen((s) => !s)}
            >
              {sidebarOpen ? (
                <X className="h-5 w-5 sm:h-6 sm:w-6" />
              ) : (
                <Menu className="h-5 w-5 sm:h-6 sm:w-6" />
              )}
            </button>

            {/* Sidebar */}
            <aside
              className={`${
                sidebarOpen ? "flex" : "hidden"
              } xl:flex xl:w-64 lg:w-60 flex-col fixed inset-y-0 right-0 transition duration-300 ease-in-out z-30 h-full 
              bg-[var(--adm-surface)] border-l border-[color:var(--adm-border)] shadow-[0_20px_60px_var(--adm-shadow)]`}
            >
              <div className="p-4 sm:p-5 pt-14 sm:pt-16">
                <div className="flex items-center gap-2 sm:gap-3 mb-6 sm:mb-8 rounded-xl p-3 sm:p-4 border border-[color:var(--adm-border)] bg-[var(--adm-surface-2)]">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[var(--adm-primary)] text-[var(--adm-on-primary)] flex items-center justify-center">
                    <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <h1 className="text-[var(--adm-text)] text-sm sm:text-base font-bold">
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
                <div className="mb-4 rounded-2xl border border-[color:var(--adm-border)] bg-[var(--adm-surface)] p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-[var(--adm-text-muted)]">حالت نمایش</span>
                    <Link
                      href="/admin-panel/settings"
                      className="text-xs text-[var(--adm-primary)] hover:underline"
                    >
                      تنظیمات
                    </Link>
                  </div>
                  <ThemeToggle />
                </div>
                <button
                  className="w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-[var(--adm-error)] hover:bg-[var(--adm-error-soft)] transition-colors text-sm sm:text-base"
                  onClick={async () => {
                    try {
                      const { url, method } = backApis.logOut;
                      await apiClient({ url, method });
                      router.push("/auth");
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
            <main className="flex-1 xl:mr-64 mr-0 transition-all duration-300 py-10">
              <div className="animate-[fadeIn_0.5s_ease_forwards] md:px-8 px-4">
                {children}
              </div>
            </main>
          </div>
        </div>
      </div>
      </AdminThemeProvider>
    </ThemeProvider>
  );
}
