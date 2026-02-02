"use client";

export default function Spinner({ inline = false, className = "" }) {
  const wrapperClass = inline
    ? `flex items-center justify-center ${className}`
    : `flex justify-center items-center min-h-screen ${className}`;

  // CSS var fallbacks keep Spinner readable outside admin scope.
  const bg = "var(--adm-bg, #0F172A)";
  const ringOuter = "var(--adm-primary, #6366F1)";
  const ringInner = "var(--adm-border, rgba(148,163,184,0.35))";

  return (
    <div className={wrapperClass} style={!inline ? { background: bg } : undefined}>
      <div className="relative w-16 h-16" aria-label="loading">
        {/* outer ring */}
        <div
          className="absolute inset-0 rounded-full border-4 border-t-transparent animate-spin"
          style={{ borderColor: ringOuter, borderTopColor: "transparent" }}
        />
        {/* inner ring */}
        <div
          className="absolute inset-2 rounded-full border-4 border-t-transparent animate-spin"
          style={{
            borderColor: ringInner,
            borderTopColor: "transparent",
            animationDirection: "reverse",
            animationDuration: "1s",
          }}
        />
      </div>
    </div>
  );
}
