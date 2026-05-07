interface XpBarProps {
  progress: number; // 0..1
  className?: string;
  disableTransition?: boolean;
}

export function XpBar({ progress, className = "", disableTransition }: XpBarProps) {
  const pct = Math.max(0, Math.min(1, progress)) * 100;
  return (
    <div className={`xp-bar-premium ${className}`}>
      <div
        className="fill"
        style={{
          width: `${pct}%`,
          transition: disableTransition
            ? "none"
            : "width 700ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      />
    </div>
  );
}
