import { HeadContent, Scripts, createRootRoute } from "@tanstack/react-router"

import { TooltipProvider } from "@/components/ui/tooltip"
import appCss from "../styles.css?url"

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        name: "description",
        content: "A private, calm workspace for preserving family stories.",
      },
      { title: "Rootstory — Private family archive" },
    ],
    links: [
      {
        rel: "icon",
        type: "image/svg+xml",
        href: "/rootstory-mark.svg",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  notFoundComponent: () => (
    <main className="grid min-h-svh place-items-center bg-background p-6 text-center">
      <section className="space-y-2">
        <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
          404
        </p>
        <h1 className="text-2xl font-semibold">This branch is not here.</h1>
        <p className="text-sm text-muted-foreground">
          Return to the family workspace and choose another path.
        </p>
      </section>
    </main>
  ),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <TooltipProvider>{children}</TooltipProvider>
        <Scripts />
      </body>
    </html>
  )
}
