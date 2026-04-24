import logoUrl from "@assets/mat21_logo_v7.png";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  variant?: "default" | "white";
}

const SIZE_MAP = {
  sm: { img: "h-8" },
  md: { img: "h-10" },
  lg: { img: "h-14" },
  xl: { img: "h-44 sm:h-56 md:h-64" },
};

export function Logo({ size = "md", variant = "default" }: LogoProps) {
  const s = SIZE_MAP[size];
  const isWhite = variant === "white";

  return (
    <div className="flex items-center">
      <img
        src={logoUrl}
        alt="MAT 21 Preuniversitario"
        className={`${s.img} w-auto object-contain ${isWhite ? "brightness-0 invert" : ""}`}
        draggable={false}
      />
    </div>
  );
}
