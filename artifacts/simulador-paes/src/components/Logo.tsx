interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  variant?: "default" | "white";
}

const SIZE_MAP = {
  sm: { circle: 32, gap: "gap-2", title: "text-base", subtitle: "text-[9px]", letterOffset: 0.32 },
  md: { circle: 44, gap: "gap-2.5", title: "text-xl", subtitle: "text-[10px]", letterOffset: 0.32 },
  lg: { circle: 60, gap: "gap-3", title: "text-3xl", subtitle: "text-xs", letterOffset: 0.32 },
  xl: { circle: 96, gap: "gap-4", title: "text-5xl sm:text-6xl", subtitle: "text-sm sm:text-base", letterOffset: 0.32 },
};

export function Logo({ size = "md", showText = true, variant = "default" }: LogoProps) {
  const s = SIZE_MAP[size];
  const isWhite = variant === "white";

  // Brand colors
  const brandBlue = "#2BA6E0";
  const brandBlueDark = "#1B7FB8";
  const ringId = `ring-${size}-${variant}`;
  const sparkleId = `spark-${size}-${variant}`;

  // Foreground colors for the M and outer badge depending on context
  const badgeFill = isWhite ? "#ffffff" : brandBlue;
  const badgeStroke = isWhite ? "#ffffff" : brandBlueDark;
  const mFill = isWhite ? brandBlue : "#ffffff";
  const sparkleFill = isWhite ? "#ffffff" : "#ffffff";

  return (
    <div className={`flex items-center ${s.gap}`}>
      <svg
        viewBox="0 0 100 100"
        width={s.circle}
        height={s.circle}
        className="drop-shadow-sm"
        aria-hidden
      >
        <defs>
          <radialGradient id={ringId} cx="50%" cy="40%" r="65%">
            <stop offset="0%" stopColor={isWhite ? "#ffffff" : "#5BC0EE"} />
            <stop offset="60%" stopColor={badgeFill} />
            <stop offset="100%" stopColor={isWhite ? "#E8F5FC" : brandBlueDark} />
          </radialGradient>
          <linearGradient id={sparkleId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={sparkleFill} stopOpacity="0.95" />
            <stop offset="100%" stopColor={sparkleFill} stopOpacity="0.4" />
          </linearGradient>
        </defs>

        {/* Outer subtle ring */}
        <circle
          cx="50"
          cy="50"
          r="48"
          fill="none"
          stroke={badgeStroke}
          strokeOpacity={isWhite ? 0.25 : 0.18}
          strokeWidth="1.5"
        />

        {/* Main badge */}
        <circle cx="50" cy="50" r="44" fill={`url(#${ringId})`} />

        {/* Inner highlight */}
        <ellipse
          cx="50"
          cy="32"
          rx="28"
          ry="14"
          fill="#ffffff"
          opacity={isWhite ? 0.5 : 0.18}
        />

        {/* The "M" mark — geometric, custom path so it always looks crisp */}
        <path
          d="M28 70 L28 32 L40 32 L50 50 L60 32 L72 32 L72 70 L62 70 L62 48 L53 64 L47 64 L38 48 L38 70 Z"
          fill={mFill}
        />

        {/* Sparkle decoration to convey "PAES / brillo" */}
        <path
          d="M78 22 L80.5 27 L85.5 29.5 L80.5 32 L78 37 L75.5 32 L70.5 29.5 L75.5 27 Z"
          fill={`url(#${sparkleId})`}
          opacity="0.95"
        />
      </svg>

      {showText && (
        <div className="leading-none">
          <div
            className={`font-black tracking-tight ${s.title} ${isWhite ? "text-white" : "text-foreground"}`}
            style={{ letterSpacing: "-0.02em" }}
          >
            <span>AT</span>
            <span className="ml-1.5" style={{ color: isWhite ? "#ffffff" : brandBlue }}>
              21
            </span>
          </div>
          <div
            className={`mt-1 ${s.subtitle} font-semibold tracking-[0.25em] uppercase ${
              isWhite ? "text-sky-100" : "text-muted-foreground"
            }`}
          >
            Preuniversitario
          </div>
        </div>
      )}
    </div>
  );
}
