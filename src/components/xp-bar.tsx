interface XpBarProps {
  progress: number; // 0..1
  className?: string;
  showGlow?: boolean;
  animateKey?: string | number;
}

export function XpBar({ progress, className = "", animateKey }: XpBarProps) {
  const pct = Math.max(0, Math.min(1, progress)) * 100;
  return (
    <div className={`xp-bar-premium ${className}`}>
      <div
        key={animateKey}
        className="fill animate-xp-fill"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
