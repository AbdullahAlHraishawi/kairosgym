import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Plus, Flame, Loader2 } from "lucide-react";
import { MobileShell } from "@/components/mobile-shell";
import { SessionIntro } from "@/components/session-intro";
import { SessionTimer } from "@/components/session-timer";
import { SetRow, type SetRowState } from "@/components/set-row";
import { XpBar } from "@/components/xp-bar";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";
import { levelProgress, xpForSet } from "@/lib/xp";
import {
  addDraftSet,
  finalizeWorkout,
  loadOpenWorkout,
  openWorkout,
  updateDraftSet,
  type DraftWorkout,
} from "@/lib/workout";

export const Route = createFileRoute("/workout/log")({
  head: () => ({
    meta: [
      { title: "Active session — KAIROS" },
      { name: "description", content: "Active workout session." },
    ],
  }),
  component: LogPage,
});

type EntryState = {
  workoutExerciseId: string;
  info: { id: string; name: string; muscle_group: string };
  sets: (SetRowState & { id: string })[];
};

const SUBTITLES = [
  "Forge your limits.",
  "Stay disciplined.",
  "Earn every rep.",
  "Outwork yesterday.",
];

function draftToEntries(draft: DraftWorkout): EntryState[] {
  return draft.entries.map((e) => ({
    workoutExerciseId: e.workoutExerciseId,
    info: e.info,
    sets: e.sets.map((s) => ({
      id: s.id,
      weight: s.weight,
      reps: s.reps,
      done: s.done,
    })),
  }));
}

function LogPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { profile } = useProfile(user?.id);
  const [entries, setEntries] = useState<EntryState[]>([]);
  const [loadingSession, setLoadingSession] = useState(true);
  const [intro, setIntro] = useState(false);
  const [workoutId, setWorkoutId] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const subtitle = useMemo(
    () => SUBTITLES[Math.floor(Math.random() * SUBTITLES.length)],
    [],
  );
  const [exiting, setExiting] = useState(false);
  const [floaters, setFloaters] = useState<Record<string, number | null>>({});
  const [levelUpValue, setLevelUpValue] = useState<number | null>(null);
  const [levelUpPhase, setLevelUpPhase] = useState<"idle" | "in" | "out">("idle");
  const [barPhase, setBarPhase] = useState<"normal" | "fill" | "snap" | "settle">("normal");

  // Snapshot baseline XP once when profile first arrives
  const [baseXp, setBaseXp] = useState<number | null>(null);
  useEffect(() => {
    if (baseXp === null && profile) setBaseXp(profile.total_xp);
  }, [profile, baseXp]);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  // Resume an existing draft, or open a new one from sessionStorage picks.
  useEffect(() => {
    if (loading || !user) return;
    let cancelled = false;
    (async () => {
      try {
        const existing = await loadOpenWorkout();
        if (cancelled) return;
        if (existing) {
          setWorkoutId(existing.workoutId);
          setStartedAt(new Date(existing.startedAt).getTime());
          setEntries(draftToEntries(existing));
          setIntro(false); // resume silently
          setLoadingSession(false);
          sessionStorage.removeItem("kairos_picked");
          return;
        }
        const raw = sessionStorage.getItem("kairos_picked");
        const ids: string[] = raw ? JSON.parse(raw) : [];
        const draft = await openWorkout(ids);
        if (cancelled) return;
        sessionStorage.removeItem("kairos_picked");
        setWorkoutId(draft.workoutId);
        setStartedAt(new Date(draft.startedAt).getTime());
        setEntries(draftToEntries(draft));
        setIntro(true);
        setLoadingSession(false);
      } catch (e) {
        console.error("Failed to load session", e);
        if (!cancelled) setLoadingSession(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loading, user]);

  const handleIntroDone = () => {
    setIntro(false);
  };

  // Live session XP from completed sets only
  const sessionXp = useMemo(
    () =>
      entries.reduce(
        (sum, e) =>
          sum + e.sets.reduce((s, st) => s + (st.done ? xpForSet(st.reps) : 0), 0),
        0,
      ),
    [entries],
  );

  const liveTotalXp = (baseXp ?? profile?.total_xp ?? 0) + sessionXp;
  const lp = levelProgress(liveTotalXp);

  // Detect level-up
  const prevLevelRef = useRef<number | null>(null);
  useEffect(() => {
    if (baseXp === null) return;
    if (prevLevelRef.current === null) {
      prevLevelRef.current = lp.level;
      return;
    }
    if (lp.level > prevLevelRef.current) {
      const newLevel = lp.level;
      setBarPhase("fill");
      const t1 = setTimeout(() => setBarPhase("snap"), 500);
      const t2 = setTimeout(() => setBarPhase("settle"), 560);
      const t3 = setTimeout(() => setBarPhase("normal"), 620);

      setLevelUpValue(newLevel);
      setLevelUpPhase("in");
      const t4 = setTimeout(() => setLevelUpPhase("out"), 2900);
      const t5 = setTimeout(() => {
        setLevelUpPhase("idle");
        setLevelUpValue(null);
      }, 3400);

      prevLevelRef.current = lp.level;
      return () => {
        clearTimeout(t1); clearTimeout(t2); clearTimeout(t3);
        clearTimeout(t4); clearTimeout(t5);
      };
    }
    prevLevelRef.current = lp.level;
  }, [lp.level, baseXp]);

  const displayProgress =
    barPhase === "fill" ? 1 : barPhase === "snap" ? 0 : lp.progress;
  const disableBarTransition = barPhase === "snap";

  const updateSet = (ei: number, si: number, patch: Partial<SetRowState>) => {
    setEntries((prev) => {
      const next = [...prev];
      const sets = [...next[ei].sets];
      const before = sets[si];
      const after = { ...before, ...patch };
      sets[si] = after;
      next[ei] = { ...next[ei], sets };

      if (!before.done && after.done) {
        const xp = xpForSet(after.reps);
        const key = `${ei}-${si}`;
        setFloaters((f) => ({ ...f, [key]: xp }));
      }

      // Persist to DB (fire-and-forget)
      void updateDraftSet(before.id, patch).catch((err) =>
        console.error("Failed to persist set", err),
      );
      return next;
    });
  };

  const clearFloater = (key: string) =>
    setFloaters((f) => ({ ...f, [key]: null }));

  const addSet = async (ei: number) => {
    const entry = entries[ei];
    const last = entry.sets[entry.sets.length - 1];
    try {
      const seed = { weight: last?.weight ?? 0, reps: last?.reps ?? 0 };
      const created = await addDraftSet(entry.workoutExerciseId, seed);
      setEntries((prev) => {
        const next = [...prev];
        next[ei] = {
          ...next[ei],
          sets: [
            ...next[ei].sets,
            { id: created.id, weight: created.weight, reps: created.reps, done: created.done },
          ],
        };
        return next;
      });
    } catch (err) {
      console.error("Failed to add set", err);
    }
  };

  const submittingRef = useRef(false);
  const completeSession = async () => {
    if (submittingRef.current || !workoutId) return;
    submittingRef.current = true;
    setExiting(true);
    try {
      const res = await finalizeWorkout(workoutId);
      navigate({ to: "/workout/complete", search: { id: res.workoutId } });
    } catch (e) {
      console.error("finalizeWorkout failed", e);
      submittingRef.current = false;
      setExiting(false);
      navigate({ to: "/" });
    }
  };

  return (
    <MobileShell hideNav>
      {intro && <SessionIntro onDone={handleIntroDone} />}

      {exiting && (
        <div className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
          <Loader2 className="h-14 w-14 animate-spin text-primary drop-shadow-[0_0_18px_var(--primary-glow)]" />
          <div className="mt-5 text-[11px] font-black uppercase tracking-[0.4em] text-muted-foreground">
            Saving session…
          </div>
        </div>
      )}

      <div
        className={`transition-opacity duration-300 ${exiting || intro ? "opacity-0" : "opacity-100"}`}
      >
        {/* Sticky session header */}
        <div
          className="sticky top-0 z-20 -mx-5 px-5 pt-3 pb-4 backdrop-blur-md relative"
          style={{
            background:
              "linear-gradient(180deg, color-mix(in oklab, var(--background) 92%, transparent) 0%, color-mix(in oklab, var(--background) 80%, transparent) 100%)",
            borderBottom: "1px solid color-mix(in oklab, var(--border) 60%, transparent)",
          }}
        >
          <div className="flex items-center justify-between">
            <Link
              to="/workout"
              className="press flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
              Active Session
            </div>
            <div className="w-10" />
          </div>

          <div className="mt-3 text-center animate-fade-up">
            <div className="flex justify-center">
              <SessionTimer startedAt={startedAt ?? Date.now()} />
            </div>
            <div className="mt-1 text-xs italic text-muted-foreground">
              {subtitle}
            </div>
          </div>

          <div className="mt-4">
            <div className="mb-1.5 flex items-baseline justify-between">
              <div className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">
                Level {lp.level}
              </div>
              <div className="text-[11px] font-semibold tabular-nums text-muted-foreground">
                {lp.xpInLevel} / {lp.span} XP
              </div>
            </div>
            <div className={barPhase === "fill" ? "animate-glow rounded-full" : ""}>
              <XpBar progress={displayProgress} disableTransition={disableBarTransition} />
            </div>
          </div>

          {levelUpValue !== null && (
            <div className="pointer-events-none absolute inset-x-0 top-14 z-30 flex justify-center">
              <div
                className={`relative ${levelUpPhase === "out" ? "animate-level-up-out" : "animate-level-up-in"}`}
              >
                <div
                  aria-hidden="true"
                  className="animate-level-flare absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                  style={{
                    width: 260,
                    height: 260,
                    background:
                      "radial-gradient(circle, color-mix(in oklab, var(--primary-glow) 65%, transparent) 0%, transparent 70%)",
                    filter: "blur(8px)",
                  }}
                />
                <div className="relative rounded-2xl border border-primary/30 bg-background/40 px-8 py-5 text-center backdrop-blur-xl backdrop-saturate-150 shadow-[0_8px_40px_rgba(0,0,0,0.5)]">
                  <div className="text-[10px] font-black uppercase tracking-[0.5em] text-muted-foreground">
                    Level
                  </div>
                  <div
                    className="text-7xl font-black tabular-nums leading-none text-foreground"
                    style={{
                      textShadow:
                        "0 0 12px var(--primary-glow), 0 0 28px var(--primary-glow), 0 0 56px var(--primary)",
                    }}
                  >
                    {levelUpValue}
                  </div>
                  <div
                    className="mt-2 text-xl font-black uppercase tracking-[0.4em] text-primary"
                    style={{
                      textShadow:
                        "0 0 8px var(--primary-glow), 0 0 18px var(--primary-glow), 0 0 36px var(--primary)",
                    }}
                  >
                    Level Up
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {loadingSession ? (
          <div className="mt-8 space-y-4">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="card-premium h-40 rounded-2xl animate-pulse opacity-60"
              />
            ))}
          </div>
        ) : entries.length === 0 ? (
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
          <div className="mt-6 space-y-4 pb-32">
            {entries.map((entry, ei) => (
              <div
                key={entry.workoutExerciseId}
                className="card-premium animate-fade-up rounded-2xl p-4"
                style={{ animationDelay: `${ei * 60}ms` }}
              >
                <div className="mb-3 flex items-baseline justify-between">
                  <div className="text-base font-black uppercase tracking-wider">
                    {entry.info.name}
                  </div>
                  <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    {entry.info.muscle_group}
                  </div>
                </div>

                <div className="space-y-2">
                  {entry.sets.map((s, si) => {
                    const key = `${ei}-${si}`;
                    return (
                      <SetRow
                        key={s.id}
                        index={si}
                        set={s}
                        onChange={(patch) => updateSet(ei, si, patch)}
                        floatXp={floaters[key] ?? null}
                        onFloatDone={() => clearFloater(key)}
                      />
                    );
                  })}
                </div>

                <button
                  onClick={() => void addSet(ei)}
                  className="press mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border py-2.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground hover:border-primary/50 transition"
                >
                  <Plus className="h-3.5 w-3.5" /> Add set
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sticky CTA */}
      {entries.length > 0 && (
        <div className={`fixed bottom-0 left-1/2 z-30 w-full max-w-md -translate-x-1/2 px-5 pb-5 pt-6 pointer-events-none transition-opacity duration-300 ${exiting ? "opacity-0" : "opacity-100"}`}
          style={{
            background:
              "linear-gradient(180deg, transparent 0%, var(--background) 55%)",
          }}
        >
          <button
            onClick={completeSession}
            disabled={exiting}
            className="press bg-primary text-primary-foreground shadow-glow animate-glow pointer-events-auto flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-sm font-black uppercase tracking-[0.25em]"
          >
            <Flame className="h-5 w-5" />
            Complete Session
          </button>
        </div>
      )}
    </MobileShell>
  );
}
