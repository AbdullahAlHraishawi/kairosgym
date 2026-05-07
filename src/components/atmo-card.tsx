import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface AtmoCardProps {
  children: ReactNode;
  image?: string;
  imageOpacity?: number; // 0..1
  imagePosition?: string; // CSS object-position
  variant?: "premium" | "cinematic";
  glow?: boolean;
  className?: string;
}

export function AtmoCard({
  children,
  image,
  imageOpacity = 0.14,
  imagePosition = "center",
  variant = "premium",
  glow = false,
  className,
}: AtmoCardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl",
        variant === "premium" ? "card-premium" : "card-cinematic",
        glow && "animate-ember",
        className,
      )}
    >
      {image && (
        <>
          <img
            src={image}
            alt=""
            aria-hidden="true"
            loading="lazy"
            className="pointer-events-none absolute inset-0 h-full w-full object-cover"
            style={{ opacity: imageOpacity, objectPosition: imagePosition }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, transparent 0%, oklch(0.18 0.01 260 / 0.5) 70%, oklch(0.18 0.01 260 / 0.85) 100%)",
            }}
          />
        </>
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
