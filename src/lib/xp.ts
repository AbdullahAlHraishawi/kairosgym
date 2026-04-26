// XP & level math, titles, ranks
export const XP_PER_WORKOUT = 100;
export const XP_PER_SET = 10;

export function levelFromXp(xp: number): number {
  return Math.floor(Math.sqrt(Math.max(0, xp) / 100));
}

export function xpForLevel(level: number): number {
  return level * level * 100;
}

/** Returns { level, xpInLevel, xpForNext, progress (0..1) } */
export function levelProgress(xp: number) {
  const level = levelFromXp(xp);
  const current = xpForLevel(level);
  const next = xpForLevel(level + 1);
  const xpInLevel = xp - current;
  const span = next - current;
  return {
    level,
    xpInLevel,
    span,
    xpForNext: next - xp,
    progress: span > 0 ? xpInLevel / span : 0,
  };
}

export const TITLES: Array<{ minLevel: number; title: string }> = [
  { minLevel: 0, title: "Novice" },
  { minLevel: 2, title: "Fighter" },
  { minLevel: 5, title: "Warrior" },
  { minLevel: 10, title: "Berserker" },
  { minLevel: 15, title: "Relentless" },
  { minLevel: 20, title: "Kairos" },
];

export function titleForLevel(level: number): string {
  let t = TITLES[0].title;
  for (const tier of TITLES) if (level >= tier.minLevel) t = tier.title;
  return t;
}

export const RANKS = [
  { level: 0, name: "Novice", color: "oklch(0.66 0.005 260)" },
  { level: 2, name: "Fighter", color: "oklch(0.55 0.11 250)" },
  { level: 5, name: "Warrior", color: "oklch(0.58 0.19 25)" },
  { level: 10, name: "Berserker", color: "oklch(0.65 0.22 25)" },
  { level: 15, name: "Relentless", color: "oklch(0.7 0.18 30)" },
  { level: 20, name: "Kairos", color: "oklch(0.85 0.16 90)" },
];
