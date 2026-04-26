interface AvatarProps {
  seed?: string | null;
  size?: number;
  className?: string;
}

// deterministic gradient from string
function pickGradient(seed: string) {
  const palettes = [
    ["oklch(0.45 0.15 25)", "oklch(0.25 0.05 260)"],
    ["oklch(0.4 0.12 250)", "oklch(0.22 0.04 260)"],
    ["oklch(0.5 0.18 30)", "oklch(0.28 0.06 260)"],
    ["oklch(0.42 0.14 280)", "oklch(0.22 0.04 260)"],
    ["oklch(0.5 0.16 15)", "oklch(0.25 0.05 260)"],
  ];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return palettes[Math.abs(hash) % palettes.length];
}

export function Avatar({ seed, size = 48, className = "" }: AvatarProps) {
  const s = (seed ?? "K").trim() || "K";
  const initial = s[0]?.toUpperCase() ?? "K";
  const [a, b] = pickGradient(s);
  return (
    <div
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-full ring-2 ring-primary/30 ${className}`}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle at 30% 30%, ${a}, ${b})`,
      }}
    >
      <span
        className="font-bold text-foreground"
        style={{ fontSize: size * 0.42, letterSpacing: "-0.02em" }}
      >
        {initial}
      </span>
      <div
        className="pointer-events-none absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(circle at 70% 80%, oklch(1 0 0 / 0.06), transparent 60%)",
        }}
      />
    </div>
  );
}
