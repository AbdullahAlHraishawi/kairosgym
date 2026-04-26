interface XpBarProps {
  progress: number; // 0..1
  className?: string;
  showGlow?: boolean;
  animateKey?: string | number;
}

export function XpBar({ progress, className = "", showGlow = true, animateKey }: XpBarProps) {
  const pct = Math.max(0, Math.min(1, progress)) * 100;
  return (
    <div className={`relative h-2.5 w-full overflow-hidden rounded-full bg-secondary ${className}`}>
      <div
        key={animateKey}
        className={`animate-xp-fill h-full rounded-full bg-primary ${showGlow ? "shadow-glow" : ""}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
