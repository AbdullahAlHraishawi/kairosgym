import { createFileRoute } from "@tanstack/react-router";

import { ProgressContent } from "@/components/tabs/progress-content";

export const Route = createFileRoute("/progress")({
  head: () => ({
    meta: [
      { title: "Progress — KAIROS" },
      { name: "description", content: "Your weekly XP, lifetime stats and trained muscles." },
    ],
  }),
  component: ProgressContent,
});
