"use client";

import { useAdminTheme } from "@/context/AdminThemeContext";
import { useTheme } from "next-themes";
import { Check, Moon, Sun, Laptop } from "lucide-react";

function ModeButton({ active, icon: Icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl border transition"
      style={{
        background: active ? "var(--adm-primary-soft)" : "var(--adm-surface)",
        borderColor: active ? "var(--adm-primary)" : "var(--adm-border)",
        color: active ? "var(--adm-text)" : "var(--adm-text-muted)",
      }}
      onMouseEnter={(e) => {
        if (active) return;
        e.currentTarget.style.background = "var(--adm-surface-2)";
        e.currentTarget.style.color = "var(--adm-text)";
      }}
      onMouseLeave={(e) => {
        if (active) return;
        e.currentTarget.style.background = "var(--adm-surface)";
        e.currentTarget.style.color = "var(--adm-text-muted)";
      }}
    >
      <Icon className="w-4 h-4" />
      <span className="text-sm font-semibold">{label}</span>
    </button>
  );
}

function SwatchRow({ label, colors }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-12 text-xs" style={{ color: "var(--adm-text-muted)" }}>
        {label}
      </div>
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
      onClick={onSelect}
      className="w-full text-right rounded-2xl border p-4 transition"
      style={{
        background: "var(--adm-surface)",
        borderColor: active ? "var(--adm-primary)" : "var(--adm-border)",
        boxShadow: active ? `0 0 0 3px var(--adm-ring)` : "none",
      }}
      onMouseEnter={(e) => {
        if (active) return;
        e.currentTarget.style.background = "var(--adm-surface-2)";
      }}
      onMouseLeave={(e) => {
        if (active) return;
        e.currentTarget.style.background = "var(--adm-surface)";
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="font-bold" style={{ color: "var(--adm-text)" }}>
              {palette.label}
            </div>
            <span
              className="text-xs px-2 py-0.5 rounded-lg border"
              style={{
                borderColor: "var(--adm-border)",
                color: "var(--adm-text-muted)",
              }}
            >
              {paletteKey}
            </span>
          </div>
          <div className="mt-1 text-sm" style={{ color: "var(--adm-text-muted)" }}>
            پس‌زمینه، سرفیس‌ها، پرایمری، اینفو، ساکسس
          </div>
        </div>

        {active && (
          <div
            className="h-8 w-8 rounded-xl flex items-center justify-center"
            style={{ background: "var(--adm-primary)", color: "var(--adm-on-primary)" }}
            title="فعال"
          >
            <Check className="w-5 h-5" />
          </div>
        )}
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
      <div
        className="rounded-2xl p-5"
        style={{
          background: "var(--adm-surface)",
          border: "1px solid var(--adm-border)",
          boxShadow: "0 20px 60px var(--adm-shadow)",
        }}
      >
        <h1 className="text-2xl font-bold" style={{ color: "var(--adm-text)" }}>
          تنظیمات پنل
        </h1>
        <p className="mt-1" style={{ color: "var(--adm-text-muted)" }}>
          انتخاب پالت رنگی و حالت نمایش (Light / Dark)
        </p>
      </div>

      <div
        className="rounded-2xl p-5"
        style={{ background: "var(--adm-surface)", border: "1px solid var(--adm-border)" }}
      >
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="font-bold" style={{ color: "var(--adm-text)" }}>
              حالت نمایش
            </div>
            <div className="text-sm" style={{ color: "var(--adm-text-muted)" }}>
              وضعیت فعلی: {activeTheme}
            </div>
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <ModeButton
              active={theme === "light"}
              icon={Sun}
              label="Light"
              onClick={() => setTheme("light")}
            />
            <ModeButton
              active={theme === "dark"}
              icon={Moon}
              label="Dark"
              onClick={() => setTheme("dark")}
            />
            <ModeButton
              active={theme === "system"}
              icon={Laptop}
              label="System"
              onClick={() => setTheme("system")}
            />
          </div>
        </div>
      </div>

      <div
        className="rounded-2xl p-5"
        style={{ background: "var(--adm-surface)", border: "1px solid var(--adm-border)" }}
      >
        <div className="mb-4">
          <div className="font-bold" style={{ color: "var(--adm-text)" }}>
            پالت رنگی
          </div>
          <div className="text-sm" style={{ color: "var(--adm-text-muted)" }}>
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
      </div>
    </div>
  );
}
