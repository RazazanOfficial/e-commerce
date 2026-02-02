"use client";

import Link from "next/link";

const noop = () => {};

const VAR_FALLBACKS = {
  primary: {
    bg: "var(--adm-primary, #1D4ED8)",
    bgHover: "var(--adm-primary-hover, #1E40AF)",
    text: "var(--adm-on-primary, #FFFFFF)",
    ring: "var(--adm-ring, rgba(37,99,235,0.45))",
  },
  danger: {
    bg: "var(--adm-error, #DC2626)",
    bgHover: "var(--adm-error, #B91C1C)",
    text: "#FFFFFF",
    ring: "rgba(220,38,38,0.45)",
  },
  neutral: {
    bg: "var(--adm-surface-2, #334155)",
    bgHover: "var(--adm-surface, #1F2937)",
    text: "var(--adm-text, #E5E7EB)",
    ring: "var(--adm-ring, rgba(148,163,184,0.35))",
  },
};

function mapVariant(variant) {
  switch ((variant || "").toLowerCase()) {
    case "red":
      return "danger";
    case "gray":
      return "neutral";
    case "blue":
    default:
      return "primary";
  }
}

function baseClasses({ disabled }) {
  return [
    "inline-flex items-center justify-center gap-2",
    "px-4 py-2 rounded-xl",
    "text-sm font-medium",
    "transition-colors",
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--adm-bg)]",
    disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
  ].join(" ");
}

const Btn1 = ({
  text,
  btnClassName,
  onClick,
  onSubmit,
  type = "button",
  variant = "blue",
  disabled = false,
}) => {
  const kind = mapVariant(variant);
  const v = VAR_FALLBACKS[kind];

  return (
    <button
      type={type}
      onClick={onClick || noop}
      onSubmit={onSubmit || noop}
      disabled={disabled}
      className={`${baseClasses({ disabled })} ${btnClassName || ""}`}
      style={{
        backgroundColor: v.bg,
        color: v.text,
      }}
      onMouseEnter={(e) => {
        if (disabled) return;
        e.currentTarget.style.backgroundColor = v.bgHover;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = v.bg;
      }}
      onFocus={(e) => {
        e.currentTarget.style.boxShadow = `0 0 0 3px ${v.ring}`;
      }}
      onBlur={(e) => {
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {text}
    </button>
  );
};

const Link1 = ({ text, href, btnClassName }) => {
  const v = VAR_FALLBACKS.primary;
  return (
    <Link
      href={href}
      className={`${baseClasses({ disabled: false })} ${btnClassName || ""}`}
      style={{ backgroundColor: v.bg, color: v.text }}
    >
      {text}
    </Link>
  );
};

export { Btn1, Link1 };
