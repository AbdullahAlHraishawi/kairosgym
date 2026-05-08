import { createFileRoute } from "@tanstack/react-router";

import { LeaderboardContent } from "@/components/tabs/leaderboard-content";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({
    meta: [
      { title: "Leaderboard — KAIROS" },
      { name: "description", content: "Top-ranked KAIROS warriors by total XP." },
    ],
  }),
  component: LeaderboardContent,
});
