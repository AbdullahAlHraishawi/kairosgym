import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Plus, Flame } from "lucide-react";
import { MobileShell } from "@/components/mobile-shell";
import { SessionIntro } from "@/components/session-intro";
import { SessionTimer } from "@/components/session-timer";
import { SetRow, type SetRowState } from "@/components/set-row";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/workout/log")({
  head: () => ({
    meta: [
      { title: "Active session — KAIROS" },
      { name: "description", content: "Active workout session." },
    ],
  }),
  component: LogPage,
});

type ExerciseInfo = { id: string; name: string; muscle_group: string };
type Entry = { info: ExerciseInfo; sets: SetRowState[] };

const SUBTITLES = [
  "Forge your limits.",
  "Stay disciplined.",
  "Earn every rep.",
  "Outwork yesterday.",
];

const MUSCLE_TO_TITLE: Record<string, string> = {
  Arms: "ARM DAY",
  Chest: "CHEST DAY",
  Back: "BACK DAY",
  Legs: "LEG DAY",
  Shoulders: "SHOULDER DAY",
};

function deriveTitle(entries: Entry[]): string {
  if (entries.length === 0) return "TRAINING DAY";
  const counts: Record<string, number> = {};
  for (const e of entries) {
    counts[e.info.muscle_group] = (counts[e.info.muscle_group] ?? 0) + 1;
  }
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
  return (top && MUSCLE_TO_TITLE[top]) || "TRAINING DAY";
}

function LogPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [entries, setEntries] = useState<Entry[]>([]);
  const startedAtRef = useRef<number>(Date.now());
  const subtitle = useMemo(
    () => SUBTITLES[Math.floor(Math.random() * SUBTITLES.length)],
    [],
  );
  const [exiting, setExiting] = useState(false);

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
            sets: [
              { weight: 0, reps: 0, done: false },
              { weight: 0, reps: 0, done: false },
              { weight: 0, reps: 0, done: false },
            ],
          })),
        );
      });
  }, []);

  const updateSet = (ei: number, si: number, patch: Partial<SetRowState>) => {
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

  const completeSession = () => {
    setExiting(true);
    sessionStorage.removeItem("kairos_picked");
    setTimeout(() => navigate({ to: "/" }), 350);
  };

  const title = deriveTitle(entries);

  return (
    <MobileShell hideNav>
      <SessionIntro />

      <div
        className={`transition-opacity duration-300 ${exiting ? "opacity-0" : "opacity-100"}`}
      >
        {/* Top bar */}
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

        {/* Hero */}
        <div className="mt-6 text-center animate-fade-up">
          <div
            className="text-foreground text-3xl font-black uppercase tracking-[0.25em]"
            style={{ textShadow: "0 0 20px var(--primary-glow)" }}
          >
            {title}
          </div>
          <div className="mt-3 flex justify-center">
            <SessionTimer startedAt={startedAtRef.current} />
          </div>
          <div className="mt-2 text-xs italic text-muted-foreground">
            {subtitle}
          </div>
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
          <div className="mt-8 space-y-4 pb-32">
            {entries.map((entry, ei) => (
              <div
                key={entry.info.id}
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
                  {entry.sets.map((s, si) => (
                    <SetRow
                      key={si}
                      index={si}
                      set={s}
                      onChange={(patch) => updateSet(ei, si, patch)}
                    />
                  ))}
                </div>

                <button
                  onClick={() => addSet(ei)}
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
        <div className="fixed bottom-0 left-1/2 z-30 w-full max-w-md -translate-x-1/2 px-5 pb-5 pt-6 pointer-events-none"
          style={{
            background:
              "linear-gradient(180deg, transparent 0%, var(--background) 55%)",
          }}
        >
          <button
            onClick={completeSession}
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
