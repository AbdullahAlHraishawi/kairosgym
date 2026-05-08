import { createFileRoute } from "@tanstack/react-router";

import { ProfileContent } from "@/components/tabs/profile-content";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile — KAIROS" },
      { name: "description", content: "Your KAIROS profile, rank, and badges." },
    ],
  }),
  component: ProfileContent,
});
