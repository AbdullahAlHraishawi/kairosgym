import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";

import { MobileShell } from "@/components/mobile-shell";
import { useAuth } from "@/hooks/use-auth";
import { createPlan } from "@/lib/plans";

export const Route = createFileRoute("/workout/plans/new")({
  head: () => ({
    meta: [
      { title: "New plan — KAIROS" },
      { name: "description", content: "Create a new workout plan." },
    ],
  }),
  component: NewPlanPage,
});

const PRESETS = [2, 3, 4, 5, 6];

function NewPlanPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [name, setName] = useState("My Plan");
  const [days, setDays] = useState(3);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  const submit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const id = await createPlan(name, days);
      navigate({ to: "/workout/plans/$planId", params: { planId: id } });
    } catch (e) {
      console.error(e);
      setSubmitting(false);
    }
  };

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
          New Plan
        </div>
        <div className="w-10" />
      </div>

      <div className="mt-8 animate-fade-up">
        <div className="text-foreground text-3xl font-black leading-tight">
          Forge your <span className="text-primary">structure</span>.
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          Name it. Pick your training days.
        </div>
      </div>

      <div className="mt-8">
        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">
          Plan name
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Push Pull Legs"
          maxLength={60}
          className="bg-card mt-2 w-full rounded-xl border border-border px-4 py-3 text-base font-semibold outline-none ring-primary/40 focus:ring-2"
        />
      </div>

      <div className="mt-6">
        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">
          Training days
        </label>
        <div className="mt-2 grid grid-cols-5 gap-2">
          {PRESETS.map((n) => (
            <button
              key={n}
              onClick={() => setDays(n)}
              className={`press rounded-xl py-3 text-base font-black tabular-nums transition ${
                days === n
                  ? "bg-primary text-primary-foreground shadow-glow"
                  : "bg-card border border-border text-muted-foreground"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={() => setDays((d) => Math.max(1, d - 1))}
            className="press bg-card flex h-10 w-10 items-center justify-center rounded-xl border border-border text-lg font-black"
          >
            −
          </button>
          <div className="bg-card flex-1 rounded-xl border border-border py-2.5 text-center text-sm font-semibold">
            {days} {days === 1 ? "day" : "days"}
          </div>
          <button
            onClick={() => setDays((d) => Math.min(14, d + 1))}
            className="press bg-card flex h-10 w-10 items-center justify-center rounded-xl border border-border text-lg font-black"
          >
            +
          </button>
        </div>
      </div>

      <button
        onClick={() => void submit()}
        disabled={submitting || !name.trim()}
        className="press bg-primary text-primary-foreground shadow-glow animate-glow mt-10 flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-sm font-black uppercase tracking-[0.25em] disabled:opacity-50"
      >
        {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
        Create Plan
      </button>
    </MobileShell>
  );
}
