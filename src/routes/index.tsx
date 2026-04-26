import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Flame, Dumbbell, TrendingUp, Lock, Trophy, Zap, Shield, Crown, Swords } from "lucide-react";
import { useEffect, useState } from "react";
import { MobileShell } from "@/components/mobile-shell";
import { Avatar } from "@/components/avatar";
import { XpBar } from "@/components/xp-bar";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";
import { levelProgress, titleForLevel } from "@/lib/xp";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "KAIROS — Your training dashboard" },
      {
        name: "description",
        content:
          "See your level, streak, and today's progress. Log workouts and earn XP.",
      },
    ],
  }),
  component: HomePage,
});

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  flame: Flame,
  zap: Zap,
  shield: Shield,
  crown: Crown,
  sword: Swords,
  trophy: Trophy,
};

interface AchPreview {
  code: string;
  name: string;
  icon: string;
  unlocked: boolean;
}

const MOCK_LEADERS = [
  { rank: 1, username: "ryu_dev", level: 14, xp: 19850, seed: "R" },
  { rank: 2, username: "katana_queen", level: 12, xp: 14620, seed: "K" },
  { rank: 3, username: "iron_oni", level: 10, xp: 10880, seed: "I" },
];

function HomePage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile(user?.id);
  const [todayCount, setTodayCount] = useState(0);
  const [weeklyXp, setWeeklyXp] = useState(0);
  const [totalWorkouts, setTotalWorkouts] = useState(0);
  const [achievements, setAchievements] = useState<AchPreview[]>([]);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/auth" });
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      const since = new Date();
      since.setDate(since.getDate() - 7);
      const { data: weekly } = await supabase
        .from("workouts")
        .select("xp_earned, started_at")
        .eq("user_id", user.id)
        .gte("started_at", since.toISOString());
      const today = new Date().toDateString();
      setTodayCount((weekly ?? []).filter((w) => new Date(w.started_at).toDateString() === today).length);
      setWeeklyXp((weekly ?? []).reduce((s, w) => s + (w.xp_earned ?? 0), 0));

      const { count } = await supabase
        .from("workouts")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);
      setTotalWorkouts(count ?? 0);

      const { data: allAch } = await supabase
        .from("achievements")
        .select("id, code, name, icon")
        .limit(5);
      const { data: mine } = await supabase
        .from("user_achievements")
        .select("achievement_id")
        .eq("user_id", user.id);
      const mineSet = new Set((mine ?? []).map((m) => m.achievement_id));
      setAchievements(
        (allAch ?? []).map((a) => ({
          code: a.code,
          name: a.name,
          icon: a.icon,
          unlocked: mineSet.has(a.id),
        }))
      );
    })();
  }, [user]);

  if (authLoading || profileLoading || !profile) {
    return (
      <MobileShell>
        <div className="flex h-[60vh] items-center justify-center text-muted-foreground">
          <div className="animate-flame text-primary text-3xl">⚔</div>
        </div>
      </MobileShell>
    );
  }

  const lp = levelProgress(profile.total_xp);
  const dailyTarget = 1; // 1 workout/day
  const todayProgress = Math.min(1, todayCount / dailyTarget);

  return (
    <MobileShell>
      {/* Top */}
      <div className="animate-fade-up flex items-center justify-between">
        <Link to="/profile" className="flex items-center gap-3">
          <Avatar seed={profile.avatar_seed} size={52} />
          <div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground">
              Yo,
            </div>
            <div className="text-foreground text-lg font-bold leading-tight">
              {profile.username}.
            </div>
            <div className="text-[11px] text-muted-foreground">Today is your day.</div>
          </div>
        </Link>
        <div className="bg-card flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5">
          <Flame className="text-primary animate-flame h-4 w-4" />
          <span className="text-sm font-bold">{profile.streak}</span>
          <span className="text-[11px] text-muted-foreground">day</span>
        </div>
      </div>

      {/* Level Card */}
      <section className="animate-fade-up mt-6">
        <div className="bg-card relative overflow-hidden rounded-2xl border border-border p-5 shadow-card">
          <div
            className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full opacity-30"
            style={{ background: "radial-gradient(circle, var(--primary-glow), transparent 70%)" }}
          />
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
                Level
              </div>
              <div className="text-foreground text-6xl font-black leading-none tabular-nums">
                {lp.level}
              </div>
              <div className="text-primary mt-1 text-sm font-bold uppercase tracking-wider">
                {titleForLevel(lp.level)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-foreground text-2xl font-bold tabular-nums">
                {profile.total_xp.toLocaleString()}
              </div>
              <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
                Total XP
              </div>
            </div>
          </div>
          <div className="mt-4">
            <XpBar progress={lp.progress} animateKey={profile.total_xp} />
            <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
              <span>{lp.xpInLevel} / {lp.span} XP</span>
              <span>Next: {lp.xpForNext} XP</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <Link
        to="/workout"
        className="press bg-primary text-primary-foreground shadow-glow animate-glow mt-5 flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-sm font-bold uppercase tracking-[0.2em]"
      >
        <Dumbbell className="h-5 w-5" />
        Log Workout
      </Link>

      {/* Today's progress */}
      <section className="mt-7">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-foreground text-sm font-bold uppercase tracking-wider">
            Today's Progress
          </h2>
          <span className="text-xs text-muted-foreground">
            {todayCount}/{dailyTarget} workout
          </span>
        </div>
        <XpBar progress={todayProgress} showGlow={todayProgress > 0} animateKey={todayCount} />
      </section>

      {/* Stats */}
      <section className="mt-5 grid grid-cols-3 gap-3">
        <StatCard label="Workouts" value={totalWorkouts} />
        <StatCard label="Weekly XP" value={weeklyXp} accent />
        <StatCard label="Calories" value={Math.round(totalWorkouts * 285)} suffix="kcal" />
      </section>

      {/* Achievements */}
      <section className="mt-7">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-foreground text-sm font-bold uppercase tracking-wider">
            Achievements
          </h2>
          <Link to="/profile" className="text-xs text-muted-foreground underline">
            View all
          </Link>
        </div>
        <div className="no-scrollbar -mx-5 flex gap-3 overflow-x-auto px-5">
          {achievements.map((a) => {
            const Icon = ICONS[a.icon] ?? Trophy;
            return (
              <div
                key={a.code}
                className={`bg-card relative flex w-24 shrink-0 flex-col items-center gap-2 rounded-xl border border-border p-3 ${
                  a.unlocked ? "shadow-glow" : "opacity-60"
                }`}
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${
                    a.unlocked ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {a.unlocked ? <Icon className="h-5 w-5" /> : <Lock className="h-4 w-4" />}
                </div>
                <div className="text-center text-[11px] font-medium leading-tight">
                  {a.name}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Leaderboard preview */}
      <section className="mt-7">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-foreground text-sm font-bold uppercase tracking-wider">
            Top Warriors
          </h2>
          <Link to="/leaderboard" className="text-xs text-muted-foreground underline">
            See all
          </Link>
        </div>
        <div className="bg-card divide-y divide-border overflow-hidden rounded-2xl border border-border">
          {MOCK_LEADERS.map((u) => (
            <div key={u.rank} className="flex items-center gap-3 px-4 py-3">
              <div
                className={`text-sm font-black w-5 text-center ${
                  u.rank === 1 ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {u.rank}
              </div>
              <Avatar seed={u.seed} size={36} />
              <div className="flex-1">
                <div className="text-sm font-semibold">{u.username}</div>
                <div className="text-[11px] text-muted-foreground">Lv {u.level}</div>
              </div>
              <div className="text-primary text-sm font-bold tabular-nums">
                {u.xp.toLocaleString()} XP
              </div>
            </div>
          ))}
        </div>
      </section>
    </MobileShell>
  );
}

function StatCard({
  label,
  value,
  suffix,
  accent,
}: {
  label: string;
  value: number;
  suffix?: string;
  accent?: boolean;
}) {
  return (
    <div className="bg-card rounded-xl border border-border p-3">
      <div
        className={`text-xl font-bold tabular-nums ${accent ? "text-primary" : "text-foreground"}`}
      >
        {value.toLocaleString()}
        {suffix && <span className="text-xs text-muted-foreground"> {suffix}</span>}
      </div>
      <div className="mt-0.5 flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
        <TrendingUp className="h-3 w-3" />
        {label}
      </div>
    </div>
  );
}
