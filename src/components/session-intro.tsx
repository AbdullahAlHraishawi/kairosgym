import { useEffect, useState } from "react";

export function SessionIntro({ onDone }: { onDone?: () => void }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false);
      onDone?.();
    }, 2850);
    return () => clearTimeout(t);
  }, [onDone]);

  if (!visible) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm animate-fade-up"
      aria-hidden="true"
    >
      <div className="text-center">
        <div className="text-primary text-[10px] uppercase tracking-[0.5em] mb-3 opacity-80">
          KAIROS
        </div>
        <div
          className="text-foreground text-3xl font-black uppercase tracking-[0.3em] animate-text-glow"
          style={{
            textShadow:
              "0 0 6px var(--primary-glow), 0 0 14px var(--primary-glow), 0 0 28px var(--primary)",
          }}
        >
          Session Started
        </div>
      </div>
    </div>
  );
}
