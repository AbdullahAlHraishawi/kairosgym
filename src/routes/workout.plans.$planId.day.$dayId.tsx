import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Plus,
  Loader2,
  Search,
  Dumbbell,
  Trash2,
  ChevronUp,
  ChevronDown,
  Copy,
  X,
} from "lucide-react";

import { MobileShell } from "@/components/mobile-shell";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import {
  addPlanExercise,
  addPlanSet,
  copyExercisesToDay,
  dayDisplayName,
  getDay,
  listSiblingDays,
  removePlanExercise,
  removePlanSet,
  renameDay,
  reorderPlanExercises,
  updatePlanSet,
  type DayFull,
  type PlanExercise,
} from "@/lib/plans";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

export const Route = createFileRoute("/workout/plans/$planId/day/$dayId")({
  head: () => ({
    meta: [
      { title: "Edit day — KAIROS" },
      { name: "description", content: "Edit a workout day." },
    ],
  }),
  component: DayEditorPage,
});

const MUSCLE_FILTERS = [
  "All",
  "Chest",
  "Back",
  "Legs",
  "Shoulders",
  "Arms",
  "Core",
  "Glutes",
  "Forearms",
  "Calves",
  "Full Body",
  "Cardio",
] as const;

type Exercise = {
  id: string;
  name: string;
  muscle_group: string;
  equipment: string;
  aliases?: string[] | null;
};

function initials(name: string) {
  return name
    .split(/[\s-]+/)
    .map((w) => w[0])
    .join("")
    .toLowerCase();
}

function matchesQuery(ex: Exercise, q: string) {
  if (!q) return true;
  const needle = q.toLowerCase().trim();
  if (ex.name.toLowerCase().includes(needle)) return true;
  if (ex.muscle_group.toLowerCase().includes(needle)) return true;
  if (ex.equipment.toLowerCase().includes(needle)) return true;
  if ((ex.aliases ?? []).some((a) => a.toLowerCase().includes(needle))) return true;
  if (initials(ex.name).startsWith(needle)) return true;
  return false;
}

function DayEditorPage() {
  const { planId, dayId } = Route.useParams();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [day, setDay] = useState<DayFull | null>(null);
  const [name, setName] = useState("");
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [muscleFilter, setMuscleFilter] = useState<(typeof MUSCLE_FILTERS)[number]>("All");
  const [query, setQuery] = useState("");
  const [pendingAdd, setPendingAdd] = useState<Set<string>>(new Set());
  const [copySheetOpen, setCopySheetOpen] = useState(false);
  const [siblingDays, setSiblingDays] = useState<
    { id: string; dayIndex: number; name: string | null }[]
  >([]);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  useEffect(() => {
    void supabase
      .from("exercises")
      .select("id, name, muscle_group, equipment, aliases")
      .order("muscle_group")
      .order("name")
      .then(({ data }) => setExercises((data ?? []) as Exercise[]));
  }, []);

  const refresh = async () => {
    const d = await getDay(dayId);
    setDay(d);
    if (d) setName(d.name ?? "");
  };

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayId]);

  const addedIds = useMemo(
    () => new Set((day?.exercises ?? []).map((e) => e.exerciseId)),
    [day],
  );

  const filtered = useMemo(
    () =>
      exercises.filter(
        (e) =>
          (muscleFilter === "All" || e.muscle_group === muscleFilter) &&
          matchesQuery(e, query),
      ),
    [exercises, muscleFilter, query],
  );

  const fallback = day ? `Day ${day.dayIndex + 1}` : "";

  const onNameBlur = async () => {
    if (!day) return;
    const trimmed = name.trim();
    if ((day.name ?? "") === trimmed) return;
    await renameDay(dayId, trimmed || null);
    setDay({ ...day, name: trimmed || null });
  };

  const toggleExercise = async (exerciseId: string) => {
    if (!day) return;
    if (addedIds.has(exerciseId)) {
      const existing = day.exercises.find((e) => e.exerciseId === exerciseId);
      if (!existing) return;
      // optimistic
      setDay({ ...day, exercises: day.exercises.filter((e) => e.id !== existing.id) });
      try {
        await removePlanExercise(existing.id);
      } catch {
        await refresh();
      }
      return;
    }
    if (pendingAdd.has(exerciseId)) return;
    setPendingAdd((s) => new Set(s).add(exerciseId));
    try {
      const created = await addPlanExercise(dayId, exerciseId);
      setDay((prev) =>
        prev ? { ...prev, exercises: [...prev.exercises, created] } : prev,
      );
    } catch (e) {
      console.error(e);
    } finally {
      setPendingAdd((s) => {
        const n = new Set(s);
        n.delete(exerciseId);
        return n;
      });
    }
  };

  const updateLocalExercise = (peId: string, fn: (pe: PlanExercise) => PlanExercise) => {
    setDay((prev) =>
      prev
        ? { ...prev, exercises: prev.exercises.map((e) => (e.id === peId ? fn(e) : e)) }
        : prev,
    );
  };

  const onSetChange = (peId: string, setId: string, patch: Partial<{ weight: number; reps: number }>) => {
    updateLocalExercise(peId, (pe) => ({
      ...pe,
      sets: pe.sets.map((s) => (s.id === setId ? { ...s, ...patch } : s)),
    }));
    void updatePlanSet(setId, patch).catch((e) => console.error(e));
  };

  const onAddSet = async (pe: PlanExercise) => {
    const last = pe.sets[pe.sets.length - 1];
    const seed = { weight: last?.weight ?? 0, reps: last?.reps ?? 0 };
    try {
      const created = await addPlanSet(pe.id, seed);
      updateLocalExercise(pe.id, (cur) => ({ ...cur, sets: [...cur.sets, created] }));
    } catch (e) {
      console.error(e);
    }
  };

  const onRemoveSet = async (peId: string, setId: string) => {
    updateLocalExercise(peId, (pe) => ({ ...pe, sets: pe.sets.filter((s) => s.id !== setId) }));
    try {
      await removePlanSet(setId);
    } catch {
      await refresh();
    }
  };

  const onRemoveExercise = async (peId: string) => {
    setDay((prev) =>
      prev ? { ...prev, exercises: prev.exercises.filter((e) => e.id !== peId) } : prev,
    );
    try {
      await removePlanExercise(peId);
    } catch {
      await refresh();
    }
  };

  const move = async (peId: string, dir: -1 | 1) => {
    if (!day) return;
    const idx = day.exercises.findIndex((e) => e.id === peId);
    const target = idx + dir;
    if (idx < 0 || target < 0 || target >= day.exercises.length) return;
    const next = [...day.exercises];
    [next[idx], next[target]] = [next[target], next[idx]];
    setDay({ ...day, exercises: next });
    void reorderPlanExercises(dayId, next.map((e) => e.id));
  };

  const openCopySheet = async () => {
    const sibs = await listSiblingDays(planId, dayId);
    setSiblingDays(sibs);
    setCopySheetOpen(true);
  };

  const onCopyFrom = async (sourceDayId: string) => {
    setCopySheetOpen(false);
    await copyExercisesToDay(sourceDayId, dayId);
    await refresh();
  };

  if (!day) {
    return (
      <MobileShell hideNav>
        <div className="mt-20 flex justify-center text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </MobileShell>
    );
  }

  return (
    <MobileShell hideNav>
      <div className="flex items-center justify-between">
        <Link
          to="/workout/plans/$planId"
          params={{ planId }}
          className="press flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
          Edit Day
        </div>
        <div className="w-10" />
      </div>

      <div className="mt-6">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => void onNameBlur()}
          placeholder={fallback}
          maxLength={40}
          className="w-full bg-transparent text-2xl font-black uppercase tracking-wider outline-none placeholder:text-muted-foreground/50"
        />
        <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          {dayDisplayName(day)} · {day.exercises.length} exercises
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {day.exercises.map((pe, i) => (
          <div
            key={pe.id}
            className="card-premium rounded-2xl p-4"
          >
            <div className="mb-3 flex items-baseline justify-between gap-2">
              <div>
                <div className="text-base font-black uppercase tracking-wider">
                  {pe.info.name}
                </div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  {pe.info.muscle_group}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => void move(pe.id, -1)}
                  disabled={i === 0}
                  aria-label="Move up"
                  className="press flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground disabled:opacity-30"
                >
                  <ChevronUp className="h-4 w-4" />
                </button>
                <button
                  onClick={() => void move(pe.id, 1)}
                  disabled={i === day.exercises.length - 1}
                  aria-label="Move down"
                  className="press flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground disabled:opacity-30"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
                <button
                  onClick={() => void onRemoveExercise(pe.id)}
                  aria-label="Remove exercise"
                  className="press text-destructive flex h-8 w-8 items-center justify-center rounded-lg border border-border"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {pe.sets.map((s, si) => (
                <div
                  key={s.id}
                  className="flex items-center gap-2 rounded-xl border border-border bg-secondary/30 px-2.5 py-2"
                >
                  <div className="bg-background/60 text-muted-foreground flex h-9 w-12 shrink-0 items-center justify-center rounded-lg text-[10px] font-black uppercase tracking-wider">
                    SET<span className="ml-0.5">{si + 1}</span>
                  </div>
                  <div className="relative flex-1">
                    <input
                      type="number"
                      inputMode="decimal"
                      value={s.weight || ""}
                      onChange={(e) =>
                        onSetChange(pe.id, s.id, { weight: parseFloat(e.target.value) || 0 })
                      }
                      placeholder="0"
                      className="w-full rounded-lg border border-border bg-background/60 px-3 py-2 pr-8 text-base font-semibold tabular-nums outline-none ring-primary/40 focus:ring-2"
                    />
                    <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] uppercase tracking-wider text-muted-foreground">
                      kg
                    </span>
                  </div>
                  <div className="relative flex-1">
                    <input
                      type="number"
                      inputMode="numeric"
                      value={s.reps || ""}
                      onChange={(e) =>
                        onSetChange(pe.id, s.id, { reps: parseInt(e.target.value) || 0 })
                      }
                      placeholder="0"
                      className="w-full rounded-lg border border-border bg-background/60 px-3 py-2 pr-10 text-base font-semibold tabular-nums outline-none ring-primary/40 focus:ring-2"
                    />
                    <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] uppercase tracking-wider text-muted-foreground">
                      reps
                    </span>
                  </div>
                  <button
                    onClick={() => void onRemoveSet(pe.id, s.id)}
                    aria-label="Remove set"
                    className="press text-muted-foreground flex h-9 w-9 items-center justify-center rounded-lg border border-border"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={() => void onAddSet(pe)}
              className="press mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border py-2.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground hover:border-primary/50 transition"
            >
              <Plus className="h-3.5 w-3.5" /> Add set
            </button>
          </div>
        ))}
      </div>

      {day.exercises.length === 0 && (
        <div className="mt-6 rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
          No exercises yet. Add some below.
        </div>
      )}

      <button
        onClick={() => void openCopySheet()}
        className="press bg-card border border-border text-foreground mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-[11px] font-bold uppercase tracking-[0.2em]"
      >
        <Copy className="h-3.5 w-3.5" /> Copy from another day
      </button>

      <div className="mt-8">
        <div className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">
          Add exercises
        </div>

        <div className="bg-card mt-2 flex items-center gap-2 rounded-xl border border-border px-3 py-2.5">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search exercise..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>

        <div className="no-scrollbar -mx-5 mt-3 flex gap-2 overflow-x-auto px-5">
          {MUSCLE_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setMuscleFilter(f)}
              className={`press shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider transition ${
                muscleFilter === f
                  ? "bg-primary text-primary-foreground border-primary shadow-glow"
                  : "bg-card border-border text-muted-foreground"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="mt-3 space-y-2 pb-10">
          {filtered.map((ex) => {
            const on = addedIds.has(ex.id);
            const pending = pendingAdd.has(ex.id);
            return (
              <button
                key={ex.id}
                onClick={() => void toggleExercise(ex.id)}
                disabled={pending}
                className={`press bg-card flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
                  on ? "border-primary shadow-glow" : "border-border"
                }`}
              >
                <div className="bg-secondary flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
                  <Dumbbell className="text-primary h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold">{ex.name}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {ex.muscle_group} · {ex.equipment}
                  </div>
                </div>
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full transition ${
                    on ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {pending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className={`h-4 w-4 transition ${on ? "rotate-45" : ""}`} />
                  )}
                </div>
              </button>
            );
          })}
          {filtered.length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No exercises match.
            </div>
          )}
        </div>
      </div>

      <Sheet open={copySheetOpen} onOpenChange={setCopySheetOpen}>
        <SheetContent side="bottom" className="border-t border-border bg-background">
          <SheetHeader>
            <SheetTitle className="text-left text-base font-black uppercase tracking-wider">
              Copy from day
            </SheetTitle>
            <SheetDescription className="text-left text-xs">
              Exercises and sets are appended.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-4 space-y-2 pb-6">
            {siblingDays.length === 0 && (
              <div className="py-4 text-center text-xs text-muted-foreground">
                No other days yet.
              </div>
            )}
            {siblingDays.map((d) => (
              <button
                key={d.id}
                onClick={() => void onCopyFrom(d.id)}
                className="press bg-card flex w-full items-center justify-between gap-3 rounded-xl border border-border p-3 text-left"
              >
                <div className="text-sm font-bold">{dayDisplayName(d)}</div>
                <Copy className="h-4 w-4 text-primary" />
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </MobileShell>
  );
}
