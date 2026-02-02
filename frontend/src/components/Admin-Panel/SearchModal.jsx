"use client";

import { useEffect, useMemo, useState } from "react";
import { Eye, Edit, Trash2 } from "lucide-react";
import backApis from "@/common/inedx";
import axios from "axios";
import UserModal from "./UserModal";
import { cn } from "@/lib/utils";
import {
  AdminBadge,
  AdminIconButton,
  AdminModal,
  AdminTable,
  AdminTableShell,
  AdminTHead,
  AdminTD,
  AdminTH,
  AdminTR,
} from "@/components/admin-ui";

export default function SearchModal({
  users,
  isOpen,
  onClose,
  getUserAvatarColor,
  getRoleBadgeVariant,
  onUserUpdate,
  onUserDelete,
}) {
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionMode, setActionMode] = useState(null);
  const [searchResults, setSearchResults] = useState(users || []);

  useEffect(() => {
    setSearchResults(users || []);
  }, [users]);

  const title = useMemo(() => {
    const count = searchResults?.length || 0;
    return count ? `نتایج جستجو (${count})` : "نتایج جستجو";
  }, [searchResults]);

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
        prev.map((u) => (u._id === updated._id ? updated : u))
      );

      onUserUpdate?.(updated);
      setSelectedUser(null);
      setActionMode(null);
    } catch (error) {
      console.error("خطا در آپدیت کاربر:", error);
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      const { url, method } = backApis.deleteUser(userId);
      await axios({ method, url, withCredentials: true });

      setSearchResults((prev) => prev.filter((u) => u._id !== userId));
      onUserDelete?.(userId);

      setSelectedUser(null);
      setActionMode(null);
    } catch (error) {
      console.error("خطا در حذف کاربر:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <AdminModal
        open={isOpen}
        onClose={onClose}
        title={title}
        size="xl"
        description="نتایج جستجو کاربران"
      >
        {searchResults.length === 0 ? (
          <p className="text-center text-sm text-[var(--adm-text-muted)]">
            کاربری یافت نشد
          </p>
        ) : (
          <AdminTableShell className="max-h-[450px] overflow-y-auto">
            <AdminTable>
              <AdminTHead>
                <tr>
                  <AdminTH>نام</AdminTH>
                  <AdminTH>ایمیل</AdminTH>
                  <AdminTH>شماره موبایل</AdminTH>
                  <AdminTH>نقش</AdminTH>
                  <AdminTH>عملیات</AdminTH>
                </tr>
              </AdminTHead>
              <tbody>
                {searchResults.map((user) => (
                  <AdminTR key={user._id || user.id} interactive>
                    <AdminTD className="flex items-center gap-2">
                      {(() => {
                        const av = getUserAvatarColor?.(user.name || "کاربر");
                        const cls = typeof av === "string" ? av : "";
                        const style =
                          av && typeof av === "object"
                            ? { background: av.bg, color: av.fg }
                            : undefined;
                        return (
                          <div
                            className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs",
                              cls
                            )}
                            style={style}
                          >
                        {user.name?.charAt(0)}
                          </div>
                        );
                      })()}
                      <span className="text-[var(--adm-text)]">{user.name}</span>
                    </AdminTD>

                    <AdminTD className="text-[var(--adm-text-muted)]">
                      {user.email}
                    </AdminTD>

                    <AdminTD className="text-[var(--adm-text-muted)]">
                      {user.phone || "-"}
                    </AdminTD>

                    <AdminTD>
                      {/* backward compatibility: if parent passes a class-string, use it; otherwise use AdminBadge */}
                      {typeof getRoleBadgeVariant === "function" ? (
                        <span
                          className={`${getRoleBadgeVariant(
                            user.role
                          )} px-3 py-1 rounded-full text-xs font-semibold`}
                        >
                          {user.role === "admin" ? "مدیر" : user.role === "seller" ? "فروشنده" : "کاربر"}
                        </span>
                      ) : (
                        <AdminBadge variant="primary">
                          {user.role || "user"}
                        </AdminBadge>
                      )}
                    </AdminTD>

                    <AdminTD>
                      <div className="flex gap-1">
                        <AdminIconButton
                          intent="success"
                          label="مشاهده"
                          onClick={() => handleAction(user, "view")}
                        >
                          <Eye className="h-5 w-5" />
                        </AdminIconButton>
                        <AdminIconButton
                          intent="primary"
                          label="ویرایش"
                          onClick={() => handleAction(user, "edit")}
                        >
                          <Edit className="h-5 w-5" />
                        </AdminIconButton>
                        <AdminIconButton
                          intent="danger"
                          label="حذف"
                          onClick={() => handleAction(user, "delete")}
                        >
                          <Trash2 className="h-5 w-5" />
                        </AdminIconButton>
                      </div>
                    </AdminTD>
                  </AdminTR>
                ))}
              </tbody>
            </AdminTable>
          </AdminTableShell>
        )}
      </AdminModal>

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
    </>
  );
}
