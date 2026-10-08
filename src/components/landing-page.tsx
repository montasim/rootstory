import {
  Database01Icon,
  HistoryIcon,
  LockIcon,
  Share01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Link } from "@tanstack/react-router"

import { RootstoryBrand, RootstoryMark } from "@/components/rootstory-logo"
import { Button } from "@/components/ui/button"

const features = [
  {
    icon: HistoryIcon,
    label: "More than a family tree",
    title: "Keep the context, not only the dates.",
    copy: "Record relationships, places, work, notes, photographs, and the small details that make each person recognizable.",
  },
  {
    icon: Database01Icon,
    label: "Built to move with you",
    title: "Bring an archive in. Take a copy out.",
    copy: "Import GEDCOM records, export a complete backup, or create a calendar of family dates without locking your history to one service.",
  },
  {
    icon: Share01Icon,
    label: "Share deliberately",
    title: "Make a copy when you choose.",
    copy: "Nothing becomes public by accident. Prepare a private, read-only family copy and decide exactly how it leaves your browser.",
  },
]

const people = [
  {
    initials: "EM",
    name: "Elias Moreno",
    dates: "1929 — 2014",
    className:
      "left-[6%] top-[9%] border-amber-300/70 bg-amber-50 dark:bg-amber-950/30",
  },
  {
    initials: "IR",
    name: "Inês Rocha",
    dates: "1934 — 2019",
    className:
      "right-[5%] top-[9%] border-rose-300/70 bg-rose-50 dark:bg-rose-950/30",
  },
  {
    initials: "TM",
    name: "Tomás Moreno",
    dates: "1959 — present",
    className:
      "left-1/2 top-[40%] -translate-x-1/2 border-emerald-300/70 bg-emerald-50 dark:bg-emerald-950/30",
  },
  {
    initials: "AM",
    name: "Ada Moreno",
    dates: "1988 — present",
    className:
      "left-[8%] top-[72%] border-indigo-300/70 bg-indigo-50 dark:bg-indigo-950/30",
  },
  {
    initials: "LM",
    name: "Leo Moreno",
    dates: "1991 — present",
    className:
      "right-[7%] top-[72%] border-teal-300/70 bg-teal-50 dark:bg-teal-950/30",
  },
]

function FamilyArchivePreview() {
  return (
    <div className="relative mx-auto w-full max-w-[36rem] rotate-[0.6deg] rounded-[1.75rem] border border-border/80 bg-card p-3 shadow-[0_28px_80px_-35px_rgba(30,50,90,0.38)] sm:p-5">
      <div className="absolute top-7 -left-2.5 flex flex-col gap-3" aria-hidden>
        {[0, 1, 2].map((hole) => (
          <span
            key={hole}
            className="size-5 rounded-full border border-border bg-background shadow-inner"
          />
        ))}
      </div>
      <div className="flex items-start justify-between gap-4 border-b border-dashed pb-3 pl-2">
        <div>
          <p className="text-[0.64rem] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
            Family archive · Branch 01
          </p>
          <p className="mt-1 text-sm font-semibold">The Moreno family</p>
        </div>
        <span className="rotate-[-3deg] rounded-md border border-emerald-700/30 bg-emerald-50 px-2 py-1 text-[0.58rem] font-bold tracking-[0.14em] text-emerald-800 uppercase dark:bg-emerald-950/40 dark:text-emerald-200">
          Local copy
        </span>
      </div>

      <div className="relative mt-3 h-[25rem] overflow-hidden rounded-2xl bg-[linear-gradient(to_right,color-mix(in_oklch,var(--border)_42%,transparent)_1px,transparent_1px),linear-gradient(to_bottom,color-mix(in_oklch,var(--border)_42%,transparent)_1px,transparent_1px)] bg-[size:24px_24px]">
        <svg
          aria-hidden="true"
          viewBox="0 0 560 400"
          preserveAspectRatio="none"
          className="absolute inset-0 size-full text-primary/35"
        >
          <g
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M125 82 C125 137 280 111 280 174" />
            <path d="M435 82 C435 137 280 111 280 174" />
            <path d="M280 222 C280 270 140 258 140 315" />
            <path d="M280 222 C280 270 420 258 420 315" />
          </g>
        </svg>
        {people.map((person) => (
          <div
            key={person.name}
            className={`absolute flex w-36 items-center gap-2 rounded-xl border p-2 shadow-sm backdrop-blur-sm sm:w-[10rem] sm:gap-2.5 sm:p-2.5 ${person.className}`}
          >
            <span className="grid size-8 shrink-0 place-items-center rounded-full border border-current/10 bg-background/75 text-[0.65rem] font-bold">
              {person.initials}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[0.68rem] font-semibold sm:text-xs">
                {person.name}
              </span>
              <span className="block text-[0.6rem] text-muted-foreground sm:text-[0.65rem]">
                {person.dates}
              </span>
            </span>
          </div>
        ))}
        <p className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full border bg-background/90 px-3 py-1 text-[0.62rem] font-medium text-muted-foreground shadow-sm">
          Every line has a story behind it.
        </p>
      </div>
    </div>
  )
}

export function LandingPage() {
  return (
    <main className="min-h-svh overflow-hidden bg-background text-foreground">
      <header className="relative z-20 mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
        <RootstoryBrand />
        <nav
          className="hidden items-center gap-7 text-sm text-muted-foreground md:flex"
          aria-label="Main navigation"
        >
          <a
            className="transition-colors hover:text-foreground"
            href="#what-it-keeps"
          >
            What it keeps
          </a>
          <a
            className="transition-colors hover:text-foreground"
            href="#privacy"
          >
            Privacy
          </a>
        </nav>
        <Button asChild size="sm">
          <Link to="/app">Open the archive</Link>
        </Button>
      </header>

      <section className="relative border-b border-border/70">
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(circle_at_18%_28%,color-mix(in_oklch,var(--accent)_45%,transparent),transparent_26%),radial-gradient(circle_at_78%_38%,color-mix(in_oklch,var(--primary)_10%,transparent),transparent_28%)]"
        />
        <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 pt-16 pb-24 sm:px-8 sm:pt-20 lg:grid-cols-[0.88fr_1.12fr] lg:px-10 lg:pt-24 lg:pb-28">
          <div className="relative z-10 max-w-xl animate-in duration-700 fade-in slide-in-from-bottom-4 motion-reduce:animate-none">
            <p className="mb-5 flex items-center gap-2 text-xs font-semibold tracking-[0.16em] text-primary uppercase">
              <span className="h-px w-8 bg-primary/40" />A private family
              archive
            </p>
            <h1 className="font-display text-[clamp(3.3rem,7vw,6.8rem)] leading-[0.88] font-medium tracking-[-0.065em] text-balance">
              Keep the people behind the names.
            </h1>
            <p className="mt-7 max-w-lg text-base leading-7 text-muted-foreground sm:text-lg">
              Rootstory gives your family a quiet place for relationships,
              memories, photographs, and milestones—kept locally in your browser
              until you decide otherwise.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button
                asChild
                size="lg"
                className="px-5 shadow-lg shadow-primary/10"
              >
                <Link to="/app">
                  Open Rootstory <span aria-hidden>→</span>
                </Link>
              </Button>
              <a
                href="#what-it-keeps"
                className="rounded-lg px-3 py-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
              >
                See what belongs here
              </a>
            </div>
            <div className="mt-10 flex items-center gap-3 border-t border-border/70 pt-5 text-sm text-muted-foreground">
              <HugeiconsIcon
                icon={LockIcon}
                size={16}
                strokeWidth={1.8}
                className="text-primary"
              />
              No account. No automatic upload. Your archive stays yours.
            </div>
          </div>
          <div className="relative animate-in duration-1000 fade-in slide-in-from-bottom-8 motion-reduce:animate-none">
            <div
              aria-hidden
              className="absolute -inset-8 -z-10 rounded-full bg-primary/5 blur-3xl"
            />
            <FamilyArchivePreview />
          </div>
        </div>
      </section>

      <section
        id="what-it-keeps"
        className="mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:px-10 lg:py-32"
      >
        <div className="grid gap-8 border-b border-border/70 pb-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
            What a tree usually leaves out
          </p>
          <h2 className="max-w-3xl font-display text-4xl leading-[1.04] font-medium tracking-[-0.04em] text-balance sm:text-5xl">
            A family is not a chart. The archive should remember accordingly.
          </h2>
        </div>
        <div className="grid gap-px overflow-hidden rounded-2xl border bg-border md:grid-cols-3">
          {features.map((feature) => (
            <article key={feature.title} className="bg-card p-7 sm:p-8">
              <HugeiconsIcon
                icon={feature.icon}
                size={22}
                strokeWidth={1.7}
                className="text-primary"
              />
              <p className="mt-8 text-[0.68rem] font-semibold tracking-[0.15em] text-muted-foreground uppercase">
                {feature.label}
              </p>
              <h3 className="mt-3 text-xl font-semibold tracking-[-0.025em]">
                {feature.title}
              </h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {feature.copy}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section
        id="privacy"
        className="border-y border-border/70 bg-secondary/45"
      >
        <div className="mx-auto grid max-w-7xl gap-12 px-5 py-20 sm:px-8 lg:grid-cols-2 lg:items-center lg:px-10 lg:py-24">
          <div>
            <p className="text-xs font-semibold tracking-[0.16em] text-primary uppercase">
              Private by architecture
            </p>
            <h2 className="mt-4 max-w-xl font-display text-4xl leading-tight font-medium tracking-[-0.04em] sm:text-5xl">
              Your browser is the archive room.
            </h2>
            <p className="mt-5 max-w-xl leading-7 text-muted-foreground">
              Rootstory stores the working archive locally. There is no account
              to create and no family data sent to a server in the background.
              Export a backup whenever you want another copy.
            </p>
          </div>
          <div className="rounded-3xl border bg-background p-5 shadow-sm sm:p-7">
            <div className="flex items-center gap-3 border-b border-dashed pb-5">
              <RootstoryMark className="size-11 text-primary" />
              <div>
                <p className="text-sm font-semibold">
                  Where your archive lives
                </p>
                <p className="text-xs text-muted-foreground">
                  A deliberately short path
                </p>
              </div>
            </div>
            <div className="grid gap-3 pt-5 text-sm sm:grid-cols-[1fr_auto_1fr_auto_1fr] sm:items-center">
              <span className="rounded-xl border bg-card p-4 font-medium">
                Your family
              </span>
              <span
                aria-hidden
                className="hidden text-muted-foreground sm:block"
              >
                →
              </span>
              <span className="rounded-xl border border-primary/25 bg-primary/5 p-4 font-medium text-primary">
                This browser
              </span>
              <span
                aria-hidden
                className="hidden text-muted-foreground sm:block"
              >
                →
              </span>
              <span className="rounded-xl border bg-card p-4 font-medium">
                Your backup
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-24 text-center sm:px-8 lg:py-32">
        <RootstoryMark className="mx-auto size-12 text-primary" />
        <h2 className="mx-auto mt-6 max-w-3xl font-display text-4xl leading-tight font-medium tracking-[-0.04em] sm:text-6xl">
          Begin with one person. Let the stories branch from there.
        </h2>
        <p className="mx-auto mt-5 max-w-xl leading-7 text-muted-foreground">
          Open the workspace, explore the sample family, and shape an archive
          that feels like yours.
        </p>
        <Button asChild size="lg" className="mt-8 px-5">
          <Link to="/app">
            Open the family archive <span aria-hidden>→</span>
          </Link>
        </Button>
      </section>

      <footer className="border-t border-border/70">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-7 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
          <RootstoryBrand className="text-foreground" />
          <p>Private family history, kept close.</p>
        </div>
      </footer>
    </main>
  )
}
