import { createFileRoute } from "@tanstack/react-router";

import { WorkoutContent } from "@/components/tabs/workout-content";

export const Route = createFileRoute("/workout/")({
  head: () => ({
    meta: [
      { title: "Workout — KAIROS" },
      { name: "description", content: "Pick exercises and log your training session." },
    ],
  }),
  component: WorkoutContent,
});
