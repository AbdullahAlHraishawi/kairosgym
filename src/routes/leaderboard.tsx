import { createFileRoute } from "@tanstack/react-router";
import { Trophy } from "lucide-react";
import { MobileShell } from "@/components/mobile-shell";
import { Avatar } from "@/components/avatar";
import { AtmoCard } from "@/components/atmo-card";
import { BadgeEmblem } from "@/components/badge-emblem";
import { titleForLevel } from "@/lib/xp";
import atmoCrowd from "@/assets/atmo-crowd.png";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({
    meta: [
      { title: "Leaderboard — KAIROS" },
      { name: "description", content: "Top-ranked KAIROS warriors by total XP." },
    ],
  }),
  component: LeaderboardPage,
});

const MOCK = [
  { username: "ryu_dev", xp: 19850, level: 14, seed: "R" },
  { username: "katana_queen", xp: 14620, level: 12, seed: "K" },
  { username: "iron_oni", xp: 10880, level: 10, seed: "I" },
  { username: "shadow_blade", xp: 9020, level: 9, seed: "S" },
  { username: "raijin", xp: 7400, level: 8, seed: "R" },
  { username: "mizuhara", xp: 6210, level: 7, seed: "M" },
  { username: "kaen", xp: 5350, level: 7, seed: "K" },
  { username: "you", xp: 0, level: 0, seed: "Y" },
];

function LeaderboardPage() {
  return (
    <MobileShell>
      <header className="animate-fade-up flex items-center gap-3">
        <div className="bg-primary/15 text-primary flex h-10 w-10 items-center justify-center rounded-xl">
          <Trophy className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-foreground text-display text-2xl font-black leading-tight">Top Warriors</h1>
          <p className="text-xs text-muted-foreground">Mock data · global ladder coming soon</p>
        </div>
      </header>

      {/* Podium */}
      <AtmoCard image={atmoCrowd} imageOpacity={0.16} className="mt-6 p-4">
        <div className="grid grid-cols-3 items-end gap-2">
          {[MOCK[1], MOCK[0], MOCK[2]].map((u, i) => {
            const realRank = i === 0 ? 2 : i === 1 ? 1 : 3;
            const heights = ["h-24", "h-32", "h-20"];
            return (
              <div key={u.username} className="flex flex-col items-center">
                {realRank === 1 && (
                  <BadgeEmblem icon="crown" size={32} className="mb-1" />
                )}
                <Avatar
                  seed={u.seed}
                  size={realRank === 1 ? 60 : 44}
                  className={realRank === 1 ? "ring-primary animate-ember ring-4 shadow-glow" : ""}
                />
                <div className="mt-2 text-xs font-bold">{u.username}</div>
                <div className="text-primary text-display text-[11px] font-bold tabular-nums">
                  {u.xp.toLocaleString()}
                </div>
                <div
                  className={`mt-2 w-full rounded-t-xl border-x border-t border-border ${heights[i]} flex items-start justify-center pt-2`}
                  style={{
                    background:
                      realRank === 1
                        ? "linear-gradient(180deg, oklch(0.58 0.22 25 / 0.45), oklch(0.23 0.008 260))"
                        : "linear-gradient(180deg, oklch(0.32 0.02 260), oklch(0.21 0.008 260))",
                  }}
                >
                  <span
                    className={`text-display text-3xl font-black ${
                      realRank === 1 ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {realRank}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </AtmoCard>

      {/* List */}
      <div className="card-premium mt-6 divide-y divide-border overflow-hidden rounded-2xl">
        {MOCK.map((u, i) => {
          const top = i < 3;
          return (
            <div
              key={u.username}
              className={`flex items-center gap-3 px-4 py-3 ${
                top ? "bg-gradient-to-r from-primary/10 to-transparent" : ""
              }`}
            >
              <div
                className={`w-5 text-center text-display text-sm font-black tabular-nums ${
                  i === 0 ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {i + 1}
              </div>
              <Avatar
                seed={u.seed}
                size={36}
                className={i === 0 ? "ring-2 ring-primary/60 shadow-glow" : ""}
              />
              <div className="flex-1">
                <div className="text-sm font-semibold">{u.username}</div>
                <div className="text-[11px] text-muted-foreground">
                  Lv {u.level} · {titleForLevel(u.level)}
                </div>
              </div>
              <div className="text-primary text-display text-sm font-bold tabular-nums">
                {u.xp.toLocaleString()}
              </div>
            </div>
          );
        })}
      </div>
    </MobileShell>
  );
}
