import { Avatar } from "@/components/avatar";
import type { Character } from "@/lib/characters";
import { cn } from "@/lib/utils";

interface CharacterAvatarProps {
  character: Character | null;
  fallbackSeed?: string | null;
  size?: number;
  className?: string;
}

export function CharacterAvatar({
  character,
  fallbackSeed,
  size = 56,
  className,
}: CharacterAvatarProps) {
  if (!character || !character.avatar) {
    return (
      <Avatar
        seed={fallbackSeed}
        size={size}
        className={cn("ring-2 ring-primary/40 shadow-glow", className)}
      />
    );
  }
  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-full bg-background shadow-glow",
        "animate-fade-in",
        className,
      )}
      style={{
        width: size,
        height: size,
        boxShadow:
          "0 0 0 2px oklch(0.58 0.19 25 / 0.55), 0 0 24px -4px oklch(0.58 0.19 25 / 0.6)",
      }}
    >
      <img
        src={character.avatar}
        alt={character.name}
        className="h-full w-full object-cover"
        draggable={false}
      />
    </div>
  );
}
