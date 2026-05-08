import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { WorkoutContent } from "@/components/tabs/workout-content";
import { PlannedWorkoutsContent } from "@/components/tabs/planned-workouts-content";

export const Route = createFileRoute("/workout/")({
  head: () => ({
    meta: [
      { title: "Workout — KAIROS" },
      { name: "description", content: "Pick exercises and log your training session." },
    ],
  }),
  component: WorkoutTabs,
});

type Mode = "quick" | "planned";

function WorkoutTabs() {
  const [mode, setMode] = useState<Mode>("quick");

  return (
    <>
      <div className="mb-4 flex gap-1 rounded-2xl border border-border bg-card p-1">
        <button
          onClick={() => setMode("quick")}
          className={`press flex-1 rounded-xl px-3 py-2 text-[11px] font-black uppercase tracking-[0.2em] transition ${
            mode === "quick"
              ? "bg-primary text-primary-foreground shadow-glow"
              : "text-muted-foreground"
          }`}
        >
          Quick
        </button>
        <button
          onClick={() => setMode("planned")}
          className={`press flex-1 rounded-xl px-3 py-2 text-[11px] font-black uppercase tracking-[0.2em] transition ${
            mode === "planned"
              ? "bg-primary text-primary-foreground shadow-glow"
              : "text-muted-foreground"
          }`}
        >
          Planned
        </button>
      </div>

      {/* Both panels stay mounted so search/scroll state is preserved across switches. */}
      <div className={mode === "quick" ? "block animate-fade-up" : "hidden"}>
        <WorkoutContent />
      </div>
      <div className={mode === "planned" ? "block animate-fade-up" : "hidden"}>
        <PlannedWorkoutsContent />
      </div>
    </>
  );
}
