import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Plus, Trash2, Check, Flame } from "lucide-react";
import { MobileShell } from "@/components/mobile-shell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { finishWorkout, type LoggedExercise } from "@/lib/workout";
import { XpGainOverlay } from "@/components/xp-gain-overlay";
import { toast } from "sonner";

export const Route = createFileRoute("/workout/log")({
  head: () => ({
    meta: [
      { title: "Active workout — KAIROS" },
      { name: "description", content: "Log sets, reps, and weight for your active workout." },
    ],
  }),
  component: LogPage,
});

type ExerciseInfo = { id: string; name: string; muscle_group: string };
type SetRow = { weight: number; reps: number; done: boolean };
type EntryState = { info: ExerciseInfo; sets: SetRow[] };

function LogPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [entries, setEntries] = useState<EntryState[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [overlay, setOverlay] = useState<{
    xp: number;
    leveled: boolean;
    newLevel: number;
  } | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  useEffect(() => {
    const raw = sessionStorage.getItem("kairos_picked");
    const ids: string[] = raw ? JSON.parse(raw) : [];
    if (ids.length === 0) return;
    void supabase
      .from("exercises")
      .select("id, name, muscle_group")
      .in("id", ids)
      .then(({ data }) => {
        const ordered = ids
          .map((id) => (data ?? []).find((e) => e.id === id))
          .filter(Boolean) as ExerciseInfo[];
        setEntries(
          ordered.map((info) => ({
            info,
            sets: [{ weight: 0, reps: 0, done: false }],
          }))
        );
      });
  }, []);

  const updateSet = (ei: number, si: number, patch: Partial<SetRow>) => {
    setEntries((prev) => {
      const next = [...prev];
      const sets = [...next[ei].sets];
      sets[si] = { ...sets[si], ...patch };
      next[ei] = { ...next[ei], sets };
      return next;
    });
  };

  const addSet = (ei: number) =>
    setEntries((prev) => {
      const next = [...prev];
      const last = next[ei].sets[next[ei].sets.length - 1];
      next[ei] = {
        ...next[ei],
        sets: [
          ...next[ei].sets,
          { weight: last?.weight ?? 0, reps: last?.reps ?? 0, done: false },
        ],
      };
      return next;
    });

  const removeEntry = (ei: number) =>
    setEntries((p) => p.filter((_, i) => i !== ei));

  const finish = async () => {
    const payload: LoggedExercise[] = entries
      .map((e) => ({
        exerciseId: e.info.id,
        sets: e.sets
          .filter((s) => s.done && s.reps > 0)
          .map((s) => ({ weight: s.weight, reps: s.reps })),
      }))
      .filter((e) => e.sets.length > 0);

    if (payload.length === 0) {
      toast.error("Mark at least one completed set.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await finishWorkout(payload);
      sessionStorage.removeItem("kairos_picked");
      if (res.unlockedAchievements.length) {
        res.unlockedAchievements.forEach((a) =>
          toast.success(`🏆 Unlocked: ${a.name}`)
        );
      }
      if (res.newStreak > 1) {
        toast(`🔥 ${res.newStreak}-day streak`, { duration: 2200 });
      }
      setOverlay({ xp: res.xpEarned, leveled: res.leveledUp, newLevel: res.newLevel });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save workout");
    } finally {
      setSubmitting(false);
    }
  };

  const totalSetsDone = entries.reduce(
    (s, e) => s + e.sets.filter((x) => x.done).length,
    0
  );

  return (
    <MobileShell hideNav>
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          to="/workout"
          className="press flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="text-center">
          <div className="text-foreground text-base font-bold uppercase tracking-wider">
            Active Workout
          </div>
          <div className="text-[11px] text-muted-foreground">
            {totalSetsDone} sets · +{100 + totalSetsDone * 10} XP
          </div>
        </div>
        <div className="w-10" />
      </div>

      {entries.length === 0 ? (
        <div className="mt-20 text-center">
          <div className="text-muted-foreground">No exercises picked.</div>
          <Link
            to="/workout"
            className="press bg-primary text-primary-foreground shadow-glow mt-6 inline-flex rounded-xl px-5 py-2.5 text-sm font-bold uppercase tracking-wider"
          >
            Pick exercises
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {entries.map((entry, ei) => (
            <div
              key={entry.info.id}
              className="bg-card animate-fade-up rounded-2xl border border-border p-4"
            >
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold">{entry.info.name}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {entry.info.muscle_group}
                  </div>
                </div>
                <button
                  onClick={() => removeEntry(ei)}
                  className="press text-muted-foreground hover:text-destructive p-1"
                  aria-label="Remove"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* set headers */}
              <div className="grid grid-cols-[28px_1fr_1fr_36px] gap-2 px-1 pb-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                <div>Set</div>
                <div>Kg</div>
                <div>Reps</div>
                <div className="text-right">✓</div>
              </div>

              {entry.sets.map((s, si) => (
                <div
                  key={si}
                  className={`mt-1.5 grid grid-cols-[28px_1fr_1fr_36px] items-center gap-2 rounded-lg px-1 py-1 ${
                    s.done ? "bg-primary/10" : ""
                  }`}
                >
                  <div className="text-center text-sm font-bold tabular-nums">{si + 1}</div>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={s.weight || ""}
                    onChange={(e) =>
                      updateSet(ei, si, { weight: parseFloat(e.target.value) || 0 })
                    }
                    placeholder="0"
                    className="bg-input rounded-md border border-border px-2 py-1.5 text-sm tabular-nums outline-none ring-primary/40 focus:ring-2"
                  />
                  <input
                    type="number"
                    inputMode="numeric"
                    value={s.reps || ""}
                    onChange={(e) =>
                      updateSet(ei, si, { reps: parseInt(e.target.value) || 0 })
                    }
                    placeholder="0"
                    className="bg-input rounded-md border border-border px-2 py-1.5 text-sm tabular-nums outline-none ring-primary/40 focus:ring-2"
                  />
                  <button
                    onClick={() => updateSet(ei, si, { done: !s.done })}
                    className={`press flex h-8 w-8 items-center justify-center rounded-md justify-self-end ${
                      s.done
                        ? "bg-primary text-primary-foreground shadow-glow"
                        : "bg-secondary text-muted-foreground"
                    }`}
                    aria-label="Toggle complete"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                </div>
              ))}

              <button
                onClick={() => addSet(ei)}
                className="press mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                <Plus className="h-3.5 w-3.5" /> Add set
              </button>
            </div>
          ))}

          <Link
            to="/workout"
            className="press bg-card flex w-full items-center justify-center gap-1.5 rounded-xl border border-border py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
          >
            <Plus className="h-3.5 w-3.5" /> Add exercise
          </Link>

          <button
            onClick={finish}
            disabled={submitting || totalSetsDone === 0}
            className="press bg-primary text-primary-foreground shadow-glow animate-glow mt-4 flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-sm font-bold uppercase tracking-[0.2em] disabled:opacity-50"
          >
            <Flame className="h-5 w-5" />
            {submitting ? "Saving..." : "Finish workout"}
          </button>
        </div>
      )}

      {overlay && (
        <XpGainOverlay
          xp={overlay.xp}
          leveledUp={overlay.leveled}
          newLevel={overlay.newLevel}
          onDone={() => navigate({ to: "/" })}
        />
      )}
    </MobileShell>
  );
}
