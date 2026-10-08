import type { SVGProps } from "react"

import { cn } from "cn"

export function RootstoryMark({
  className,
  ...props
}: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 48 48"
      role="img"
      aria-label="Rootstory"
      className={cn("size-10", className)}
      {...props}
    >
      <rect width="48" height="48" rx="14" fill="currentColor" />
      <path
        d="M24 34V18m0 5-8-7m8 7 8-7"
        fill="none"
        stroke="var(--primary-foreground)"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M24 33c-1.5 3-4 5-7.5 6m7.5-6c1.5 3 4 5 7.5 6"
        fill="none"
        stroke="var(--accent)"
        strokeWidth="2.25"
        strokeLinecap="round"
      />
      <circle cx="16" cy="15.5" r="2.75" fill="var(--accent)" />
      <circle cx="24" cy="17.5" r="2.75" fill="var(--primary-foreground)" />
      <circle cx="32" cy="15.5" r="2.75" fill="var(--accent)" />
    </svg>
  )
}

export function RootstoryBrand({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <RootstoryMark className="size-9 text-primary" />
      <span className="text-[0.95rem] font-semibold tracking-[-0.025em]">
        Rootstory
      </span>
    </span>
  )
}
