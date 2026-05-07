import flame from "@/assets/badge-flame.png";
import skull from "@/assets/badge-skull.png";
import shield from "@/assets/badge-shield.png";
import crown from "@/assets/badge-crown.png";
import sword from "@/assets/badge-sword.png";
import trophy from "@/assets/badge-trophy.png";
import { cn } from "@/lib/utils";

const MAP: Record<string, string> = {
  flame,
  zap: flame,
  skull,
  shield,
  crown,
  sword,
  swords: sword,
  trophy,
};

interface BadgeEmblemProps {
  icon: string;
  size?: number;
  locked?: boolean;
  className?: string;
}

export function BadgeEmblem({ icon, size = 56, locked = false, className }: BadgeEmblemProps) {
  const src = MAP[icon] ?? trophy;
  return (
    <img
      src={src}
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      loading="lazy"
      className={cn(
        "metallic-emblem object-contain",
        locked && "grayscale opacity-40",
        className,
      )}
      style={{ width: size, height: size }}
    />
  );
}
