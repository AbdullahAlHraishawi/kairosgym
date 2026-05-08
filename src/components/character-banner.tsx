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
  const { currentSrc, nextSrc, showNext, fadeMs } = useCharacterBanner(
    character?.banners ?? [],
  );

  if (!character || !currentSrc) {
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

  return (
    <div
      className={cn("relative w-full overflow-hidden rounded-2xl", className)}
      style={{ height: "clamp(180px, 28vw, 240px)" }}
    >
      <img
        src={currentSrc}
        alt=""
        aria-hidden
        loading="eager"
        className="absolute inset-0 h-full w-full object-cover"
        style={{ objectPosition: "center" }}
      />
      {nextSrc && nextSrc !== currentSrc && (
        <img
          src={nextSrc}
          alt=""
          aria-hidden
          loading="eager"
          className="absolute inset-0 h-full w-full object-cover transition-opacity ease-in-out"
          style={{
            opacity: showNext ? 1 : 0,
            transitionDuration: `${fadeMs}ms`,
            objectPosition: "center",
          }}
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
