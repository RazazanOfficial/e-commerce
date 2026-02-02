"use client";

import { useAdminTheme } from "@/context/AdminThemeContext";
import { useTheme } from "next-themes";
import { Check, Laptop, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AdminButton,
  AdminCard,
  AdminCardContent,
  AdminCardDescription,
  AdminCardTitle,
} from "@/components/admin-ui";

function SwatchRow({ label, colors }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-12 text-xs text-[var(--adm-text-muted)]">{label}</div>
      <div className="flex-1 grid grid-cols-6 gap-2">
        {colors.map((c, idx) => (
          <div
            key={`${label}-${idx}`}
            className="h-8 rounded-lg border"
            style={{ background: c, borderColor: "rgba(0,0,0,0.08)" }}
            title={c}
          />
        ))}
      </div>
    </div>
  );
}

function PaletteCard({ paletteKey, palette, active, onSelect }) {
  const light = palette.light;
  const dark = palette.dark;

  const lightRow = [
    light.background,
    light.surface,
    light.surface2,
    light.primary,
    light.info,
    light.success,
  ];

  const darkRow = [
    dark.background,
    dark.surface,
    dark.surface2,
    dark.primary,
    dark.info,
    dark.success,
  ];

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full text-right rounded-2xl border p-4 transition",
        "bg-[var(--adm-surface)] border-[color:var(--adm-border)] hover:bg-[var(--adm-surface-2)]",
        active ? "border-[color:var(--adm-primary)] ring-2 ring-[color:var(--adm-ring)]" : ""
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="font-bold text-[var(--adm-text)]">{palette.label}</div>
            <span className="text-xs px-2 py-0.5 rounded-lg border border-[color:var(--adm-border)] text-[var(--adm-text-muted)]">
              {paletteKey}
            </span>
          </div>
          <div className="mt-1 text-sm text-[var(--adm-text-muted)]">
            پس‌زمینه، سرفیس‌ها، پرایمری، اینفو، ساکسس
          </div>
        </div>

        {active ? (
          <div
            className="h-8 w-8 rounded-xl flex items-center justify-center bg-[var(--adm-primary)] text-[var(--adm-on-primary)]"
            title="فعال"
          >
            <Check className="w-5 h-5" />
          </div>
        ) : null}
      </div>

      <div className="mt-4 space-y-2">
        <SwatchRow label="Light" colors={lightRow} />
        <SwatchRow label="Dark" colors={darkRow} />
      </div>
    </button>
  );
}

export default function AdminSettingsPage() {
  const { paletteKey, setPaletteKey, palettes } = useAdminTheme();
  const { theme, setTheme, resolvedTheme } = useTheme();

  const activeTheme = theme === "system" ? resolvedTheme : theme;

  return (
    <div className="space-y-6">
      <AdminCard elevated>
        <AdminCardContent className="p-5">
          <AdminCardTitle className="text-2xl">تنظیمات پنل</AdminCardTitle>
          <AdminCardDescription>
            انتخاب پالت رنگی و حالت نمایش (Light / Dark / System)
          </AdminCardDescription>
        </AdminCardContent>
      </AdminCard>

      <AdminCard>
        <AdminCardContent className="p-5">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <div className="font-bold text-[var(--adm-text)]">حالت نمایش</div>
              <div className="text-sm text-[var(--adm-text-muted)]">
                وضعیت فعلی: {activeTheme}
              </div>
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              <AdminButton
                variant="secondary"
                className={cn(
                  "flex-1",
                  theme === "light"
                    ? "bg-[var(--adm-primary-soft)] border-[color:var(--adm-primary)] text-[var(--adm-text)]"
                    : ""
                )}
                onClick={() => setTheme("light")}
                leftIcon={Sun}
              >
                Light
              </AdminButton>
              <AdminButton
                variant="secondary"
                className={cn(
                  "flex-1",
                  theme === "dark"
                    ? "bg-[var(--adm-primary-soft)] border-[color:var(--adm-primary)] text-[var(--adm-text)]"
                    : ""
                )}
                onClick={() => setTheme("dark")}
                leftIcon={Moon}
              >
                Dark
              </AdminButton>
              <AdminButton
                variant="secondary"
                className={cn(
                  "flex-1",
                  theme === "system"
                    ? "bg-[var(--adm-primary-soft)] border-[color:var(--adm-primary)] text-[var(--adm-text)]"
                    : ""
                )}
                onClick={() => setTheme("system")}
                leftIcon={Laptop}
              >
                System
              </AdminButton>
            </div>
          </div>
        </AdminCardContent>
      </AdminCard>

      <AdminCard>
        <AdminCardContent className="p-5">
          <div className="mb-4">
            <div className="font-bold text-[var(--adm-text)]">پالت رنگی</div>
            <div className="text-sm text-[var(--adm-text-muted)]">
              انتخاب شما فقط روی پنل ادمین اثر دارد. (بعداً می‌توانیم اسم پالت را از API بخوانیم.)
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            {Object.entries(palettes).map(([key, pal]) => (
              <PaletteCard
                key={key}
                paletteKey={key}
                palette={pal}
                active={key === paletteKey}
                onSelect={() => setPaletteKey(key)}
              />
            ))}
          </div>
        </AdminCardContent>
      </AdminCard>
    </div>
  );
}
