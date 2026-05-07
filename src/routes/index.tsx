import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Flame, Dumbbell, TrendingUp, Lock } from "lucide-react";
import { useEffect, useState } from "react";
import { MobileShell } from "@/components/mobile-shell";
import { Avatar } from "@/components/avatar";
import { XpBar } from "@/components/xp-bar";
import { AtmoCard } from "@/components/atmo-card";
import { BadgeEmblem } from "@/components/badge-emblem";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";
import { levelProgress, titleForLevel } from "@/lib/xp";
import { supabase } from "@/integrations/supabase/client";
import {
  sumWorkoutCalories,
  type WorkoutForCalories,
  CAL_DISCLAIMER,
} from "@/lib/calories";
import atmoWarrior from "@/assets/atmo-warrior.png";
import atmoCrowd from "@/assets/atmo-crowd.png";

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
  const [workoutRows, setWorkoutRows] = useState<WorkoutForCalories[]>([]);
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

      const { data: allWorkouts } = await supabase
        .from("workouts")
        .select(
          "started_at, finished_at, workout_exercises(workout_sets(reps, completed))",
        )
        .eq("user_id", user.id);
      setTotalWorkouts((allWorkouts ?? []).length);
      const rows: WorkoutForCalories[] = (allWorkouts ?? []).map((w) => {
        let totalReps = 0;
        let setsCount = 0;
        const wex = (w as { workout_exercises?: Array<{ workout_sets?: Array<{ reps: number; completed: boolean }> }> }).workout_exercises ?? [];
        wex.forEach((e) => {
          (e.workout_sets ?? []).forEach((s) => {
            if (s.completed) {
              setsCount += 1;
              totalReps += s.reps ?? 0;
            }
          });
        });
        return {
          started_at: w.started_at,
          finished_at: w.finished_at,
          totalReps,
          setsCount,
        };
      });
      setWorkoutRows(rows);

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
  const dailyTarget = 1;
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
        <div className="bg-card flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 edge-red">
          <Flame className="text-primary animate-flame h-4 w-4" />
          <span className="text-sm font-bold text-display">{profile.streak}</span>
          <span className="text-[11px] text-muted-foreground">day</span>
        </div>
      </div>

      <div
        className="mt-5 h-px w-full"
        style={{
          background:
            "linear-gradient(90deg, transparent, oklch(0.58 0.19 25 / 0.4), transparent)",
        }}
      />

      {/* Level Card */}
      <section className="animate-fade-up mt-5">
        <AtmoCard
          variant="cinematic"
          image={atmoWarrior}
          imageOpacity={0.16}
          imagePosition="center top"
          glow
          className="p-5"
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
                Level
              </div>
              <div className="text-foreground text-display text-7xl font-black leading-none tabular-nums">
                {lp.level}
              </div>
              <div className="text-primary mt-1 text-sm font-bold uppercase tracking-wider">
                {titleForLevel(lp.level)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-foreground text-display text-2xl font-bold tabular-nums">
                {profile.total_xp.toLocaleString()}
              </div>
              <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
                Total XP
              </div>
            </div>
          </div>
          <div className="mt-5">
            <XpBar progress={lp.progress} />
            <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
              <span className="text-display">{lp.xpInLevel} / {lp.span} XP</span>
              <span className="text-display">Next: {lp.xpForNext} XP</span>
            </div>
          </div>
        </AtmoCard>
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
          <span className="text-xs text-muted-foreground text-display">
            {todayCount}/{dailyTarget} workout
          </span>
        </div>
        <XpBar progress={todayProgress} />
      </section>

      {/* Stats */}
      <section className="mt-5 grid grid-cols-3 gap-3">
        <StatCard label="Workouts" value={totalWorkouts} />
        <StatCard label="Weekly XP" value={weeklyXp} accent />
        {profile.weight_kg ? (
          <StatCard
            label="Calories"
            value={estimateCalories(profile.weight_kg, totalSecs)}
            suffix="kcal"
          />
        ) : (
          <Link
            to="/profile"
            className="press card-premium flex flex-col justify-center rounded-xl p-3"
          >
            <div className="text-[11px] font-bold leading-tight text-primary">
              Set weight
            </div>
            <div className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
              in profile →
            </div>
          </Link>
        )}
      </section>
      {profile.weight_kg && (
        <p className="mt-2 text-[10px] italic text-muted-foreground">{CAL_DISCLAIMER}</p>
      )}

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
          {achievements.map((a) => (
            <div
              key={a.code}
              className={`card-premium relative flex w-24 shrink-0 flex-col items-center gap-2 rounded-xl p-3 ${
                a.unlocked ? "edge-red" : "opacity-70"
              }`}
            >
              {a.unlocked ? (
                <BadgeEmblem icon={a.icon} size={48} />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
                  <Lock className="h-4 w-4" />
                </div>
              )}
              <div className="text-center text-[11px] font-medium leading-tight">
                {a.name}
              </div>
            </div>
          ))}
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
        <AtmoCard image={atmoCrowd} imageOpacity={0.12} className="overflow-hidden">
          <div className="divide-y divide-border/60">
            {MOCK_LEADERS.map((u) => (
              <div
                key={u.rank}
                className={`flex items-center gap-3 px-4 py-3 ${
                  u.rank === 1
                    ? "bg-gradient-to-r from-primary/15 to-transparent"
                    : ""
                }`}
              >
                <div
                  className={`text-display w-5 text-center text-base font-black ${
                    u.rank === 1 ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {u.rank}
                </div>
                <Avatar
                  seed={u.seed}
                  size={36}
                  className={u.rank === 1 ? "ring-2 ring-primary/60 shadow-glow" : ""}
                />
                <div className="flex-1">
                  <div className="text-sm font-semibold">{u.username}</div>
                  <div className="text-[11px] text-muted-foreground">Lv {u.level}</div>
                </div>
                <div className="text-primary text-display text-sm font-bold tabular-nums">
                  {u.xp.toLocaleString()} XP
                </div>
              </div>
            ))}
          </div>
        </AtmoCard>
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
    <div className={`card-premium rounded-xl p-3 ${accent ? "edge-red" : ""}`}>
      <div
        className={`text-display text-xl font-bold tabular-nums ${accent ? "text-primary" : "text-foreground"}`}
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
