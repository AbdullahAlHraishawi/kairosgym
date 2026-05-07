import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Trophy } from "lucide-react";
import { MobileShell } from "@/components/mobile-shell";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";
import { RANKS, xpForLevel } from "@/lib/xp";

export const Route = createFileRoute("/ranks")({
  head: () => ({
    meta: [
      { title: "Ranks — KAIROS" },
      { name: "description", content: "All KAIROS ranks from Novice to Kairos." },
    ],
  }),
  component: RanksPage,
});

function RanksPage() {
  const { user } = useAuth();
  const { profile } = useProfile(user?.id);
  const myLevel = profile?.level ?? 0;

  return (
    <MobileShell hideNav>
      <div className="flex items-center gap-3">
        <Link
          to="/profile"
          className="press flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-xl font-black">Ranks</h1>
      </div>

      <div className="mt-6 space-y-3">
        {RANKS.map((r, i) => {
          const reached = myLevel >= r.level;
          return (
            <div
              key={r.name}
              className={`card-premium relative flex items-center gap-3 overflow-hidden rounded-2xl p-4 ${
                reached ? "edge-red" : "opacity-70"
              }`}
            >
              <span
                className="absolute left-0 top-0 h-full w-1"
                style={{ background: r.color }}
                aria-hidden="true"
              />
              <div
                className="flex h-12 w-12 items-center justify-center rounded-xl text-foreground"
                style={{
                  background: `color-mix(in oklab, ${r.color} 25%, transparent)`,
                  boxShadow: "inset 0 2px 4px oklch(0 0 0 / 0.5)",
                }}
              >
                <Trophy className="h-5 w-5" style={{ color: r.color }} />
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold">{r.name}</div>
                <div className="text-[11px] text-muted-foreground text-display">
                  Level {r.level}+ · {xpForLevel(r.level).toLocaleString()} XP
                </div>
              </div>
              <div
                className={`text-[10px] font-bold uppercase tracking-widest ${
                  reached ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {reached ? "Unlocked" : `#${i + 1}`}
              </div>
            </div>
          );
        })}
      </div>
    </MobileShell>
  );
}
