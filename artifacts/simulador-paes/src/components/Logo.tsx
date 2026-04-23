interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  variant?: "default" | "white";
}

const SIZE_MAP = {
  sm: { circle: "w-8 h-8", letter: "text-base", title: "text-base", subtitle: "text-[9px]" },
  md: { circle: "w-10 h-10", letter: "text-xl", title: "text-lg", subtitle: "text-[10px]" },
  lg: { circle: "w-14 h-14", letter: "text-3xl", title: "text-2xl", subtitle: "text-xs" },
};

export function Logo({ size = "md", showText = true, variant = "default" }: LogoProps) {
  const s = SIZE_MAP[size];
  const isWhite = variant === "white";

  return (
    <div className="flex items-center gap-2">
      <div
        className={`${s.circle} rounded-full flex items-center justify-center font-black shadow-md ${
          isWhite ? "bg-white text-primary" : "bg-primary text-white"
        }`}
        aria-hidden
      >
        <span className={`${s.letter} leading-none -mt-0.5`}>M</span>
      </div>
      {showText && (
        <div className="leading-tight">
          <div className={`font-black tracking-tight ${s.title} ${isWhite ? "text-white" : "text-foreground"}`}>
            <span>AT</span>
            <span className="ml-1 text-primary">21</span>
          </div>
          <div className={`${s.subtitle} font-medium tracking-widest uppercase ${isWhite ? "text-sky-100" : "text-muted-foreground"}`}>
            Preuniversitario
          </div>
        </div>
      )}
    </div>
  );
}
