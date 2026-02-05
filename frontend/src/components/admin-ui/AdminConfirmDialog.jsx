"use client";

import { AdminModal } from "./AdminModal";
import { AdminButton } from "./AdminButton";

export function AdminConfirmDialog({
  open,
  onClose,
  title = "تأیید عملیات",
  description,
  confirmLabel = "تأیید",
  cancelLabel = "انصراف",
  confirmVariant = "danger",
  loading = false,
  onConfirm,
}) {
  return (
    <AdminModal
      open={open}
      onClose={onClose}
      size="sm"
      title={title}
      description={description}
      footer={
        <div className="flex items-center justify-end gap-2">
          <AdminButton variant="secondary" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </AdminButton>
          <AdminButton
            variant={confirmVariant}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </AdminButton>
        </div>
      }
    >
      <div className="text-sm text-[var(--adm-text)]">
        آیا مطمئن هستید؟
      </div>
    </AdminModal>
  );
}
