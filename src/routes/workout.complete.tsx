import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Home } from "lucide-react";
import { z } from "zod";
import { MobileShell } from "@/components/mobile-shell";
import { XpBar } from "@/components/xp-bar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";
import { levelProgress } from "@/lib/xp";
import {
  estimateCaloriesFromSession,
  intensityLabel,
  CAL_DISCLAIMER,
} from "@/lib/calories";

export const Route = createFileRoute("/workout/complete")({
  validateSearch: z.object({ id: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Session complete — KAIROS" },
      { name: "description", content: "Workout summary." },
    ],
  }),
  component: CompletePage,
});

const SUBTITLES = [
  "Discipline logged. Progress earned.",
  "Reps counted. Limits pushed.",
  "Another step. Another rep. Another rank.",
  "The work is done. The gain remains.",
  "Strength compounds. Today counted.",
  "Sweat banked. Story written.",
];

function hashStr(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

interface Summary {
  duration: string;
  durationSecs: number;
  exercises: number;
  sets: number;
  reps: number;
  volume: number;
  xp: number;
}

function fmtDuration(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

function CompletePage() {
  const navigate = useNavigate();
  const { id } = Route.useSearch();
  const { user, loading } = useAuth();
  const { profile } = useProfile(user?.id);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [xpDisplay, setXpDisplay] = useState(0);
  const [barProgress, setBarProgress] = useState(0);

  const subtitle = useMemo(
    () => SUBTITLES[hashStr(id ?? String(Date.now())) % SUBTITLES.length],
    [id],
  );

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!id || !user) return;
    void (async () => {
      const { data: workout } = await supabase
        .from("workouts")
        .select("started_at, finished_at, xp_earned, user_id")
        .eq("id", id)
        .maybeSingle();
      if (!workout || workout.user_id !== user.id) {
        navigate({ to: "/" });
        return;
      }
      const { data: wex } = await supabase
        .from("workout_exercises")
        .select("id")
        .eq("workout_id", id);
      const wexIds = (wex ?? []).map((w) => w.id);
      let exercisesWithSets = 0;
      let setsCount = 0;
      let repsCount = 0;
      let volume = 0;
      if (wexIds.length) {
        const { data: sets } = await supabase
          .from("workout_sets")
          .select("workout_exercise_id, weight, reps, completed")
          .in("workout_exercise_id", wexIds)
          .eq("completed", true);
        const exHasSet = new Set<string>();
        (sets ?? []).forEach((s) => {
          exHasSet.add(s.workout_exercise_id);
          setsCount += 1;
          repsCount += s.reps ?? 0;
          volume += Number(s.weight ?? 0) * (s.reps ?? 0);
        });
        exercisesWithSets = exHasSet.size;
      }
      const startMs = new Date(workout.started_at).getTime();
      const endMs = workout.finished_at
        ? new Date(workout.finished_at).getTime()
        : Date.now();
      const durationSecs = Math.max(0, Math.floor((endMs - startMs) / 1000));
      setSummary({
        duration: fmtDuration(endMs - startMs),
        durationSecs,
        exercises: exercisesWithSets,
        sets: setsCount,
        reps: repsCount,
        volume,
        xp: workout.xp_earned ?? 0,
      });
    })();
  }, [id, user, navigate]);

  // XP count-up
  useEffect(() => {
    if (!summary) return;
    const target = summary.xp;
    const start = performance.now();
    const dur = 1100;
    let raf = 0;
    const tick = (t: number) => {
      const k = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - k, 3);
      setXpDisplay(Math.round(target * eased));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [summary]);

  const lp = profile ? levelProgress(profile.total_xp) : null;
  // Animate bar from 0 → real progress on mount once profile arrives
  useEffect(() => {
    if (!lp) return;
    const t = setTimeout(() => setBarProgress(lp.progress), 150);
    return () => clearTimeout(t);
  }, [lp?.progress]);

  if (!summary || !lp) {
    return (
      <MobileShell hideNav>
        <div className="flex h-[60vh] items-center justify-center text-muted-foreground">
          <div className="animate-flame text-primary text-3xl">⚔</div>
        </div>
      </MobileShell>
    );
  }

  return (
    <MobileShell hideNav>
      <div className="animate-fade-up">
        {/* Header */}
        <div className="text-center pt-4">
          <div className="text-[10px] font-black uppercase tracking-[0.5em] text-muted-foreground">
            Session
          </div>
          <h1
            className="mt-1 text-3xl font-black uppercase tracking-[0.25em] text-foreground"
            style={{
              textShadow:
                "0 0 12px var(--primary-glow), 0 0 28px var(--primary)",
            }}
          >
            Complete
          </h1>
          <p className="mt-2 text-xs italic text-muted-foreground">{subtitle}</p>
        </div>

        {/* XP reward */}
        <div className="relative mt-10 flex flex-col items-center justify-center">
          <div
            aria-hidden="true"
            className="animate-level-flare absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{
              width: 320,
              height: 320,
              background:
                "radial-gradient(circle, color-mix(in oklab, var(--primary-glow) 50%, transparent) 0%, transparent 70%)",
              filter: "blur(10px)",
            }}
          />
          <div
            className="relative text-display text-7xl font-black tabular-nums leading-none text-foreground"
            style={{
              textShadow:
                "0 0 14px var(--primary-glow), 0 0 32px var(--primary-glow), 0 0 60px var(--primary)",
            }}
          >
            +{xpDisplay}
          </div>
          <div className="relative mt-2 text-xs font-black uppercase tracking-[0.4em] text-primary">
            XP Earned
          </div>
        </div>

        {/* Summary card */}
        <section className="card-premium mt-10 rounded-2xl p-5 edge-red">
          <div className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground mb-3">
            Summary
          </div>
          <div className="divide-y divide-border/40">
            <SummaryRow label="Duration" value={summary.duration} />
            <SummaryRow label="Exercises" value={summary.exercises.toString()} />
            <SummaryRow label="Sets" value={summary.sets.toString()} />
            <SummaryRow label="Reps" value={summary.reps.toString()} />
            <SummaryRow
              label="Volume"
              value={`${summary.volume.toLocaleString()} kg`}
            />
            {profile?.weight_kg ? (
              <SummaryRow
                label="Calories"
                value={`≈ ${estimateCalories(profile.weight_kg, summary.durationSecs).toLocaleString()} kcal`}
              />
            ) : (
              <Link to="/profile" className="press flex items-center justify-between py-3">
                <div className="text-[11px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                  Calories
                </div>
                <div className="text-[11px] font-bold text-primary">
                  Set weight in profile →
                </div>
              </Link>
            )}
          </div>
          {profile?.weight_kg && (
            <p className="mt-3 text-[10px] italic text-muted-foreground">{CAL_DISCLAIMER}</p>
          )}
        </section>

        {/* Level progress */}
        <section className="mt-6">
          <div className="mb-1.5 flex items-baseline justify-between">
            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">
              Level {lp.level}
            </div>
            <div className="text-[11px] font-semibold tabular-nums text-muted-foreground">
              {lp.xpInLevel} / {lp.span} XP
            </div>
          </div>
          <XpBar progress={barProgress} />
        </section>

        {/* CTA */}
        <Link
          to="/"
          className="press bg-primary text-primary-foreground shadow-glow animate-glow mt-10 mb-4 flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-sm font-black uppercase tracking-[0.25em]"
        >
          <Home className="h-5 w-5" />
          Return Home
        </Link>
      </div>
    </MobileShell>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="text-[11px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
        {label}
      </div>
      <div className="text-display text-lg font-black tabular-nums text-foreground">
        {value}
      </div>
    </div>
  );
}
