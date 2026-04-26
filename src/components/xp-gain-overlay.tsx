import { useEffect, useState } from "react";

interface XpGainOverlayProps {
  xp: number;
  leveledUp: boolean;
  newLevel: number;
  onDone: () => void;
}

export function XpGainOverlay({ xp, leveledUp, newLevel, onDone }: XpGainOverlayProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const start = performance.now();
    const dur = 900;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      setCount(Math.round(xp * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const close = setTimeout(onDone, 2400);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(close);
    };
  }, [xp, onDone]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/85 backdrop-blur-md"
      onClick={onDone}
    >
      <div className="animate-fade-up flex flex-col items-center text-center">
        <div className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
          XP gained
        </div>
        <div className="animate-xp-pop mt-2 flex items-baseline gap-1">
          <span className="text-primary text-7xl font-black tabular-nums drop-shadow-[0_0_24px_var(--primary-glow)]">
            +{count}
          </span>
        </div>
        {leveledUp && (
          <div className="animate-fade-up mt-6 rounded-full border border-primary/40 bg-primary/10 px-4 py-2 text-sm font-bold uppercase tracking-widest text-primary">
            ⚔ Level Up — {newLevel}
          </div>
        )}
        <div className="mt-8 text-xs text-muted-foreground">tap to continue</div>
      </div>
    </div>
  );
}
