interface LogoProps {
  size?: number;
  className?: string;
  variant?: "light" | "dark";
  showWordmark?: boolean;
}

/**
 * Geometric stylized sunflower — clean straight petals, no decorative flourish.
 */
export function Logo({ size = 40, className, variant = "dark", showWordmark = false }: LogoProps) {
  const word = variant === "light" ? "text-brand-cream" : "text-brand-brown";
  return (
    <span className={`inline-flex items-center gap-3 ${className ?? ""}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        aria-hidden="true"
        role="img"
      >
        {Array.from({ length: 12 }).map((_, i) => (
          <rect
            key={i}
            x="22.5"
            y="2"
            width="3"
            height="13"
            rx="1.5"
            fill="var(--brand-salmon)"
            transform={`rotate(${i * 30} 24 24)`}
          />
        ))}
        <circle cx="24" cy="24" r="9" fill="var(--brand-orange-dark)" />
        <circle cx="24" cy="24" r="4.5" fill="var(--brand-brown)" />
      </svg>
      {showWordmark && (
        <span className={`font-display text-2xl font-extrabold tracking-tight ${word}`}>
          Lire
        </span>
      )}
    </span>
  );
}
