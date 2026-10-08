import * as React from "react"
import { cn } from "cn"
import { Select as SelectPrimitive } from "radix-ui"
import {
  ArrowDown01Icon,
  ArrowUp01Icon,
  CheckIcon,
  Search01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { matchesSelectOption } from "@/lib/select-search"

const SelectSearchContext = React.createContext("")

const optionText = (value: React.ReactNode): string =>
  React.Children.toArray(value)
    .map((child) =>
      typeof child === "string" || typeof child === "number"
        ? String(child)
        : React.isValidElement<{ children?: React.ReactNode }>(child)
          ? optionText(child.props.children)
          : ""
    )
    .join(" ")

const optionLabels = (value: React.ReactNode): string[] =>
  React.Children.toArray(value).flatMap((child) => {
    if (
      !React.isValidElement<{
        children?: React.ReactNode
        textValue?: string
      }>(child)
    )
      return []
    if (child.type === SelectItem)
      return [child.props.textValue || optionText(child.props.children)]
    return optionLabels(child.props.children)
  })

function Select({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Root>) {
  return <SelectPrimitive.Root data-slot="select" {...props} />
}

function SelectGroup({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Group>) {
  return (
    <SelectPrimitive.Group
      data-slot="select-group"
      className={cn("scroll-my-1 p-1", className)}
      {...props}
    />
  )
}

function SelectValue({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Value>) {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />
}

function SelectTrigger({
  className,
  size = "default",
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger> & {
  size?: "sm" | "default"
}) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        "flex w-fit items-center justify-between gap-1.5 rounded-lg border border-input bg-transparent py-2 pr-2 pl-3 text-sm whitespace-nowrap transition-colors outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 data-placeholder:text-muted-foreground data-[size=default]:h-11 data-[size=sm]:h-10 data-[size=sm]:rounded-[min(var(--radius-md),10px)] *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-1.5 dark:bg-input/30 dark:hover:bg-input/50 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <HugeiconsIcon
          icon={ArrowDown01Icon}
          className="pointer-events-none size-4 text-muted-foreground"
          strokeWidth={1.8}
        />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}

function SelectContent({
  className,
  children,
  position = "popper",
  align = "start",
  onCloseAutoFocus,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) {
  const [query, setQuery] = React.useState("")
  const normalizedQuery = query.trim().toLocaleLowerCase()
  const hasMatches = optionLabels(children).some((label) =>
    matchesSelectOption(label, normalizedQuery)
  )
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot="select-content"
        data-align-trigger={position === "item-aligned"}
        className={cn(
          "relative z-50 max-h-(--radix-select-content-available-height) min-w-56 origin-(--radix-select-content-transform-origin) overflow-hidden rounded-lg bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10 duration-100 data-[align-trigger=true]:animate-none data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
          position === "popper" &&
            "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
          className
        )}
        position={position}
        align={align}
        onCloseAutoFocus={(event) => {
          setQuery("")
          onCloseAutoFocus?.(event)
        }}
        {...props}
      >
        <div className="border-b p-2">
          <div className="flex h-9 items-center gap-2 rounded-md border border-input bg-background px-2.5 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
            <HugeiconsIcon
              icon={Search01Icon}
              className="size-4 shrink-0 text-muted-foreground"
              strokeWidth={1.8}
            />
            <input
              ref={(input) => {
                if (input) requestAnimationFrame(() => input.focus())
              }}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "ArrowDown") {
                  event.preventDefault()
                  event.currentTarget
                    .closest('[data-slot="select-content"]')
                    ?.querySelector<HTMLElement>('[data-slot="select-item"]')
                    ?.focus()
                } else if (event.key !== "Escape") event.stopPropagation()
              }}
              placeholder="Search options"
              aria-label="Search options"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
        </div>
        <SelectScrollUpButton />
        <SelectSearchContext.Provider value={normalizedQuery}>
          <SelectPrimitive.Viewport
            data-position={position}
            className={cn(
              "max-h-72 overflow-y-auto p-1 data-[position=popper]:w-full data-[position=popper]:min-w-(--radix-select-trigger-width)",
              position === "popper" && ""
            )}
          >
            {children}
            {!!normalizedQuery && !hasMatches && (
              <SelectPrimitive.Item
                value="__no-options__"
                disabled
                className="px-2 py-6 text-center text-sm text-muted-foreground outline-none"
              >
                <SelectPrimitive.ItemText>
                  <span aria-live="polite">No options found.</span>
                </SelectPrimitive.ItemText>
              </SelectPrimitive.Item>
            )}
          </SelectPrimitive.Viewport>
        </SelectSearchContext.Provider>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
}

function SelectLabel({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Label>) {
  return (
    <SelectPrimitive.Label
      data-slot="select-label"
      className={cn("px-1.5 py-1 text-xs text-muted-foreground", className)}
      {...props}
    />
  )
}

function SelectItem({
  className,
  children,
  textValue,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) {
  const query = React.useContext(SelectSearchContext)
  const searchValue = textValue || optionText(children)
  if (query && !matchesSelectOption(searchValue, query)) return null
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "relative flex w-full cursor-default items-center gap-1.5 rounded-md py-1 pr-8 pl-1.5 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground not-data-[variant=destructive]:focus:**:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2",
        className
      )}
      textValue={searchValue}
      {...props}
    >
      <span className="pointer-events-none absolute right-2 flex size-4 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <HugeiconsIcon
            icon={CheckIcon}
            className="pointer-events-none"
            strokeWidth={1.8}
          />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
}

function SelectSeparator({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Separator>) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn("pointer-events-none -mx-1 my-1 h-px bg-border", className)}
      {...props}
    />
  )
}

function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton>) {
  return (
    <SelectPrimitive.ScrollUpButton
      data-slot="select-scroll-up-button"
      className={cn(
        "z-10 flex cursor-default items-center justify-center bg-popover py-1 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      <HugeiconsIcon icon={ArrowUp01Icon} strokeWidth={1.8} />
    </SelectPrimitive.ScrollUpButton>
  )
}

function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownButton>) {
  return (
    <SelectPrimitive.ScrollDownButton
      data-slot="select-scroll-down-button"
      className={cn(
        "z-10 flex cursor-default items-center justify-center bg-popover py-1 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      <HugeiconsIcon icon={ArrowDown01Icon} strokeWidth={1.8} />
    </SelectPrimitive.ScrollDownButton>
  )
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
}
