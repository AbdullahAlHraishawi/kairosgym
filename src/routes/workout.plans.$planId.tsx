import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Plus,
  MoreVertical,
  Loader2,
  ChevronRight,
  Trash2,
  Search,
  Dumbbell,
  Pencil,
  Settings2,
} from "lucide-react";

import { MobileShell } from "@/components/mobile-shell";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import {
  addDay,
  addPlanExercise,
  dayDisplayName,
  deleteDay,
  deletePlan,
  duplicateDay,
  getPlan,
  renameDay,
  renamePlan,
  type PlanFull,
} from "@/lib/plans";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

export const Route = createFileRoute("/workout/plans/$planId")({
  head: () => ({
    meta: [
      { title: "Edit plan — KAIROS" },
      { name: "description", content: "Edit your workout plan." },
    ],
  }),
  component: PlanEditorPage,
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

function PlanEditorPage() {
  const { planId } = Route.useParams();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [plan, setPlan] = useState<PlanFull | null>(null);
  const [name, setName] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [renameTarget, setRenameTarget] = useState<{
    id: string;
    label: string;
    placeholder: string;
  } | null>(null);
  const [renameValue, setRenameValue] = useState("");

  // Inline exercise picker for a specific day
  const [pickerDayId, setPickerDayId] = useState<string | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [muscleFilter, setMuscleFilter] =
    useState<(typeof MUSCLE_FILTERS)[number]>("All");
  const [query, setQuery] = useState("");
  const [pendingAdd, setPendingAdd] = useState<Set<string>>(new Set());
  const [addedThisSession, setAddedThisSession] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  const refresh = async () => {
    const p = await getPlan(planId);
    setPlan(p);
    if (p) setName(p.name);
  };

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planId]);

  useEffect(() => {
    void supabase
      .from("exercises")
      .select("id, name, muscle_group, equipment, aliases")
      .order("muscle_group")
      .order("name")
      .then(({ data }) => setExercises((data ?? []) as Exercise[]));
  }, []);

  const filtered = useMemo(
    () =>
      exercises.filter(
        (e) =>
          (muscleFilter === "All" || e.muscle_group === muscleFilter) &&
          matchesQuery(e, query),
      ),
    [exercises, muscleFilter, query],
  );

  const onNameBlur = async () => {
    if (!plan || name.trim() === plan.name) return;
    await renamePlan(planId, name);
    setPlan({ ...plan, name: name.trim() || "My Plan" });
  };

  const onAddDay = async () => {
    await addDay(planId);
    await refresh();
  };

  const onDuplicate = async (dayId: string) => {
    await duplicateDay(dayId);
    await refresh();
  };

  const onDelete = async (dayId: string) => {
    await deleteDay(dayId);
    await refresh();
  };

  const openRename = (dayId: string, current: string | null, fallback: string) => {
    setRenameTarget({ id: dayId, label: "Rename day", placeholder: fallback });
    setRenameValue(current ?? "");
  };

  const submitRename = async () => {
    if (!renameTarget) return;
    await renameDay(renameTarget.id, renameValue);
    setRenameTarget(null);
    await refresh();
  };

  const onDeletePlan = async () => {
    await deletePlan(planId);
    navigate({ to: "/workout" });
  };

  const openPicker = (dayId: string) => {
    setPickerDayId(dayId);
    setQuery("");
    setMuscleFilter("All");
    setAddedThisSession(new Set());
  };

  const closePicker = () => {
    setPickerDayId(null);
    if (addedThisSession.size > 0) {
      void refresh();
    }
  };

  const onPickExercise = async (exerciseId: string) => {
    if (!pickerDayId || pendingAdd.has(exerciseId)) return;
    setPendingAdd((s) => new Set(s).add(exerciseId));
    try {
      await addPlanExercise(pickerDayId, exerciseId);
      setAddedThisSession((s) => new Set(s).add(exerciseId));
      // Optimistically bump the day's exercise count
      setPlan((prev) =>
        prev
          ? {
              ...prev,
              days: prev.days.map((d) =>
                d.id === pickerDayId
                  ? { ...d, exerciseCount: d.exerciseCount + 1 }
                  : d,
              ),
            }
          : prev,
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

  const pickerDay = plan?.days.find((d) => d.id === pickerDayId) ?? null;

  if (!plan) {
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
          to="/workout"
          className="press flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
          Edit Plan
        </div>
        <div className="w-10" />
      </div>

      <div className="mt-6">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => void onNameBlur()}
          maxLength={60}
          className="w-full bg-transparent text-3xl font-black uppercase tracking-wider outline-none"
        />
        <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          {plan.days.length} {plan.days.length === 1 ? "Day" : "Days"}
        </div>
      </div>

      <div className="mt-6 space-y-2">
        {plan.days.map((d, i) => {
          const display = dayDisplayName(d);
          const fallback = `Day ${d.dayIndex + 1}`;
          const empty = d.exerciseCount === 0;
          return (
            <div
              key={d.id}
              className="card-premium animate-fade-up rounded-xl p-3"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openPicker(d.id)}
                  className="press flex flex-1 items-center gap-3 text-left"
                >
                  <div className="bg-secondary text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-black">
                    {d.dayIndex + 1}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold">{display}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {d.exerciseCount} {d.exerciseCount === 1 ? "exercise" : "exercises"}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="press flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openRename(d.id, d.name, fallback)}>
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => void onDuplicate(d.id)}>
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => void onDelete(d.id)}
                      className="text-destructive focus:text-destructive"
                    >
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => openPicker(d.id)}
                  className={`press flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-[10px] font-black uppercase tracking-[0.2em] ${
                    empty
                      ? "bg-primary text-primary-foreground shadow-glow"
                      : "bg-card border border-border text-foreground"
                  }`}
                >
                  <Plus className="h-3 w-3" /> Add exercises
                </button>
                <Link
                  to="/workout/plans/$planId/day/$dayId"
                  params={{ planId, dayId: d.id }}
                  className="press bg-card border border-border text-foreground flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-[10px] font-black uppercase tracking-[0.2em]"
                >
                  <Settings2 className="h-3 w-3" /> Sets & reps
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={() => void onAddDay()}
        className="press bg-card border border-dashed border-border text-foreground mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold uppercase tracking-[0.2em] hover:border-primary/50 hover:text-primary transition"
      >
        <Plus className="h-4 w-4" /> Add Day
      </button>

      <button
        onClick={() => setConfirmDelete(true)}
        className="press text-destructive mt-10 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-[11px] font-black uppercase tracking-[0.25em]"
      >
        <Trash2 className="h-4 w-4" /> Delete Plan
      </button>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this plan?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes all days, exercises and sets.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void onDeletePlan()}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!renameTarget} onOpenChange={(o) => !o && setRenameTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{renameTarget?.label}</DialogTitle>
            <DialogDescription>Leave empty to use the default name.</DialogDescription>
          </DialogHeader>
          <input
            autoFocus
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            placeholder={renameTarget?.placeholder}
            maxLength={40}
            className="bg-card mt-2 w-full rounded-xl border border-border px-4 py-3 text-base font-semibold outline-none ring-primary/40 focus:ring-2"
          />
          <DialogFooter>
            <button
              onClick={() => setRenameTarget(null)}
              className="press rounded-xl border border-border bg-card px-4 py-2 text-xs font-bold uppercase tracking-wider"
            >
              Cancel
            </button>
            <button
              onClick={() => void submitRename()}
              className="press bg-primary text-primary-foreground rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider"
            >
              Save
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet
        open={!!pickerDayId}
        onOpenChange={(o) => {
          if (!o) closePicker();
        }}
      >
        <SheetContent
          side="bottom"
          className="border-t border-border bg-background max-h-[88vh] overflow-y-auto"
        >
          <SheetHeader>
            <SheetTitle className="text-left text-base font-black uppercase tracking-wider">
              {pickerDay ? dayDisplayName(pickerDay) : "Add exercises"}
            </SheetTitle>
            <SheetDescription className="text-left text-xs">
              Tap to add. Edit sets and reps in the day editor.
            </SheetDescription>
          </SheetHeader>

          <div className="bg-card mt-4 flex items-center gap-2 rounded-xl border border-border px-3 py-2.5">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search exercise..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>

          <div className="no-scrollbar -mx-6 mt-3 flex gap-2 overflow-x-auto px-6">
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

          <div className="mt-3 space-y-2 pb-6">
            {filtered.map((ex) => {
              const added = addedThisSession.has(ex.id);
              const pending = pendingAdd.has(ex.id);
              return (
                <button
                  key={ex.id}
                  onClick={() => void onPickExercise(ex.id)}
                  disabled={pending}
                  className={`press bg-card flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
                    added ? "border-primary shadow-glow" : "border-border"
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
                      added
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {pending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                  </div>
                </button>
              );
            })}
            {filtered.length === 0 && exercises.length > 0 && (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No exercises match.
              </div>
            )}
            {exercises.length === 0 && (
              <div className="flex justify-center py-8 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            )}
          </div>

          {pickerDay && (
            <div className="sticky bottom-0 -mx-6 border-t border-border bg-background px-6 py-3">
              <Link
                to="/workout/plans/$planId/day/$dayId"
                params={{ planId, dayId: pickerDay.id }}
                onClick={closePicker}
                className="press bg-card border border-border text-foreground flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-[11px] font-black uppercase tracking-[0.2em]"
              >
                <Pencil className="h-3.5 w-3.5" /> Edit sets & reps
              </Link>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </MobileShell>
  );
}
