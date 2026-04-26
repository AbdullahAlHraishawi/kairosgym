import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { TrendingUp, TrendingDown, Clock, Trophy, Flame, Dumbbell } from "lucide-react";
import { MobileShell } from "@/components/mobile-shell";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/progress")({
  head: () => ({
    meta: [
      { title: "Progress — KAIROS" },
      { name: "description", content: "Your weekly XP, lifetime stats and trained muscles." },
    ],
  }),
  component: ProgressPage,
});

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function ProgressPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { profile } = useProfile(user?.id);
  const [weekData, setWeekData] = useState<{ day: string; xp: number }[]>([]);
  const [delta, setDelta] = useState(0);
  const [muscles, setMuscles] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState({ workouts: 0, hours: 0, calories: 0 });

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      const now = new Date();
      const start = new Date(now);
      start.setDate(now.getDate() - 13); // 14 days
      start.setHours(0, 0, 0, 0);
      const { data } = await supabase
        .from("workouts")
        .select("xp_earned, started_at, finished_at")
        .eq("user_id", user.id)
        .gte("started_at", start.toISOString());

      const buckets = Array(14).fill(0);
      let totalSecs = 0;
      (data ?? []).forEach((w) => {
        const d = new Date(w.started_at);
        const diffDays = Math.floor((d.getTime() - start.getTime()) / 86_400_000);
        if (diffDays >= 0 && diffDays < 14) buckets[diffDays] += w.xp_earned ?? 0;
        if (w.finished_at) {
          totalSecs += Math.max(0, (new Date(w.finished_at).getTime() - d.getTime()) / 1000);
        }
      });
      const lastWeek = buckets.slice(0, 7).reduce((a, b) => a + b, 0);
      const thisWeek = buckets.slice(7).reduce((a, b) => a + b, 0);
      setWeekData(buckets.slice(7).map((xp, i) => ({ day: DAYS[i], xp })));
      setDelta(lastWeek === 0 ? (thisWeek > 0 ? 100 : 0) : Math.round(((thisWeek - lastWeek) / lastWeek) * 100));

      const { count: wCount } = await supabase
        .from("workouts")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);
      setStats({
        workouts: wCount ?? 0,
        hours: Math.round(totalSecs / 360) / 10,
        calories: Math.round((wCount ?? 0) * 285),
      });

      // muscles trained in last 30 days
      const since30 = new Date();
      since30.setDate(now.getDate() - 30);
      const { data: weList } = await supabase
        .from("workout_exercises")
        .select("exercises(muscle_group), workouts!inner(user_id, started_at)")
        .eq("workouts.user_id", user.id)
        .gte("workouts.started_at", since30.toISOString());
      const ms = new Set<string>();
      (weList ?? []).forEach((row: { exercises?: { muscle_group: string } | null }) => {
        if (row.exercises?.muscle_group) ms.add(row.exercises.muscle_group);
      });
      setMuscles(ms);
    })();
  }, [user]);

  return (
    <MobileShell>
      <header className="animate-fade-up">
        <h1 className="text-foreground text-2xl font-black">Progress</h1>
        <p className="text-xs text-muted-foreground">Your last 7 days at a glance.</p>
      </header>

      {/* Weekly XP */}
      <section className="bg-card animate-fade-up mt-5 rounded-2xl border border-border p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
              Weekly XP
            </div>
            <div className="text-foreground text-3xl font-black tabular-nums">
              {weekData.reduce((a, b) => a + b.xp, 0).toLocaleString()}
            </div>
          </div>
          <div
            className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${
              delta >= 0
                ? "bg-success/15 text-success"
                : "bg-destructive/15 text-destructive"
            }`}
            style={{ color: delta >= 0 ? "var(--success)" : "var(--destructive)" }}
          >
            {delta >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {delta >= 0 ? "+" : ""}
            {delta}%
          </div>
        </div>
        <div className="-ml-2 mt-4 h-32">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weekData}>
              <XAxis
                dataKey="day"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
              />
              <Tooltip
                cursor={{ fill: "var(--secondary)" }}
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  fontSize: 12,
                  color: "var(--foreground)",
                }}
              />
              <Bar dataKey="xp" radius={[6, 6, 0, 0]} fill="var(--primary)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Muscle map */}
      <section className="bg-card animate-fade-up mt-5 rounded-2xl border border-border p-5">
        <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
          Muscles trained · last 30 days
        </div>
        <BodyMap activeMuscles={muscles} />
        <div className="mt-3 flex flex-wrap gap-2">
          {["Chest", "Back", "Legs", "Shoulders", "Arms"].map((m) => {
            const on = muscles.has(m);
            return (
              <span
                key={m}
                className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                  on
                    ? "bg-primary/15 border-primary/40 text-primary"
                    : "border-border text-muted-foreground"
                }`}
              >
                {m}
              </span>
            );
          })}
        </div>
      </section>

      {/* Lifetime stats */}
      <section className="mt-5 grid grid-cols-2 gap-3">
        <Tile icon={<Dumbbell className="h-4 w-4" />} label="Workouts" value={stats.workouts} />
        <Tile icon={<Clock className="h-4 w-4" />} label="Hours" value={stats.hours} />
        <Tile icon={<Flame className="h-4 w-4" />} label="Calories" value={stats.calories} />
        <Tile icon={<Trophy className="h-4 w-4" />} label="Total XP" value={profile?.total_xp ?? 0} />
      </section>
    </MobileShell>
  );
}

function Tile({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="bg-card rounded-2xl border border-border p-4">
      <div className="text-primary flex items-center gap-1.5">{icon}</div>
      <div className="text-foreground mt-2 text-2xl font-black tabular-nums">
        {value.toLocaleString()}
      </div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}

function BodyMap({ activeMuscles }: { activeMuscles: Set<string> }) {
  const fill = (m: string) =>
    activeMuscles.has(m) ? "var(--primary)" : "var(--secondary)";
  return (
    <svg viewBox="0 0 200 220" className="mx-auto mt-3 h-44 w-full">
      {/* head */}
      <circle cx="100" cy="22" r="14" fill="var(--secondary)" />
      {/* torso */}
      <rect x="74" y="40" width="52" height="56" rx="10" fill={fill("Chest")} />
      {/* shoulders */}
      <circle cx="68" cy="48" r="11" fill={fill("Shoulders")} />
      <circle cx="132" cy="48" r="11" fill={fill("Shoulders")} />
      {/* arms */}
      <rect x="50" y="58" width="14" height="46" rx="6" fill={fill("Arms")} />
      <rect x="136" y="58" width="14" height="46" rx="6" fill={fill("Arms")} />
      {/* core spacer */}
      <rect x="80" y="98" width="40" height="22" rx="6" fill="var(--secondary)" />
      {/* legs */}
      <rect x="78" y="124" width="18" height="76" rx="8" fill={fill("Legs")} />
      <rect x="104" y="124" width="18" height="76" rx="8" fill={fill("Legs")} />
      {/* back hint label */}
      <text x="100" y="215" textAnchor="middle" fontSize="9" fill="var(--muted-foreground)">
        Front view
      </text>
    </svg>
  );
}
