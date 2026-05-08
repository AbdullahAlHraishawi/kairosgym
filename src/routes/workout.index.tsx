import { createFileRoute } from "@tanstack/react-router";

import { WorkoutTabsPanel } from "@/components/tabs/workout-tabs-panel";

export const Route = createFileRoute("/workout/")({
  head: () => ({
    meta: [
      { title: "Workout — KAIROS" },
      { name: "description", content: "Pick exercises and log your training session." },
    ],
  }),
  component: WorkoutTabsPanel,
});
