"use client";

import { useMemo, useState } from "react";
import { toast } from "react-toastify";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Eye,
  Mail,
  Pencil,
  Phone,
  RefreshCw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import usePaginatedFetchHook from "@/hooks/usePaginatedFetchHook";
import backApis from "@/common";
import apiClient from "@/common/apiClient";
import UserModal from "@/components/Admin-Panel/UserModal";
import {
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminCardContent,
  AdminIconButton,
  AdminInput,
  AdminSelect,
  AdminTable,
  AdminTableShell,
  AdminTD,
  AdminTH,
  AdminTHead,
  AdminTR,
} from "@/components/admin-ui";

const HIDDEN_ROLES = new Set(["developer"]);

const ROLE_META = {
  admin: { label: "مدیر", className: "bg-[var(--adm-error-soft)] text-[var(--adm-error)] ring-[var(--adm-border)]" },
  seller: { label: "فروشنده", className: "bg-[var(--adm-warning-soft)] text-[var(--adm-warning)] ring-[var(--adm-border)]" },
  user: { label: "کاربر", className: "bg-[var(--adm-info-soft)] text-[var(--adm-info)] ring-[var(--adm-border)]" },
};

const SORT_OPTIONS = [
  { value: "latest", label: "آخرین ثبت‌نام" },
  { value: "oldest", label: "اولین ثبت‌نام" },
  { value: "admins_first", label: "مدیران ابتدا" },
  { value: "completed_profile", label: "پروفایل‌های تکمیل‌تر" },
];

const JALALI_DATE_FORMATTER = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
  year: "numeric",
  month: "long",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

const AVATAR_STYLES = [
  { bg: "var(--adm-primary-soft)", fg: "var(--adm-primary)" },
  { bg: "var(--adm-info-soft)", fg: "var(--adm-info)" },
  { bg: "var(--adm-success-soft)", fg: "var(--adm-success)" },
  { bg: "var(--adm-warning-soft)", fg: "var(--adm-warning)" },
  { bg: "var(--adm-error-soft)", fg: "var(--adm-error)" },
  { bg: "var(--adm-surface-2)", fg: "var(--adm-text)" },
];

function getDisplayName(user) {
  const fullName = [user?.firstName, user?.lastName]
    .map((item) => String(item || "").trim())
    .filter(Boolean)
    .join(" ");

  return fullName || user?.name || "کاربر بدون نام";
}

function getAvatarStyle(name) {
  const hash = String(name || "")
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);

  return AVATAR_STYLES[hash % AVATAR_STYLES.length];
}

function getRoleMeta(role) {
  const key = String(role || "user").toLowerCase();
  return ROLE_META[key] || ROLE_META.user;
}

function formatJalaliDate(value) {
  if (!value) return "ثبت نشده";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "ثبت نشده";

  return JALALI_DATE_FORMATTER.format(date);
}

function getProfileStatus(user) {
  const hasIdentity = Boolean(getDisplayName(user) && user?.phone);
  const hasAddress = Boolean(user?.province && user?.city && user?.address && user?.postalCode);
  const phoneVerified = Boolean(user?.phoneVerifiedAt);

  if (hasIdentity && hasAddress && phoneVerified) {
    return { label: "پروفایل تکمیل است", variant: "success" };
  }

  if (hasIdentity && phoneVerified) {
    return { label: "نیاز به تکمیل", variant: "warning" };
  }

  return { label: "ناقص", variant: "error" };
}

function filterVisibleUsers(list = []) {
  return list.filter((user) => !HIDDEN_ROLES.has(String(user?.role || "").toLowerCase()));
}

function buildPagination(currentPage, totalPages) {
  const total = Math.max(Number(totalPages || 1), 1);
  const current = Math.min(Math.max(Number(currentPage || 1), 1), total);

  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  const items = new Set([1, total, current, current - 1, current + 1]);

  if (current <= 3) {
    items.add(2);
    items.add(3);
    items.add(4);
  }

  if (current >= total - 2) {
    items.add(total - 1);
    items.add(total - 2);
    items.add(total - 3);
  }

  const sorted = [...items]
    .filter((item) => item >= 1 && item <= total)
    .sort((a, b) => a - b);

  return sorted.reduce((acc, item, index) => {
    if (index > 0 && item - sorted[index - 1] > 1) acc.push("...");
    acc.push(item);
    return acc;
  }, []);
}

function UserAvatar({ user, size = "md" }) {
  const name = getDisplayName(user);
  const style = getAvatarStyle(name);
  const sizes = {
    sm: "h-9 w-9 text-xs",
    md: "h-11 w-11 text-sm",
    lg: "h-12 w-12 text-base",
  };

  return (
    <div
      className={`${sizes[size] || sizes.md} shrink-0 rounded-2xl flex items-center justify-center font-bold`}
      style={{ background: style.bg, color: style.fg }}
      aria-hidden="true"
    >
      {name.charAt(0)}
    </div>
  );
}

function RoleBadge({ role }) {
  const meta = getRoleMeta(role);

  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-black ring-1 ${meta.className}`}>
      {meta.label}
    </span>
  );
}

function VerificationMark({ active, label }) {
  return (
    <span
      className={active ? "flex h-6 w-6 items-center justify-center rounded-full bg-[var(--adm-success-soft)] text-[var(--adm-success)]" : "flex h-6 w-6 items-center justify-center rounded-full bg-[var(--adm-error-soft)] text-[var(--adm-error)]"}
      title={label}
      aria-label={label}
    >
      {active ? <CheckCircle2 className="h-4 w-4" /> : <X className="h-4 w-4" />}
    </span>
  );
}

function ContactRows({ user }) {
  const rows = [
    {
      key: "phone",
      icon: Phone,
      value: user.phone || "-",
      muted: false,
      verified: Boolean(user.phoneVerifiedAt),
      label: user.phoneVerifiedAt ? "موبایل تایید شده" : "موبایل تایید نشده",
      dir: "ltr",
    },
    {
      key: "email",
      icon: Mail,
      value: user.email || "ایمیل ثبت نشده",
      muted: !user.email,
      verified: Boolean(user.email && user.emailVerifiedAt),
      label: user.emailVerifiedAt ? "ایمیل تایید شده" : "ایمیل تایید نشده",
      dir: user.email ? "ltr" : "rtl",
    },
  ];

  return (
    <div className="space-y-2 text-sm">
      {rows.map((row) => {
        const Icon = row.icon;
        return (
          <div key={row.key} className="grid grid-cols-[18px_minmax(0,1fr)_26px] items-center gap-2">
            <Icon className="h-4 w-4 text-[var(--adm-text-muted)]" />
            <span
              dir={row.dir}
              className={row.muted ? "min-w-0 truncate text-[var(--adm-text-muted)]" : "min-w-0 truncate text-[var(--adm-text)]"}
              title={String(row.value || "")}
            >
              {row.value}
            </span>
            <VerificationMark active={row.verified} label={row.label} />
          </div>
        );
      })}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, hint, variant = "primary" }) {
  const tones = {
    primary: "bg-[var(--adm-primary-soft)] text-[var(--adm-primary)]",
    success: "bg-[var(--adm-success-soft)] text-[var(--adm-success)]",
    info: "bg-[var(--adm-info-soft)] text-[var(--adm-info)]",
    warning: "bg-[var(--adm-warning-soft)] text-[var(--adm-warning)]",
  };

  return (
    <AdminCard className="overflow-hidden">
      <AdminCardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-[var(--adm-text-muted)]">{label}</p>
            <p className="mt-2 text-2xl font-black text-[var(--adm-text)]">{value}</p>
            {hint ? <p className="mt-1 text-xs text-[var(--adm-text-muted)]">{hint}</p> : null}
          </div>
          <div className={`h-11 w-11 rounded-2xl flex items-center justify-center ${tones[variant] || tones.primary}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </AdminCardContent>
    </AdminCard>
  );
}

function EmptyState({ activeSearch, onClearSearch }) {
  return (
    <div className="py-16 text-center">
      <div className="mx-auto mb-4 h-14 w-14 rounded-2xl bg-[var(--adm-surface-2)] text-[var(--adm-text-muted)] flex items-center justify-center">
        <Users className="h-7 w-7" />
      </div>
      <h3 className="text-base font-bold text-[var(--adm-text)]">
        {activeSearch ? "نتیجه‌ای پیدا نشد" : "هنوز کاربری برای نمایش وجود ندارد"}
      </h3>
      <p className="mt-2 text-sm text-[var(--adm-text-muted)]">
        {activeSearch
          ? "عبارت جستجو را تغییر دهید یا جستجو را پاک کنید."
          : "بعد از ثبت‌نام کاربران، اطلاعات آن‌ها اینجا نمایش داده می‌شود."}
      </p>
      {activeSearch ? (
        <AdminButton className="mt-5" variant="secondary" onClick={onClearSearch} leftIcon={X}>
          پاک کردن جستجو
        </AdminButton>
      ) : null}
    </div>
  );
}

function UsersDesktopTable({ users, onAction }) {
  return (
    <AdminTableShell className="hidden lg:block rounded-none border-0">
      <AdminTable>
        <AdminTHead className="sticky top-0 z-10">
          <tr>
            <AdminTH className="min-w-[260px]">کاربر</AdminTH>
            <AdminTH>اطلاعات تماس</AdminTH>
            <AdminTH>نقش</AdminTH>
            <AdminTH>تاریخ ثبت‌نام</AdminTH>
            <AdminTH>وضعیت پروفایل</AdminTH>
            <AdminTH className="text-center">عملیات</AdminTH>
          </tr>
        </AdminTHead>
        <tbody>
          {users.map((user) => {
            const profile = getProfileStatus(user);
            const name = getDisplayName(user);

            return (
              <AdminTR key={user._id || user.id} interactive className="last:border-b-0">
                <AdminTD>
                  <div className="flex items-center gap-3">
                    <UserAvatar user={user} />
                    <div className="min-w-0">
                      <p className="max-w-[220px] truncate font-bold text-[var(--adm-text)]" title={name}>
                        {name}
                      </p>
                    </div>
                  </div>
                </AdminTD>
                <AdminTD>
                  <ContactRows user={user} />
                </AdminTD>
                <AdminTD>
                  <RoleBadge role={user.role} />
                </AdminTD>
                <AdminTD>
                  <div className="inline-flex items-center gap-2 rounded-2xl bg-[var(--adm-surface-2)] px-3 py-2 text-xs font-bold text-[var(--adm-text)]">
                    <CalendarDays className="h-4 w-4 text-[var(--adm-text-muted)]" />
                    <span dir="rtl">{formatJalaliDate(user.createdAt)}</span>
                  </div>
                </AdminTD>
                <AdminTD>
                  <AdminBadge variant={profile.variant}>{profile.label}</AdminBadge>
                </AdminTD>
                <AdminTD>
                  <div className="flex items-center justify-center gap-1">
                    <AdminIconButton className="cursor-pointer" intent="info" label="مشاهده" onClick={() => onAction(user, "view")}>
                      <Eye className="h-5 w-5" />
                    </AdminIconButton>
                    <AdminIconButton className="cursor-pointer" intent="primary" label="ویرایش" onClick={() => onAction(user, "edit")}>
                      <Pencil className="h-5 w-5" />
                    </AdminIconButton>
                    <AdminIconButton className="cursor-pointer" intent="danger" label="حذف" onClick={() => onAction(user, "delete")}>
                      <Trash2 className="h-5 w-5" />
                    </AdminIconButton>
                  </div>
                </AdminTD>
              </AdminTR>
            );
          })}
        </tbody>
      </AdminTable>
    </AdminTableShell>
  );
}

function UsersMobileList({ users, onAction }) {
  return (
    <div className="grid gap-3 p-4 lg:hidden">
      {users.map((user) => {
        const profile = getProfileStatus(user);
        const name = getDisplayName(user);

        return (
          <div
            key={user._id || user.id}
            className="rounded-2xl border border-[color:var(--adm-border)] bg-[var(--adm-surface)] p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <UserAvatar user={user} />
                <div className="min-w-0">
                  <p className="truncate font-bold text-[var(--adm-text)]" title={name}>
                    {name}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <RoleBadge role={user.role} />
                    <AdminBadge variant={profile.variant}>{profile.label}</AdminBadge>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-3 rounded-2xl bg-[var(--adm-surface-2)] p-3 text-sm">
              <ContactRows user={user} />
              <div className="flex items-center gap-2 border-t border-[color:var(--adm-border)] pt-3 text-xs font-bold text-[var(--adm-text-muted)]">
                <CalendarDays className="h-4 w-4" />
                <span>ثبت‌نام: {formatJalaliDate(user.createdAt)}</span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              <AdminButton variant="secondary" size="sm" onClick={() => onAction(user, "view")} leftIcon={Eye}>
                مشاهده
              </AdminButton>
              <AdminButton variant="primary" size="sm" onClick={() => onAction(user, "edit")} leftIcon={Pencil}>
                ویرایش
              </AdminButton>
              <AdminButton variant="danger" size="sm" onClick={() => onAction(user, "delete")} leftIcon={Trash2}>
                حذف
              </AdminButton>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function AllUsersPage() {
  const [sortMode, setSortMode] = useState("latest");
  const queryParams = useMemo(() => ({ sort: sortMode }), [sortMode]);
  const {
    data: users,
    isLoading,
    page,
    setPage,
    totalPages,
    totalCount,
    refreshData,
  } = usePaginatedFetchHook(backApis.allUsers.url, queryParams);

  const [searchTerm, setSearchTerm] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("view");

  const visibleUsers = useMemo(() => filterVisibleUsers(users || []), [users]);
  const visibleSearchResults = useMemo(() => filterVisibleUsers(searchResults || []), [searchResults]);
  const displayedUsers = activeSearch ? visibleSearchResults : visibleUsers;

  const stats = useMemo(() => {
    const currentList = activeSearch ? visibleSearchResults : visibleUsers;
    const admins = currentList.filter((user) => String(user.role || "").toLowerCase() === "admin").length;
    const completedProfiles = currentList.filter((user) => getProfileStatus(user).variant === "success").length;

    return {
      total: activeSearch ? visibleSearchResults.length : totalCount || visibleUsers.length,
      pageUsers: currentList.length,
      admins,
      completedProfiles,
    };
  }, [activeSearch, totalCount, visibleSearchResults, visibleUsers]);

  const paginationPages = useMemo(() => buildPagination(page, totalPages), [page, totalPages]);
  const isBusy = isLoading || isSearching;

  const handleOpenModal = (user, mode) => {
    setSelectedUser(user);
    setModalMode(mode);
    setUserModalOpen(true);
  };

  const runSearch = async (query, selectedSort = sortMode) => {
    const normalizedQuery = String(query || "").trim();

    if (!normalizedQuery) {
      setActiveSearch("");
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const { data } = await apiClient.get(backApis.searchUsers.url, {
        params: { q: normalizedQuery, sort: selectedSort },
      });

      setSearchResults(Array.isArray(data?.data) ? data.data : []);
      setActiveSearch(normalizedQuery);
    } catch (error) {
      toast.error(error?.response?.data?.message || "جستجو با خطا مواجه شد");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = async (event) => {
    event?.preventDefault();
    await runSearch(searchTerm, sortMode);
  };

  const handleSortChange = async (event) => {
    const nextSort = event.target.value;
    setSortMode(nextSort);
    setPage(1);

    if (activeSearch) {
      await runSearch(activeSearch, nextSort);
    }
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    setActiveSearch("");
    setSearchResults([]);
  };

  const handleRefresh = async () => {
    try {
      await refreshData();
      if (activeSearch) await runSearch(activeSearch, sortMode);
      toast.success("لیست کاربران بروزرسانی شد");
    } catch (error) {
      toast.error("بروزرسانی لیست کاربران انجام نشد");
    }
  };

  const handleUpdateUser = async (updatedUser) => {
    try {
      const { url, method } = backApis.updateUser(updatedUser._id);
      const { data } = await apiClient({ method, url, data: updatedUser });
      const nextUser = data?.data || updatedUser;

      setSearchResults((prev) =>
        prev.map((user) => (user._id === nextUser._id ? nextUser : user))
      );
      await refreshData();
      setUserModalOpen(false);
      toast.success("اطلاعات کاربر ذخیره شد");
    } catch (error) {
      toast.error(error?.response?.data?.message || "ویرایش کاربر انجام نشد");
      throw error;
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      const { url, method } = backApis.deleteUser(userId);
      await apiClient({ method, url });

      setSearchResults((prev) => prev.filter((user) => user._id !== userId));
      await refreshData();
      setUserModalOpen(false);
      toast.success("کاربر حذف شد");
    } catch (error) {
      toast.error(error?.response?.data?.message || "حذف کاربر انجام نشد");
      throw error;
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 py-6 md:py-8">
      <section className="overflow-hidden rounded-3xl border border-[color:var(--adm-border)] bg-[var(--adm-surface)] shadow-[0_20px_60px_var(--adm-shadow)]">
        <div className="relative p-5 md:p-7">
          <div className="absolute inset-x-0 top-0 h-1 bg-[var(--adm-primary)]" />
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-2xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[color:var(--adm-border)] bg-[var(--adm-surface-2)] px-3 py-1 text-xs font-bold text-[var(--adm-text-muted)]">
                <Users className="h-4 w-4" />
                مدیریت کاربران
              </div>
              <h1 className="text-2xl font-black text-[var(--adm-text)] md:text-4xl">
                کاربران سایت
              </h1>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <AdminButton
                variant="secondary"
                onClick={handleRefresh}
                loading={isLoading}
                leftIcon={RefreshCw}
                className="cursor-pointer"
              >
                بروزرسانی
              </AdminButton>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Users} label={activeSearch ? "نتایج جستجو" : "کل کاربران"} value={stats.total} hint={activeSearch || "بر اساس اطلاعات سرور"} />
        <StatCard icon={UserCheck} label="نمایش فعلی" value={stats.pageUsers} hint={activeSearch ? "در نتیجه جستجو" : `صفحه ${page} از ${totalPages || 1}`} variant="info" />
        <StatCard icon={ShieldCheck} label="مدیران" value={stats.admins} hint="در لیست فعلی" variant="warning" />
        <StatCard icon={CheckCircle2} label="پروفایل تکمیل" value={stats.completedProfiles} hint="نام، تماس و آدرس کامل" variant="success" />
      </section>

      <AdminCard elevated className="overflow-hidden">
        <div className="border-b border-[color:var(--adm-border)] bg-[var(--adm-surface-2)] p-4 md:p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="text-lg font-black text-[var(--adm-text)]">لیست کاربران</h2>
              <p className="mt-1 text-sm text-[var(--adm-text-muted)]">
                {activeSearch
                  ? `نمایش نتیجه برای «${activeSearch}»`
                  : "نمایش کاربران با صفحه‌بندی و عملیات سریع"}
              </p>
            </div>

            <div className="flex w-full flex-col gap-2 xl:max-w-3xl xl:flex-row">
              <label className="relative min-w-[190px]">
                <span className="sr-only">مرتب‌سازی کاربران</span>
                <AdminSelect
                  value={sortMode}
                  onChange={handleSortChange}
                  variant="filled"
                  className="h-11 pr-10"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </AdminSelect>
                <SlidersHorizontal className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--adm-text-muted)]" />
              </label>

              <form onSubmit={handleSearch} className="flex flex-1 flex-col gap-2 sm:flex-row">
                <div className="relative flex-1">
                <AdminInput
                  type="text"
                  placeholder="جستجو با نام، موبایل یا ایمیل..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="h-11 pr-11 pl-10"
                />
                <Search className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--adm-text-muted)]" />
                {searchTerm ? (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="absolute left-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-xl text-[var(--adm-text-muted)] hover:bg-[var(--adm-surface-2)] hover:text-[var(--adm-text)]"
                    aria-label="پاک کردن جستجو"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
                <AdminButton type="submit" loading={isSearching} leftIcon={Search} className="cursor-pointer">
                  جستجو
                </AdminButton>
              </form>
            </div>
          </div>
        </div>

        <div className="relative min-h-[320px]">
          {isBusy ? (
            <div className="absolute inset-0 z-20 flex items-center justify-center backdrop-blur-[1px]"
              style={{ background: "color-mix(in srgb, var(--adm-overlay) 22%, transparent)" }}>
              <div className="rounded-2xl border border-[color:var(--adm-border)] bg-[var(--adm-surface)] px-5 py-4 shadow-[0_20px_60px_var(--adm-shadow)]">
                <div className="flex items-center gap-3 text-sm font-bold text-[var(--adm-text)]">
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-[color:var(--adm-primary)] border-t-transparent" />
                  در حال دریافت اطلاعات...
                </div>
              </div>
            </div>
          ) : null}

          {displayedUsers.length ? (
            <>
              <UsersDesktopTable users={displayedUsers} onAction={handleOpenModal} />
              <UsersMobileList users={displayedUsers} onAction={handleOpenModal} />
            </>
          ) : (
            <EmptyState activeSearch={Boolean(activeSearch)} onClearSearch={handleClearSearch} />
          )}
        </div>

        {!activeSearch && displayedUsers.length ? (
          <div className="flex flex-col items-center justify-between gap-4 border-t border-[color:var(--adm-border)] bg-[var(--adm-surface)] p-4 sm:flex-row">
            <p className="text-sm text-[var(--adm-text-muted)]">
              نمایش <span className="font-bold text-[var(--adm-text)]">{displayedUsers.length}</span> کاربر در این صفحه از مجموع{" "}
              <span className="font-bold text-[var(--adm-text)]">{totalCount || displayedUsers.length}</span>
            </p>

            <div className="flex items-center gap-2">
              <AdminIconButton
                className="cursor-pointer"
                label="صفحه قبل"
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page === 1}
              >
                <ArrowRight className="h-5 w-5" />
              </AdminIconButton>

              <div className="flex items-center gap-1">
                {paginationPages.map((item, index) =>
                  item === "..." ? (
                    <span key={`gap-${index}`} className="px-2 text-[var(--adm-text-muted)]">
                      ...
                    </span>
                  ) : (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setPage(item)}
                      className={
                        page === item
                          ? "h-10 min-w-10 cursor-pointer rounded-xl bg-[var(--adm-primary)] px-3 text-sm font-black text-[var(--adm-on-primary)]"
                          : "h-10 min-w-10 cursor-pointer rounded-xl px-3 text-sm font-bold text-[var(--adm-text-muted)] hover:bg-[var(--adm-surface-2)] hover:text-[var(--adm-text)]"
                      }
                    >
                      {item}
                    </button>
                  )
                )}
              </div>

              <AdminIconButton
                className="cursor-pointer"
                intent="primary"
                label="صفحه بعد"
                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages || 1))}
                disabled={page === (totalPages || 1)}
              >
                <ArrowLeft className="h-5 w-5" />
              </AdminIconButton>
            </div>
          </div>
        ) : null}
      </AdminCard>

      <UserModal
        isOpen={userModalOpen}
        onClose={() => setUserModalOpen(false)}
        mode={modalMode}
        user={selectedUser}
        onUpdate={handleUpdateUser}
        onDelete={handleDeleteUser}
      />
    </div>
  );
}
