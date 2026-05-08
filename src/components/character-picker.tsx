import { useState } from "react";
import { Check, Lock } from "lucide-react";
import { toast } from "sonner";

import { CHARACTER_LIST, getCharacter, type Character, type CharacterKey } from "@/lib/characters";
import { CharacterBanner } from "@/components/character-banner";
import { supabase } from "@/integrations/supabase/client";
import { emitProfileChanged } from "@/lib/profile-bus";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface CharacterPickerProps {
  userId: string;
  currentKey: string | null;
  onSaved?: (key: CharacterKey | null) => void;
  variant?: "inline" | "onboarding";
  onContinue?: () => void;
}

export function CharacterPicker({
  userId,
  currentKey,
  onSaved,
  variant = "inline",
  onContinue,
}: CharacterPickerProps) {
  const initial = (currentKey as CharacterKey | null) ?? null;
  const [selected, setSelected] = useState<CharacterKey | null>(initial);
  const [preview, setPreview] = useState<Character | null>(
    getCharacter(initial) ?? CHARACTER_LIST.find((c) => c.available) ?? null,
  );
  const [saving, setSaving] = useState(false);

  const persist = async (key: CharacterKey | null) => {
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ character_key: key })
      .eq("id", userId);
    setSaving(false);
    if (error) {
      toast.error("Could not save character");
      return false;
    }
    onSaved?.(key);
    emitProfileChanged();
    return true;
  };

  const handleSelect = async (c: Character) => {
    if (!c.available) return;
    setSelected(c.key);
    setPreview(c);
    if (variant === "inline") {
      const ok = await persist(c.key);
      if (ok) toast.success(`${c.name} is your warrior.`);
    }
  };

  const handleSkip = async () => {
    setSelected(null);
    if (variant === "inline") {
      await persist(null);
    } else {
      onContinue?.();
    }
  };

  const handleContinue = async () => {
    if (selected) {
      await persist(selected);
    }
    onContinue?.();
  };

  return (
    <div className="space-y-4">
      {variant === "onboarding" && (
        <div className="overflow-hidden rounded-2xl">
          <CharacterBanner character={preview} showChooseCta={false} />
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        {CHARACTER_LIST.map((c) => {
          const isSelected = selected === c.key;
          const locked = !c.available;
          return (
            <button
              key={c.key}
              type="button"
              disabled={locked}
              onClick={() => handleSelect(c)}
              onMouseEnter={() => c.available && setPreview(c)}
              className={cn(
                "press card-premium relative flex flex-col items-center gap-2 rounded-xl p-3 text-center transition-all",
                isSelected && "edge-red ring-2 ring-primary shadow-glow scale-[1.02]",
                locked && "opacity-60 cursor-not-allowed",
              )}
            >
              {isSelected && (
                <div className="bg-primary text-primary-foreground absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full ring-2 ring-background shadow-glow">
                  <Check className="h-3.5 w-3.5" />
                </div>
              )}
              <div
                className="relative h-16 w-16 overflow-hidden rounded-full bg-background"
                style={{
                  boxShadow: isSelected
                    ? "0 0 0 2px oklch(0.58 0.19 25 / 0.8), 0 0 18px -2px oklch(0.58 0.19 25 / 0.7)"
                    : "0 0 0 1px oklch(0.58 0.19 25 / 0.3)",
                }}
              >
                {c.avatar ? (
                  <img
                    src={c.avatar}
                    alt={c.name}
                    className="h-full w-full object-cover"
                    draggable={false}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-secondary text-muted-foreground">
                    <Lock className="h-5 w-5" />
                  </div>
                )}
              </div>
              <div className="text-display text-sm font-bold leading-none">
                {c.name}
              </div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground leading-tight">
                {locked ? "Coming soon" : c.tagline}
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleSkip}
          disabled={saving}
          className="press text-muted-foreground hover:text-foreground flex-1 rounded-xl border border-border py-2.5 text-xs font-semibold uppercase tracking-widest transition-colors"
        >
          {variant === "onboarding" ? "Skip for now" : "Use initials"}
        </button>
        {variant === "onboarding" && (
          <Button
            type="button"
            onClick={handleContinue}
            disabled={saving}
            className="press flex-1 rounded-xl py-2.5 text-xs font-bold uppercase tracking-widest"
          >
            Continue
          </Button>
        )}
      </div>
    </div>
  );
}
