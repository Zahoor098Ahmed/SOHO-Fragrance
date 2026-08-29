interface BottleProps {
  bottleColor: string;
  capColor: string;
  liquidColor: string;
  size?: number;
  className?: string;
  animate?: boolean;
}

export default function BottleVisual({
  bottleColor,
  capColor,
  liquidColor,
  size = 200,
  className = "",
  animate = false,
}: BottleProps) {
  const w = size * 0.5;
  const h = size;
  const id = `bottle-${Math.random().toString(36).slice(2)}`;

  return (
    <svg
      viewBox="0 0 100 200"
      width={w}
      height={h}
      className={`${animate ? "animate-float" : ""} ${className}`}
      style={{ filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.3))" }}
      role="img"
      aria-label="SOHO Fragrance perfume bottle"
    >
      <defs>
        <linearGradient id={`${id}-body`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={bottleColor} stopOpacity="0.9" />
          <stop offset="30%" stopColor={bottleColor} />
          <stop offset="70%" stopColor={bottleColor} />
          <stop offset="100%" stopColor={bottleColor} stopOpacity="0.7" />
        </linearGradient>
        <linearGradient id={`${id}-liquid`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={liquidColor} stopOpacity="0.6" />
          <stop offset="100%" stopColor={liquidColor} stopOpacity="0.9" />
        </linearGradient>
        <linearGradient id={`${id}-cap`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={capColor} />
          <stop offset="50%" stopColor="#F0E4C8" />
          <stop offset="100%" stopColor={capColor} />
        </linearGradient>
        <linearGradient id={`${id}-reflect`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="white" stopOpacity="0" />
          <stop offset="30%" stopColor="white" stopOpacity="0.18" />
          <stop offset="50%" stopColor="white" stopOpacity="0.08" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Cap */}
      <rect x="32" y="8" width="36" height="26" rx="3" fill={`url(#${id}-cap)`} />
      <rect x="34" y="8" width="4" height="26" rx="1" fill="white" fillOpacity="0.2" />

      {/* Neck */}
      <rect x="40" y="32" width="20" height="18" fill={bottleColor} />
      <rect x="40" y="32" width="3" height="18" fill="white" fillOpacity="0.12" />

      {/* Collar */}
      <rect x="28" y="48" width="44" height="6" rx="1" fill={capColor} />

      {/* Body */}
      <rect x="16" y="52" width="68" height="132" rx="4" fill={`url(#${id}-body)`} />

      {/* Liquid */}
      <rect x="18" y="80" width="64" height="100" rx="2" fill={`url(#${id}-liquid)`} />

      {/* Glass reflection left */}
      <rect x="19" y="54" width="7" height="128" rx="2" fill={`url(#${id}-reflect)`} />

      {/* Subtle top highlight */}
      <rect x="16" y="52" width="68" height="8" rx="4" fill="white" fillOpacity="0.08" />

      {/* Bottom shadow */}
      <rect x="16" y="176" width="68" height="8" rx="4" fill="black" fillOpacity="0.08" />

      {/* Label area */}
      <rect x="22" y="100" width="56" height="50" rx="2" fill="white" fillOpacity="0.06" stroke="white" strokeOpacity="0.12" strokeWidth="0.5" />

      {/* SOHO text on label */}
      <text x="50" y="122" textAnchor="middle" fill="white" fillOpacity="0.7" fontSize="7" fontFamily="serif" letterSpacing="3" fontWeight="600">
        SOHO
      </text>
      <text x="50" y="133" textAnchor="middle" fill="white" fillOpacity="0.4" fontSize="3.5" fontFamily="sans-serif" letterSpacing="2">
        FRAGRANCE
      </text>
    </svg>
  );
}
