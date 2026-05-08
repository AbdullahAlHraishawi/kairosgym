import { createFileRoute } from "@tanstack/react-router";

import { HomeContent } from "@/components/tabs/home-content";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "KAIROS — Your training dashboard" },
      {
        name: "description",
        content:
          "See your level, streak, and today's progress. Log workouts and earn XP.",
      },
    ],
  }),
  component: HomeContent,
});
