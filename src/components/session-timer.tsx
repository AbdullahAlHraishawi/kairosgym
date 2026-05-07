import { useEffect, useState } from "react";

export function SessionTimer({ startedAt }: { startedAt: number }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const elapsed = Math.max(0, Math.floor((now - startedAt) / 1000));
  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");

  return (
    <div
      className="text-foreground text-5xl font-black tabular-nums tracking-tight"
      style={{ textShadow: "0 0 20px var(--primary-glow)" }}
    >
      {mm}:{ss}
    </div>
  );
}
