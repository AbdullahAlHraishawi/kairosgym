import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";
import type { Character } from "@/lib/characters";
import { useCharacterBanner } from "@/hooks/use-character-banner";

interface CharacterBannerProps {
  character: Character | null;
  className?: string;
  showChooseCta?: boolean;
}

export function CharacterBanner({
  character,
  className,
  showChooseCta = true,
}: CharacterBannerProps) {
  const { layerA, layerB, fadeMs } = useCharacterBanner(character?.banners ?? []);

  if (!character || (!layerA.src && !layerB.src)) {
    return (
      <div
        className={cn(
          "relative w-full overflow-hidden rounded-2xl",
          "bg-gradient-to-br from-secondary/60 via-background to-primary/15",
          className,
        )}
        style={{ height: "clamp(180px, 28vw, 240px)" }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 30% 30%, oklch(0.58 0.19 25 / 0.18), transparent 60%)",
          }}
        />
        {showChooseCta && (
          <Link
            to="/profile"
            className="press absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 text-center"
          >
            <Sparkles className="text-primary h-6 w-6" />
            <div className="text-foreground text-sm font-bold uppercase tracking-[0.2em]">
              Choose your warrior
            </div>
            <div className="text-[11px] text-muted-foreground">
              Tap to set your identity →
            </div>
          </Link>
        )}
      </div>
    );
  }

  const layerStyle = (visible: boolean): React.CSSProperties => ({
    opacity: visible ? 1 : 0,
    transitionProperty: "opacity",
    transitionDuration: `${fadeMs}ms`,
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    objectPosition: "center",
  });

  return (
    <div
      className={cn("relative w-full overflow-hidden rounded-2xl", className)}
      style={{ height: "clamp(180px, 28vw, 240px)" }}
    >
      {layerA.src && (
        <img
          src={layerA.src}
          alt=""
          aria-hidden
          loading="eager"
          className="absolute inset-0 h-full w-full object-cover"
          style={layerStyle(layerA.visible)}
        />
      )}
      {layerB.src && (
        <img
          src={layerB.src}
          alt=""
          aria-hidden
          loading="eager"
          className="absolute inset-0 h-full w-full object-cover"
          style={layerStyle(layerB.visible)}
        />
      )}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, oklch(0.18 0.01 260 / 0.15) 0%, transparent 35%, oklch(0.18 0.01 260 / 0.55) 80%, oklch(0.18 0.01 260 / 0.92) 100%)",
        }}
      />
    </div>
  );
}
