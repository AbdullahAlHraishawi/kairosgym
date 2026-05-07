import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search, Plus, ArrowRight, Dumbbell } from "lucide-react";
import { MobileShell } from "@/components/mobile-shell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/workout/")({
  head: () => ({
    meta: [
      { title: "Workout — KAIROS" },
      { name: "description", content: "Pick exercises and log your training session." },
    ],
  }),
  component: WorkoutPage,
});

type Exercise = { id: string; name: string; muscle_group: string; equipment: string };

const FILTERS = ["All", "Chest", "Back", "Legs", "Shoulders", "Arms"] as const;

function WorkoutPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<string[]>([]);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  useEffect(() => {
    void supabase
      .from("exercises")
      .select("*")
      .order("muscle_group")
      .then(({ data }) => setExercises((data ?? []) as Exercise[]));
  }, []);

  const filtered = useMemo(() => {
    return exercises.filter(
      (e) =>
        (filter === "All" || e.muscle_group === filter) &&
        e.name.toLowerCase().includes(query.toLowerCase())
    );
  }, [exercises, filter, query]);

  const toggle = (id: string) =>
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const start = () => {
    if (picked.length === 0) return;
    sessionStorage.setItem("kairos_picked", JSON.stringify(picked));
    navigate({ to: "/workout/log" });
  };

  return (
    <MobileShell>
      {/* Hero */}
      <div className="animate-fade-up bg-card relative overflow-hidden rounded-2xl border border-border p-5">
        <div
          className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-40"
          style={{ background: "radial-gradient(circle, var(--primary-glow), transparent 70%)" }}
        />
        <div className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
          Build your session
        </div>
        <div className="text-foreground mt-1 text-2xl font-black leading-tight">
          Forge today's <span className="text-primary">battle</span>.
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          +100 XP per workout · +10 XP per set
        </div>
      </div>

      {/* Search */}
      <div className="bg-card mt-4 flex items-center gap-2 rounded-xl border border-border px-3 py-2.5">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search exercise..."
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>

      {/* Filters */}
      <div className="no-scrollbar -mx-5 mt-3 flex gap-2 overflow-x-auto px-5">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`press shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider transition ${
              filter === f
                ? "bg-primary text-primary-foreground border-primary shadow-glow"
                : "bg-card border-border text-muted-foreground"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="mt-4 space-y-2">
        {filtered.map((ex) => {
          const on = picked.includes(ex.id);
          return (
            <button
              key={ex.id}
              onClick={() => toggle(ex.id)}
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
                <Plus className={`h-4 w-4 transition ${on ? "rotate-45" : ""}`} />
              </div>
            </button>
          );
        })}
        {filtered.length === 0 && (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No exercises match.
          </div>
        )}
      </div>

      {/* Sticky CTA */}
      {picked.length > 0 && (
        <div className="animate-fade-up fixed bottom-20 left-1/2 z-30 w-full max-w-md -translate-x-1/2 px-5">
          <button
            onClick={start}
            className="press bg-primary text-primary-foreground shadow-glow flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-sm font-bold uppercase tracking-[0.2em]"
          >
            Start workout · {picked.length} <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {picked.length === 0 && (
        <Link
          to="/workout/log"
          onClick={(e) => {
            sessionStorage.removeItem("kairos_picked");
          }}
          className="press bg-card text-foreground mt-6 flex w-full items-center justify-center gap-2 rounded-2xl border border-border py-3 text-sm font-semibold"
        >
          Create empty workout
        </Link>
      )}
    </MobileShell>
  );
}
