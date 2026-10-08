import { createFileRoute } from "@tanstack/react-router"

import { RootstoryApp } from "@/components/rootstory-app"

export const Route = createFileRoute("/app")({
  component: RootstoryApp,
  head: () => ({
    meta: [{ title: "Rootstory — Family archive" }],
  }),
})
