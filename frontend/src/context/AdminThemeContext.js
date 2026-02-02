"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { ADMIN_PALETTES, ADMIN_PALETTE_KEYS } from "@/theme/adminPalettes";

const STORAGE_KEY = "admin_palette_key";

export const AdminThemeContext = createContext(null);

export function AdminThemeProvider({ children, defaultPalette = "paletteA" }) {
  const [paletteKey, setPaletteKey] = useState(defaultPalette);

  // Load saved palette.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && ADMIN_PALETTES[saved]) setPaletteKey(saved);
    } catch {
      // ignore
    }
  }, []);

  // Mark admin scope for CSS tokens.
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.scope = "admin";

    return () => {
      // Cleanup when leaving /admin-panel routes
      delete root.dataset.scope;
      delete root.dataset.palette;
    };
  }, []);

  // Apply palette.
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.palette = paletteKey;
    try {
      localStorage.setItem(STORAGE_KEY, paletteKey);
    } catch {
      // ignore
    }
  }, [paletteKey]);

  const value = useMemo(
    () => ({
      paletteKey,
      setPaletteKey,
      palettes: ADMIN_PALETTES,
      paletteKeys: ADMIN_PALETTE_KEYS,
    }),
    [paletteKey]
  );

  return (
    <AdminThemeContext.Provider value={value}>
      {children}
    </AdminThemeContext.Provider>
  );
}

export function useAdminTheme() {
  const ctx = useContext(AdminThemeContext);
  if (!ctx) {
    throw new Error("useAdminTheme must be used within <AdminThemeProvider>");
  }
  return ctx;
}
