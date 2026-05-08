import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Calendar, Dumbbell, Pencil, Play, Loader2, Settings2 } from "lucide-react";

import { useAuth } from "@/hooks/use-auth";
import { listPlans, getPlan, dayDisplayName, type PlanSummary, type PlanFull } from "@/lib/plans";
import { openWorkoutFromPlanDay } from "@/lib/workout";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

function relativeDate(iso: string) {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const day = 86400000;
  if (diff < day) return "Today";
  if (diff < 2 * day) return "Yesterday";
  if (diff < 7 * day) return `${Math.floor(diff / day)}d ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function PlannedWorkoutsContent() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [plans, setPlans] = useState<PlanSummary[] | null>(null);
  const [startPlan, setStartPlan] = useState<PlanFull | null>(null);
  const [startLoading, setStartLoading] = useState(false);
  const [launching, setLaunching] = useState(false);

  useEffect(() => {
    if (authLoading || !user) return;
    void listPlans()
      .then(setPlans)
      .catch((e) => {
        console.error(e);
        setPlans([]);
      });
  }, [authLoading, user]);

  const openStartSheet = async (planId: string) => {
    setStartLoading(true);
    try {
      const full = await getPlan(planId);
      setStartPlan(full);
    } finally {
      setStartLoading(false);
    }
  };

  const launchDay = async (dayId: string) => {
    if (launching) return;
    setLaunching(true);
    try {
      const draft = await openWorkoutFromPlanDay(dayId);
      // Mark log page so it knows there's an open workout (no picks needed)
      sessionStorage.setItem("kairos_planned_launch", draft.workoutId);
      navigate({ to: "/workout/log" });
    } catch (e) {
      console.error("Failed to start planned session", e);
      setLaunching(false);
    }
  };

  if (plans === null) {
    return (
      <div className="mt-10 flex justify-center text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <>
      {plans.length === 0 ? (
        <div className="animate-fade-up bg-card relative overflow-hidden rounded-2xl border border-border p-6 text-center">
          <div
            className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full opacity-40"
            style={{
              background: "radial-gradient(circle, var(--primary-glow), transparent 70%)",
            }}
          />
          <div className="text-foreground text-2xl font-black leading-tight">
            Build your <span className="text-primary">training path</span>.
          </div>
          <div className="mx-auto mt-2 max-w-[260px] text-xs text-muted-foreground">
            Create structured workouts and evolve consistently.
          </div>
          <Link
            to="/workout/plans/new"
            className="press bg-primary text-primary-foreground shadow-glow mt-5 inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-xs font-black uppercase tracking-[0.25em]"
          >
            <Plus className="h-4 w-4" /> Create Plan
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {plans.map((p, i) => (
              <div
                key={p.id}
                className="card-premium animate-fade-up relative overflow-hidden rounded-2xl p-4"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <span
                  aria-hidden="true"
                  className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full bg-primary"
                  style={{ boxShadow: "0 0 12px var(--primary-glow)" }}
                />
                <div className="pl-2">
                  <div className="flex items-baseline justify-between gap-3">
                    <div className="text-base font-black uppercase tracking-wider truncate">
                      {p.name}
                    </div>
                    <div className="shrink-0 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                      {relativeDate(p.updatedAt)}
                    </div>
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-[11px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> {p.dayCount} {p.dayCount === 1 ? "Day" : "Days"}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Dumbbell className="h-3 w-3" /> {p.exerciseCount} Exercises
                    </span>
                  </div>
                  <div className="mt-3 flex gap-2">
                    {p.exerciseCount === 0 ? (
                      <Link
                        to="/workout/plans/$planId"
                        params={{ planId: p.id }}
                        className="press bg-primary text-primary-foreground shadow-glow flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-[11px] font-black uppercase tracking-[0.2em]"
                      >
                        <Settings2 className="h-3.5 w-3.5" /> Set up
                      </Link>
                    ) : (
                      <button
                        onClick={() => void openStartSheet(p.id)}
                        disabled={p.dayCount === 0}
                        className="press bg-primary text-primary-foreground shadow-glow flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-[11px] font-black uppercase tracking-[0.2em] disabled:opacity-40"
                      >
                        <Play className="h-3.5 w-3.5" /> Start
                      </button>
                    )}
                    <Link
                      to="/workout/plans/$planId"
                      params={{ planId: p.id }}
                      className="press bg-card border border-border text-foreground flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-[11px] font-black uppercase tracking-[0.2em]"
                    >
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Link
            to="/workout/plans/new"
            className="press bg-card border border-dashed border-border text-foreground mt-4 flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-xs font-bold uppercase tracking-[0.2em] hover:border-primary/50 hover:text-primary transition"
          >
            <Plus className="h-4 w-4" /> New Plan
          </Link>
        </>
      )}

      <Sheet
        open={startLoading || !!startPlan}
        onOpenChange={(o) => {
          if (!o) {
            setStartPlan(null);
          }
        }}
      >
        <SheetContent side="bottom" className="border-t border-border bg-background">
          <SheetHeader>
            <SheetTitle className="text-left text-base font-black uppercase tracking-wider">
              {startPlan?.name ?? "Loading…"}
            </SheetTitle>
            <SheetDescription className="text-left text-xs">
              Pick a day to start.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-4 space-y-2 pb-6">
            {startLoading && (
              <div className="flex justify-center py-6 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            )}
            {startPlan?.days.map((d) => {
              const empty = d.exerciseCount === 0;
              if (empty) {
                return (
                  <Link
                    key={d.id}
                    to="/workout/plans/$planId/day/$dayId"
                    params={{ planId: startPlan.id, dayId: d.id }}
                    onClick={() => setStartPlan(null)}
                    className="press bg-card flex w-full items-center justify-between gap-3 rounded-xl border border-border p-3 text-left"
                  >
                    <div>
                      <div className="text-sm font-bold">{dayDisplayName(d)}</div>
                      <div className="text-[11px] text-muted-foreground">
                        Empty · tap to add exercises
                      </div>
                    </div>
                    <Pencil className="h-4 w-4 text-primary" />
                  </Link>
                );
              }
              return (
                <button
                  key={d.id}
                  onClick={() => void launchDay(d.id)}
                  disabled={launching}
                  className="press bg-card flex w-full items-center justify-between gap-3 rounded-xl border border-border p-3 text-left disabled:opacity-40"
                >
                  <div>
                    <div className="text-sm font-bold">{dayDisplayName(d)}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {d.exerciseCount} {d.exerciseCount === 1 ? "exercise" : "exercises"}
                    </div>
                  </div>
                  <Play className="h-4 w-4 text-primary" />
                </button>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
