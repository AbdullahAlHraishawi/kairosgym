import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export function SessionIntro({ onDone }: { onDone?: () => void }) {
  const [phase, setPhase] = useState<"in" | "out">("in");

  useEffect(() => {
    const tOut = setTimeout(() => setPhase("out"), 1500);
    const tDone = setTimeout(() => {
      onDone?.();
    }, 2000);
    return () => {
      clearTimeout(tOut);
      clearTimeout(tDone);
    };
  }, [onDone]);

  // Lock document scroll while the splash is up
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevHtml = html.style.overflow;
    const prevBody = body.style.overflow;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    return () => {
      html.style.overflow = prevHtml;
      body.style.overflow = prevBody;
    };
  }, []);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background transition-opacity duration-500 ease-out"
      style={{ opacity: phase === "in" ? 1 : 0, touchAction: "none" }}
      aria-hidden="true"
    >
      <div className="text-center animate-fade-up">
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
    </div>,
    document.body,
  );
}
