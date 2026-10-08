import { createFileRoute } from "@tanstack/react-router"

import { LandingPage } from "@/components/landing-page"

export const Route = createFileRoute("/")({
  component: LandingPage,
  head: () => ({
    meta: [
      { title: "Rootstory — Keep the people behind the names" },
      {
        name: "description",
        content:
          "A private, local-first family archive for relationships, memories, photographs, and milestones.",
      },
    ],
  }),
})
