import ryujiAvatar from "@/assets/characters/ryuji/avatar.png";
import ryujiBanner1 from "@/assets/characters/ryuji/banner1.png";
import ryujiBanner2 from "@/assets/characters/ryuji/banner2.png";
import ryujiBanner3 from "@/assets/characters/ryuji/banner3.png";
import kaiAvatar from "@/assets/characters/kai/avatar.png";
import kaiBanner1 from "@/assets/characters/kai/banner1.png";
import kaiBanner2 from "@/assets/characters/kai/banner2.png";
import kaiBanner3 from "@/assets/characters/kai/banner3.png";

export type CharacterKey = "ryuji" | "kai" | "ren";

export interface Character {
  key: CharacterKey;
  name: string;
  tagline: string;
  avatar: string | null;
  banners: string[];
  available: boolean;
}

export const CHARACTERS: Record<CharacterKey, Character> = {
  ryuji: {
    key: "ryuji",
    name: "Ryuji",
    tagline: "Intense / Focused",
    avatar: ryujiAvatar,
    banners: [ryujiBanner1, ryujiBanner2, ryujiBanner3],
    available: true,
  },
  kai: {
    key: "kai",
    name: "Kai",
    tagline: "Calm / Tactical",
    avatar: kaiAvatar,
    banners: [kaiBanner1, kaiBanner2, kaiBanner3],
    available: true,
  },
  ren: {
    key: "ren",
    name: "Ren",
    tagline: "Relentless / Rebel",
    avatar: null,
    banners: [],
    available: false,
  },
};

export const CHARACTER_LIST: Character[] = Object.values(CHARACTERS);

export function getCharacter(key: string | null | undefined): Character | null {
  if (!key) return null;
  const c = CHARACTERS[key as CharacterKey];
  return c && c.available ? c : null;
}
