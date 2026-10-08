import { useEffect, useId, useMemo, useRef, useState } from "react"
import type { ZodType } from "zod"
import {
  Add01Icon,
  ArrowExpandIcon,
  BirthdayCakeIcon,
  Briefcase01Icon,
  Cancel01Icon,
  Calendar03Icon,
  CenterFocusIcon,
  Database01Icon,
  Delete02Icon,
  Download04Icon,
  Edit02Icon,
  File01Icon,
  GitBranchIcon,
  HistoryIcon,
  Home01Icon,
  Image01Icon,
  InformationCircleIcon,
  Location01Icon,
  LockIcon,
  Mail01Icon,
  Menu01Icon,
  Moon02Icon,
  PrinterIcon,
  Search01Icon,
  Settings02Icon,
  Share01Icon,
  Sun02Icon,
  Table01Icon,
  UndoIcon,
  UserAdd01Icon,
  UserMultiple02Icon,
  ZoomInIcon,
  ZoomOutIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { RootstoryMark } from "@/components/rootstory-logo"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  type Archive,
  type Family,
  type FamilyEvent,
  type Person,
  type Relationship,
  type RelationshipType,
  buildFamilyEvents,
  cloneArchive,
  descendantIds,
  demoArchive,
  formatPartialDate,
  generationMap,
  initials,
  isConnectedPerson,
  orderPeopleForTree,
  relationshipEnds,
  searchPeople,
  treeParentGroups,
  treeParentUnits,
  years,
} from "@/lib/family"
import {
  checksum,
  download,
  exportBackup,
  exportCalendar,
  exportCsv,
  exportFilename,
  exportGedcom,
  exportReadOnlyHtml,
  exportText,
  importBackup,
  importGedcom,
} from "@/lib/portable"
import {
  type ArchiveVersion,
  loadWorkspace,
  saveWorkspace,
  trimHistory,
} from "@/lib/storage"
import {
  familyNameSchema,
  importFileSchema,
  partialDateSchema,
  personInputSchema,
  photoFileSchema,
  relationshipInputSchema,
  relationshipLocationSchema,
  relationshipTypeSchema,
  searchSchema,
  settingsInputSchema,
  validationErrors,
  validationMessage,
} from "@/lib/validation"
import { cn } from "@/lib/utils"

type IconData = Parameters<typeof HugeiconsIcon>[0]["icon"]
type View = "tree" | "people" | "timeline" | "calendar"
type TreeCommand = {
  id: number
  type: "center" | "fit"
  personId?: string
}
const tones: Record<Person["tone"], string> = {
  indigo:
    "border-indigo-200 bg-indigo-50 text-indigo-950 dark:border-indigo-900 dark:bg-indigo-950/50 dark:text-indigo-100",
  rose: "border-rose-200 bg-rose-50 text-rose-950 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-100",
  moss: "border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-100",
  amber:
    "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-100",
}
const relationshipOptions: {
  value: RelationshipType
  label: string
}[] = [
  { value: "partner", label: "Partner / spouse" },
  { value: "ex-partner", label: "Former partner / spouse" },
  { value: "child", label: "Child" },
  { value: "biological parent", label: "Biological parent" },
  { value: "adopted parent", label: "Adoptive parent" },
  { value: "foster parent", label: "Foster parent" },
  { value: "surrogate parent", label: "Surrogate parent" },
  { value: "godparent", label: "Godparent" },
  { value: "sibling", label: "Sibling" },
]
const relationshipLabel = (type: RelationshipType) =>
  relationshipOptions.find((option) => option.value === type)?.label || type
const relationshipChoiceLabel = (
  type: RelationshipType,
  selectedName: string,
  candidateName?: string
) => {
  const label = relationshipLabel(type)
  return candidateName
    ? `${candidateName} is ${selectedName}'s ${label.toLowerCase()}`
    : `${label} of ${selectedName}`
}
const genderOptions = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
  { value: "unspecified", label: "Prefer not to specify" },
] as const
type SelectableGender = (typeof genderOptions)[number]["value"]
const isSelectableGender = (
  value: Person["gender"]
): value is SelectableGender =>
  genderOptions.some((item) => item.value === value)
const zooms = {
  40: "scale-[.4]",
  50: "scale-50",
  60: "scale-[.6]",
  70: "scale-[.7]",
  80: "scale-[.8]",
  90: "scale-90",
  100: "scale-100",
  110: "scale-110",
  120: "scale-120",
  130: "scale-[1.3]",
  140: "scale-[1.4]",
} as const
const blankPerson = (): Person => ({
  id: "",
  name: "",
  relation: "Relative",
  gender: "unspecified",
  birthDate: "",
  birthQualifier: "exact",
  deathDate: "",
  living: true,
  location: "",
  work: "",
  email: "",
  phone: "",
  note: "",
  photo: "",
  tone: "moss",
})
function Icon({ icon, size = 18 }: { icon: IconData; size?: number }) {
  return <HugeiconsIcon icon={icon} size={size} strokeWidth={1.8} />
}
function Tool({
  label,
  icon,
  active,
  disabled,
  onClick,
  showLabel,
}: {
  label: string
  icon: IconData
  active?: boolean
  disabled?: boolean
  onClick?: () => void
  showLabel?: boolean
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={active ? "secondary" : "ghost"}
          size={showLabel ? "default" : "icon"}
          onClick={onClick}
          aria-label={label}
          disabled={disabled}
          className={showLabel ? "w-full justify-start" : undefined}
        >
          <Icon icon={icon} />
          {showLabel && <span>{label}</span>}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

function PersonSearch({
  family,
  query,
  onQueryChange,
  onChoose,
  className,
}: {
  family: Family
  query: string
  onQueryChange: (value: string) => void
  onChoose: (id: string) => void
  className?: string
}) {
  const [focused, setFocused] = useState(false),
    [active, setActive] = useState(0)
  const results = useMemo(
    () => searchPeople(family, query).slice(0, 8),
    [family, query]
  )
  const open = focused && !!query.trim()
  const chooseResult = (id: string) => {
    onChoose(id)
    onQueryChange("")
    setFocused(false)
    setActive(0)
  }
  return (
    <div className={cn("relative", className)}>
      <HugeiconsIcon
        icon={Search01Icon}
        size={16}
        className="pointer-events-none absolute top-1/2 left-3 z-10 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        value={query}
        onFocus={() => setFocused(true)}
        onBlur={() => window.setTimeout(() => setFocused(false), 120)}
        onChange={(event) => {
          const result = searchSchema.safeParse(event.target.value)
          if (result.success) {
            onQueryChange(event.target.value)
            setActive(0)
          }
        }}
        onKeyDown={(event) => {
          if (!open || !results.length) return
          if (event.key === "ArrowDown") {
            event.preventDefault()
            setActive((value) => Math.min(results.length - 1, value + 1))
          } else if (event.key === "ArrowUp") {
            event.preventDefault()
            setActive((value) => Math.max(0, value - 1))
          } else if (event.key === "Enter") {
            event.preventDefault()
            chooseResult(results[active].id)
          } else if (event.key === "Escape") {
            setFocused(false)
          }
        }}
        placeholder="Find name, relation or place"
        className="pr-9 pl-9"
        aria-label="Find a person"
        aria-controls="person-search-results"
        aria-expanded={open}
        maxLength={120}
      />
      {query && (
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          className="absolute top-1/2 right-1.5 z-10 -translate-y-1/2"
          aria-label="Clear search"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => onQueryChange("")}
        >
          <Icon icon={Cancel01Icon} size={14} />
        </Button>
      )}
      {open && (
        <div
          id="person-search-results"
          role="listbox"
          className="absolute top-[calc(100%+.4rem)] z-50 max-h-80 w-full min-w-64 overflow-auto rounded-xl border bg-popover p-1.5 text-popover-foreground shadow-lg"
        >
          {results.length ? (
            results.map((person, index) => (
              <Button
                key={person.id}
                role="option"
                aria-selected={index === active}
                variant={index === active ? "secondary" : "ghost"}
                className="h-auto w-full justify-start px-2.5 py-2 text-left"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => chooseResult(person.id)}
              >
                <Avatar>
                  <AvatarImage src={person.photo} alt="" />
                  <AvatarFallback>{initials(person.name)}</AvatarFallback>
                </Avatar>
                <span className="min-w-0">
                  <span className="block truncate font-medium">
                    {person.name}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {person.relation} · {person.location}
                  </span>
                </span>
              </Button>
            ))
          ) : (
            <p className="px-3 py-4 text-sm text-muted-foreground">
              No people found. Try a different name, relationship, or place.
            </p>
          )}
        </div>
      )}
      <span className="sr-only" role="status" aria-live="polite">
        {open ? `${results.length} search results` : ""}
      </span>
    </div>
  )
}
function Field({
  id,
  label,
  hint,
  error,
  required,
  children,
}: {
  id: string
  label: React.ReactNode
  hint?: string
  error?: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="grid min-w-0 gap-2">
      <Label htmlFor={id}>
        {label}
        {required && (
          <span className="ml-auto text-xs font-normal text-muted-foreground">
            Required
          </span>
        )}
      </Label>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  )
}
function ValidatedRelationshipInput({
  value,
  label,
  placeholder,
  maxLength,
  schema,
  onCommit,
}: {
  value: string
  label: string
  placeholder: string
  maxLength: number
  schema: ZodType<string>
  onCommit: (value: string) => void
}) {
  const id = useId()
  const [draft, setDraft] = useState(value)
  useEffect(() => setDraft(value), [value])
  const error = draft ? validationMessage(schema.safeParse(draft)) : ""
  return (
    <div className="grid gap-1.5">
      <Input
        id={id}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={() => {
          if (!error && draft !== value) onCommit(draft.trim())
        }}
        placeholder={placeholder}
        inputMode={schema === partialDateSchema ? "numeric" : undefined}
        maxLength={maxLength}
        aria-label={label}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
function Fact({
  icon,
  label,
  value,
}: {
  icon: IconData
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-muted/30 p-3">
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-background text-primary">
        <Icon icon={icon} size={16} />
      </span>
      <span className="min-w-0">
        <span className="block text-xs text-muted-foreground">{label}</span>
        <span className="block truncate text-sm font-medium">{value}</span>
      </span>
    </div>
  )
}

function PersonNode({
  person,
  selected,
  matched,
  dimmed,
  showPhoto,
  onSelect,
  nodeRef,
}: {
  person: Person
  selected: boolean
  matched?: boolean
  dimmed?: boolean
  showPhoto: boolean
  onSelect: () => void
  nodeRef?: (node: HTMLButtonElement | null) => void
}) {
  return (
    <Button
      ref={nodeRef}
      variant="ghost"
      onClick={onSelect}
      aria-current={selected ? "true" : undefined}
      title={person.name}
      className={cn(
        "h-auto w-44 justify-start rounded-xl border bg-card px-3 py-2.5 text-left text-card-foreground shadow-[0_1px_2px_rgba(27,39,66,0.08)] transition-colors hover:border-primary/35 hover:bg-card",
        dimmed && "opacity-30",
        matched && "border-primary/70 bg-primary/[0.04]",
        selected &&
          "border-primary bg-primary/[0.08] shadow-[0_2px_8px_rgba(27,39,66,0.1)] ring-2 ring-primary/20"
      )}
    >
      <Avatar className="mr-2.5">
        <AvatarImage src={showPhoto ? person.photo : ""} alt="" />
        <AvatarFallback className={cn("font-semibold", tones[person.tone])}>
          {initials(person.name)}
        </AvatarFallback>
      </Avatar>
      <span className="min-w-0">
        <span className="line-clamp-2 block text-sm font-semibold">
          {person.name}
        </span>
        <span className="block truncate text-xs font-normal text-muted-foreground">
          {person.relation}
        </span>
      </span>
    </Button>
  )
}

function ConfirmAction({
  trigger,
  title,
  description,
  action,
  onConfirm,
}: {
  trigger: React.ReactNode
  title: string
  description: string
  action: string
  onConfirm: () => void
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={onConfirm}>
            {action}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function PersonDialog({
  person,
  trigger,
  onSave,
}: {
  person?: Person
  trigger: React.ReactNode
  onSave: (person: Person) => void
}) {
  const uid = useId()
  const [open, setOpen] = useState(false),
    [draft, setDraft] = useState<Person>(() =>
      person ? structuredClone(person) : blankPerson()
    ),
    [photoError, setPhotoError] = useState("")
  const personValidation = personInputSchema.safeParse(draft),
    personErrors = validationErrors(personValidation)
  useEffect(() => {
    if (open) {
      setDraft(person ? structuredClone(person) : blankPerson())
      setPhotoError("")
    }
  }, [open, person])
  const patch = <TKey extends keyof Person>(key: TKey, value: Person[TKey]) =>
    setDraft((current) => ({ ...current, [key]: value }))
  const photo = (file?: File) => {
    setPhotoError("")
    if (!file) return
    const result = photoFileSchema.safeParse(file)
    if (!result.success) {
      setPhotoError(validationMessage(result))
      return
    }
    const reader = new FileReader()
    reader.onload = () => patch("photo", String(reader.result))
    reader.onerror = () =>
      setPhotoError("This image could not be read. Try another file.")
    reader.readAsDataURL(file)
  }
  const save = () => {
    if (!personValidation.success) return
    onSave({
      ...draft,
      ...personValidation.data,
      id: draft.id || `person-${Date.now()}`,
      location: personValidation.data.location || "Not added",
      work: personValidation.data.work || "Not added",
    })
    setOpen(false)
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{person ? "Edit person" : "Add a person"}</DialogTitle>
          <DialogDescription>
            {person
              ? "Update this record. Partial dates and local photos are supported."
              : "This creates an unconnected record. To place someone in the tree, select a person and use Add relative instead."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            id={`${uid}-name`}
            label="Full name"
            required
            error={draft.name ? personErrors.name : undefined}
          >
            <Input
              id={`${uid}-name`}
              value={draft.name}
              onChange={(e) => patch("name", e.target.value)}
              maxLength={120}
              required
              autoFocus
              aria-invalid={!!(draft.name && personErrors.name)}
              aria-describedby={
                draft.name && personErrors.name
                  ? `${uid}-name-error`
                  : undefined
              }
            />
          </Field>
          <Field
            id={`${uid}-relation`}
            label="Profile label"
            hint="Shown beside their name, for example Cousin or Family friend."
            error={personErrors.relation}
          >
            <Input
              id={`${uid}-relation`}
              value={draft.relation}
              onChange={(e) => patch("relation", e.target.value)}
              maxLength={60}
              aria-invalid={!!personErrors.relation}
              aria-describedby={
                personErrors.relation ? `${uid}-relation-error` : undefined
              }
            />
          </Field>
          <Field
            id={`${uid}-gender`}
            label="Gender"
            error={person ? personErrors.gender : undefined}
          >
            <Select
              value={isSelectableGender(draft.gender) ? draft.gender : ""}
              onValueChange={(value) =>
                patch("gender", value as Person["gender"])
              }
            >
              <SelectTrigger
                id={`${uid}-gender`}
                className="w-full"
                aria-invalid={!!(person && personErrors.gender)}
                aria-describedby={
                  person && personErrors.gender
                    ? `${uid}-gender-error`
                    : undefined
                }
              >
                <SelectValue placeholder="Choose gender" />
              </SelectTrigger>
              <SelectContent>
                {genderOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field
            id={`${uid}-birth`}
            label="Birth date"
            hint="Use YYYY, YYYY-MM or YYYY-MM-DD."
            error={draft.birthDate ? personErrors.birthDate : undefined}
          >
            <Input
              id={`${uid}-birth`}
              inputMode="numeric"
              placeholder="YYYY-MM-DD"
              pattern="\d{4}(-\d{2})?(-\d{2})?"
              value={draft.birthDate}
              onChange={(e) => patch("birthDate", e.target.value)}
              aria-invalid={!!(draft.birthDate && personErrors.birthDate)}
              aria-describedby={
                draft.birthDate && personErrors.birthDate
                  ? `${uid}-birth-error`
                  : `${uid}-birth-hint`
              }
            />
          </Field>
          <Field id={`${uid}-precision`} label="Date precision">
            <Select
              value={draft.birthQualifier}
              onValueChange={(value) =>
                patch("birthQualifier", value as Person["birthQualifier"])
              }
            >
              <SelectTrigger id={`${uid}-precision`} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["exact", "about", "before", "after"].map((value) => (
                  <SelectItem key={value} value={value}>
                    {value[0].toUpperCase() + value.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field id={`${uid}-living`} label="Living status">
            <Label
              htmlFor={`${uid}-living`}
              className="flex min-h-11 items-center gap-3 rounded-md border px-3"
            >
              <Switch
                id={`${uid}-living`}
                checked={draft.living}
                onCheckedChange={(value) => patch("living", value)}
              />
              <span>{draft.living ? "Living" : "Deceased"}</span>
            </Label>
          </Field>
          {!draft.living && (
            <Field
              id={`${uid}-death`}
              label="Death date"
              hint="Use YYYY, YYYY-MM or YYYY-MM-DD."
              error={personErrors.deathDate}
            >
              <Input
                id={`${uid}-death`}
                inputMode="numeric"
                placeholder="YYYY-MM-DD"
                value={draft.deathDate}
                onChange={(e) => patch("deathDate", e.target.value)}
                aria-invalid={!!personErrors.deathDate}
                aria-describedby={
                  personErrors.deathDate
                    ? `${uid}-death-error`
                    : `${uid}-death-hint`
                }
              />
            </Field>
          )}
          <details
            className="rounded-xl border bg-muted/20 p-3 sm:col-span-2"
            open={!!person}
          >
            <summary className="cursor-pointer text-sm font-medium">
              More details
            </summary>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field
                id={`${uid}-place`}
                label="Place"
                error={draft.location ? personErrors.location : undefined}
              >
                <Input
                  id={`${uid}-place`}
                  value={draft.location}
                  onChange={(e) => patch("location", e.target.value)}
                  maxLength={160}
                  aria-invalid={!!(draft.location && personErrors.location)}
                  aria-describedby={
                    draft.location && personErrors.location
                      ? `${uid}-place-error`
                      : undefined
                  }
                />
              </Field>
              <Field
                id={`${uid}-work`}
                label="Profession"
                error={draft.work ? personErrors.work : undefined}
              >
                <Input
                  id={`${uid}-work`}
                  value={draft.work}
                  onChange={(e) => patch("work", e.target.value)}
                  maxLength={120}
                  aria-invalid={!!(draft.work && personErrors.work)}
                  aria-describedby={
                    draft.work && personErrors.work
                      ? `${uid}-work-error`
                      : undefined
                  }
                />
              </Field>
              <Field
                id={`${uid}-email`}
                label="Email"
                error={draft.email ? personErrors.email : undefined}
              >
                <Input
                  id={`${uid}-email`}
                  type="email"
                  value={draft.email}
                  onChange={(e) => patch("email", e.target.value)}
                  aria-invalid={!!(draft.email && personErrors.email)}
                  aria-describedby={
                    draft.email && personErrors.email
                      ? `${uid}-email-error`
                      : undefined
                  }
                />
              </Field>
              <Field
                id={`${uid}-phone`}
                label="Phone"
                error={draft.phone ? personErrors.phone : undefined}
              >
                <Input
                  id={`${uid}-phone`}
                  type="tel"
                  value={draft.phone}
                  onChange={(e) => patch("phone", e.target.value)}
                  aria-invalid={!!(draft.phone && personErrors.phone)}
                  aria-describedby={
                    draft.phone && personErrors.phone
                      ? `${uid}-phone-error`
                      : undefined
                  }
                />
              </Field>
              <Field
                id={`${uid}-photo`}
                label="Photo"
                hint="JPEG, PNG, GIF or WebP; maximum 2 MB."
                error={photoError}
              >
                <Input
                  id={`${uid}-photo`}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={(e) => photo(e.target.files?.[0])}
                  aria-invalid={!!photoError}
                  aria-describedby={
                    photoError ? `${uid}-photo-error` : `${uid}-photo-hint`
                  }
                />
              </Field>
              <div className="sm:col-span-2">
                <Field
                  id={`${uid}-story`}
                  label="Life story"
                  error={draft.note ? personErrors.note : undefined}
                >
                  <Textarea
                    id={`${uid}-story`}
                    value={draft.note}
                    onChange={(e) => patch("note", e.target.value)}
                    maxLength={4000}
                    rows={4}
                    aria-invalid={!!(draft.note && personErrors.note)}
                    aria-describedby={
                      draft.note && personErrors.note
                        ? `${uid}-story-error`
                        : undefined
                    }
                  />
                </Field>
              </div>
            </div>
          </details>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={save} disabled={!personValidation.success}>
            Save person
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function RelationshipDialog({
  family,
  selected,
  trigger,
  onSave,
}: {
  family: Family
  selected: Person
  trigger?: React.ReactNode
  onSave: (
    target: Person,
    type: RelationshipType,
    isNew: boolean,
    date: string,
    location: string
  ) => void
}) {
  const uid = useId()
  const [open, setOpen] = useState(false),
    [mode, setMode] = useState<"existing" | "new">("existing"),
    [targetId, setTargetId] = useState(""),
    [name, setName] = useState(""),
    [gender, setGender] = useState<SelectableGender | "">("unspecified"),
    [type, setType] = useState<RelationshipType | "">(""),
    [date, setDate] = useState(""),
    [location, setLocation] = useState(""),
    [preview, setPreview] = useState(false)
  const target = family.people.find((item) => item.id === targetId),
    duplicate = family.people.find(
      (item) => item.name.toLowerCase() === name.trim().toLowerCase()
    ),
    duplicateRelationship =
      target && type
        ? family.relationships.some((relationship) => {
            const ends = relationshipEnds(selected.id, target.id, type)
            return (
              relationship.type === type &&
              relationship.from === ends.from &&
              relationship.to === ends.to
            )
          })
        : false
  const relationshipValidation = relationshipInputSchema.safeParse({
      mode,
      targetId,
      name,
      gender,
      type,
      date,
      location,
    }),
    relationshipErrors = validationErrors(relationshipValidation)
  const save = () => {
    if (!type || !relationshipValidation.success) return
    const fields = relationshipValidation.data
    if (!fields.type) return
    let person = target
    if (mode === "new") {
      if (!fields.name || !fields.gender) return
      person = {
        ...blankPerson(),
        id: `person-${Date.now()}`,
        name: fields.name,
        gender: fields.gender,
      }
    }
    if (!person) return
    onSave(person, fields.type, mode === "new", fields.date, fields.location)
    setOpen(false)
    setName("")
    setTargetId("")
    setGender("unspecified")
    setType("")
    setDate("")
    setLocation("")
    setPreview(false)
  }
  const candidate = mode === "existing" ? target?.name : name.trim()
  const previewSentence =
    candidate && type
      ? type.includes("parent")
        ? `${candidate} will be recorded as ${selected.name}'s ${relationshipLabel(type).toLowerCase()}.`
        : type === "child"
          ? `${candidate} will be recorded as ${selected.name}'s child.`
          : `${selected.name} and ${candidate} will be connected as ${relationshipLabel(type).toLowerCase()}.`
      : ""
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        setOpen(value)
        if (!value) setPreview(false)
      }}
    >
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Icon icon={UserAdd01Icon} />
            Add relative
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add a relative to {selected.name}</DialogTitle>
          <DialogDescription>
            Add a parent, child, sibling, partner or spouse. Repeat this flow to
            add multiple partners or spouses to any selected person.
          </DialogDescription>
        </DialogHeader>
        <Tabs
          value={mode}
          onValueChange={(value) => {
            setMode(value as typeof mode)
            setPreview(false)
          }}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="existing">Existing</TabsTrigger>
            <TabsTrigger value="new">New person</TabsTrigger>
          </TabsList>
          <TabsContent value="existing">
            <Field id={`${uid}-person`} label="Search existing people" required>
              <Select
                value={targetId}
                onValueChange={(value) => {
                  setTargetId(value)
                  setPreview(false)
                }}
              >
                <SelectTrigger id={`${uid}-person`} className="w-full">
                  <SelectValue placeholder="Choose a person" />
                </SelectTrigger>
                <SelectContent>
                  {family.people
                    .filter((item) => {
                      if (item.id === selected.id) return false
                      if (!type) return true
                      const ends = relationshipEnds(selected.id, item.id, type)
                      return !family.relationships.some(
                        (relationship) =>
                          relationship.type === type &&
                          relationship.from === ends.from &&
                          relationship.to === ends.to
                      )
                    })
                    .map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </Field>
          </TabsContent>
          <TabsContent value="new">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                id={`${uid}-new-name`}
                label="Full name"
                required
                error={name ? relationshipErrors.name : undefined}
              >
                <Input
                  id={`${uid}-new-name`}
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    setPreview(false)
                  }}
                  maxLength={120}
                  aria-invalid={!!(name && relationshipErrors.name)}
                  aria-describedby={
                    name && relationshipErrors.name
                      ? `${uid}-new-name-error`
                      : undefined
                  }
                />
              </Field>
              <Field id={`${uid}-new-gender`} label="Gender">
                <Select
                  value={gender}
                  onValueChange={(value) =>
                    setGender(value as SelectableGender)
                  }
                >
                  <SelectTrigger id={`${uid}-new-gender`} className="w-full">
                    <SelectValue placeholder="Choose gender" />
                  </SelectTrigger>
                  <SelectContent>
                    {genderOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
            {duplicate && (
              <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">
                Possible duplicate: {duplicate.name}. Link the existing person
                instead.
              </p>
            )}
          </TabsContent>
        </Tabs>
        <Field id={`${uid}-type`} label="Relationship type" required>
          <Select
            value={type}
            onValueChange={(value) => {
              setType(value as RelationshipType)
              setPreview(false)
            }}
          >
            <SelectTrigger id={`${uid}-type`} className="w-full">
              <SelectValue placeholder="Choose how they are related" />
            </SelectTrigger>
            <SelectContent>
              {relationshipOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {relationshipChoiceLabel(
                    option.value,
                    selected.name,
                    candidate || undefined
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        {duplicateRelationship && (
          <p role="alert" className="text-sm text-destructive">
            This exact relationship already exists. Choose another person or
            relationship type.
          </p>
        )}
        <div className="grid items-start gap-4 sm:grid-cols-2">
          <Field
            id={`${uid}-date`}
            label={
              <>
                <span>Relationship date</span>
                <span className="ml-auto text-xs font-normal text-muted-foreground">
                  Optional
                </span>
              </>
            }
            error={date ? relationshipErrors.date : undefined}
          >
            <Input
              id={`${uid}-date`}
              inputMode="numeric"
              placeholder="YYYY-MM-DD"
              value={date}
              onChange={(event) => {
                setDate(event.target.value)
                setPreview(false)
              }}
              aria-invalid={!!(date && relationshipErrors.date)}
              aria-describedby={
                date && relationshipErrors.date
                  ? `${uid}-date-error`
                  : undefined
              }
            />
          </Field>
          <Field
            id={`${uid}-location`}
            label="Relationship place"
            error={location ? relationshipErrors.location : undefined}
          >
            <Input
              id={`${uid}-location`}
              value={location}
              onChange={(event) => {
                setLocation(event.target.value)
                setPreview(false)
              }}
              maxLength={160}
              aria-invalid={!!(location && relationshipErrors.location)}
              aria-describedby={
                location && relationshipErrors.location
                  ? `${uid}-location-error`
                  : undefined
              }
            />
          </Field>
        </div>
        {preview && (
          <Card className="border-primary/30 shadow-none">
            <CardHeader>
              <CardTitle className="text-sm">Confirm relationship</CardTitle>
              <CardDescription>
                {previewSentence}
                {date ? ` Date: ${formatPartialDate(date)}.` : ""}
                {location ? ` Place: ${location}.` : ""} You can undo this
                change from history.
              </CardDescription>
            </CardHeader>
          </Card>
        )}
        <DialogFooter>
          {preview && (
            <Button variant="outline" onClick={() => setPreview(false)}>
              Back
            </Button>
          )}
          <Button
            onClick={() => (preview ? save() : setPreview(true))}
            disabled={
              (mode === "existing" && !target) ||
              !type ||
              !relationshipValidation.success ||
              duplicateRelationship ||
              (mode === "new" && !!duplicate)
            }
          >
            {preview ? "Add relative" : "Review relationship"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ExportDialog({
  archive,
  family,
  onImport,
  onStatus,
  showLabel = false,
}: {
  archive: Archive
  family: Family
  onImport: (archive: Archive) => void
  onStatus: (status: string) => void
  showLabel?: boolean
}) {
  const uid = useId()
  const [error, setError] = useState(""),
    [digest, setDigest] = useState(""),
    [lastExport, setLastExport] = useState(""),
    [pending, setPending] = useState<Archive | null>(null),
    [pendingKind, setPendingKind] = useState<"archive" | "gedcom" | null>(null),
    input = useRef<HTMLInputElement>(null),
    backup = exportBackup(archive)
  const save = async (kind: "backup" | "gedcom" | "csv" | "text" | "html") => {
    const extension =
      kind === "backup"
        ? "rootstory.json"
        : kind === "gedcom"
          ? "ged"
          : kind === "text"
            ? "txt"
            : kind
    const filename = exportFilename(family, extension)
    if (kind === "backup") {
      download(backup, filename, "application/json")
      setDigest(await checksum(backup))
      setLastExport(filename)
      onStatus(`Downloaded ${filename}`)
      return
    }
    const variants = {
      gedcom: [exportGedcom(family), "ged", "text/plain"],
      csv: [exportCsv(family), "csv", "text/csv"],
      text: [exportText(family), "txt", "text/plain"],
      html: [exportReadOnlyHtml(family), "html", "text/html"],
    } as const
    const [content, , type] = variants[kind]
    download(content, filename, type)
    setLastExport(filename)
    onStatus(`Downloaded ${filename}`)
  }
  const load = async (file?: File) => {
    if (!file) return
    setError("")
    setPending(null)
    setPendingKind(null)
    const validation = importFileSchema.safeParse(file)
    if (!validation.success) {
      setError(validationMessage(validation))
      if (input.current) input.current.value = ""
      return
    }
    try {
      const text = await file.text()
      if (file.name.toLowerCase().endsWith(".ged")) {
        const imported = importGedcom(text)
        setPendingKind("gedcom")
        setPending({
          ...archive,
          activeFamilyId: imported.id,
          families: [...archive.families, imported],
        })
      } else {
        setPendingKind("archive")
        setPending(importBackup(text))
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Import failed")
    } finally {
      if (input.current) input.current.value = ""
    }
  }
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className={showLabel ? "w-full justify-start" : undefined}
          aria-label="Share and transfer"
        >
          <Icon icon={Share01Icon} />
          <span>Share &amp; transfer</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Share or transfer your archive</DialogTitle>
          <DialogDescription>
            Download a private copy, move or restore everything, or export for
            another application. Rootstory never uploads your archive.
          </DialogDescription>
        </DialogHeader>
        <Card className="border-primary/30 bg-primary/5 shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon icon={Database01Icon} />
              Complete Rootstory archive
            </CardTitle>
            <CardDescription>
              Restores every family, person, relationship, photo, private field,
              sharing record, and display setting.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button onClick={() => save("backup")}>
              <Icon icon={Download04Icon} />
              Download complete archive
            </Button>
            <p className="text-xs text-muted-foreground">
              Complete and restorable ·{" "}
              {Math.ceil(new Blob([backup]).size / 1024)} KB
            </p>
          </CardContent>
        </Card>
        <div className="space-y-1">
          <h3 className="font-medium">Export for other applications</h3>
          <p className="text-sm text-muted-foreground">
            These formats do not restore a complete Rootstory archive.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <ExportCard
            icon={GitBranchIcon}
            title="Genealogy application"
            note="People and family links for compatible genealogy software. No photos or Rootstory settings."
            action="Download GEDCOM"
            onClick={() => save("gedcom")}
          />
          <ExportCard
            icon={Table01Icon}
            title="Spreadsheet"
            note="Profile and contact columns. No photos or family connections."
            action="Download CSV"
            onClick={() => save("csv")}
          />
          <Card className="shadow-none sm:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Icon icon={File01Icon} />
                Read / print
              </CardTitle>
              <CardDescription>
                A readable copy, not a restorable archive. Photos and contact
                fields are excluded.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Button variant="outline" onClick={() => save("text")}>
                Text
              </Button>
              <Button variant="outline" onClick={() => save("html")}>
                HTML
              </Button>
              <Button variant="outline" onClick={() => window.print()}>
                PDF
              </Button>
            </CardContent>
          </Card>
        </div>
        {lastExport && (
          <p
            role="status"
            className="rounded-xl border bg-muted/30 p-3 text-sm"
          >
            Downloaded <strong>{lastExport}</strong>.
          </p>
        )}
        <Separator />
        <div>
          <h3 className="font-medium">Import an archive</h3>
          <p className="text-sm text-muted-foreground">
            Restore a complete Rootstory archive or add a GEDCOM family after
            reviewing its contents.
          </p>
        </div>
        <Field
          id={`${uid}-import`}
          label="Restore Rootstory archive or import GEDCOM"
        >
          <Input
            ref={input}
            id={`${uid}-import`}
            type="file"
            accept=".json,.ged"
            onChange={(e) => load(e.target.files?.[0])}
            aria-invalid={!!error}
            aria-describedby={error ? `${uid}-import-error` : undefined}
          />
        </Field>
        {pending && (
          <Card className="border-primary/30 shadow-none">
            <CardHeader>
              <CardTitle className="text-sm">Import preview</CardTitle>
              <CardDescription>
                {pending.families.length}{" "}
                {pending.families.length === 1 ? "family" : "families"} ·{" "}
                {pending.families.reduce(
                  (total, item) => total + item.people.length,
                  0
                )}{" "}
                people.{" "}
                {pendingKind === "archive"
                  ? "Restoring this complete archive will replace the current archive in this browser."
                  : "Importing this GEDCOM file will add a new family without replacing the current archive."}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Button
                onClick={() => {
                  onImport(pending)
                  setPending(null)
                  setPendingKind(null)
                }}
              >
                {pendingKind === "archive"
                  ? "Restore complete archive"
                  : "Add GEDCOM family"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setPending(null)
                  setPendingKind(null)
                }}
              >
                Cancel
              </Button>
            </CardContent>
          </Card>
        )}
        {error && (
          <p
            id={`${uid}-import-error`}
            role="alert"
            className="text-sm text-destructive"
          >
            {error}
          </p>
        )}
        {digest && (
          <details className="text-xs text-muted-foreground">
            <summary className="cursor-pointer font-medium">
              Verify last complete archive
            </summary>
            <p className="mt-2 break-all">SHA-256: {digest}</p>
          </details>
        )}
      </DialogContent>
    </Dialog>
  )
}
function ExportCard({
  icon,
  title,
  note,
  action,
  onClick,
}: {
  icon: IconData
  title: string
  note: string
  action: string
  onClick: () => void
}) {
  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon icon={icon} />
          {title}
        </CardTitle>
        <CardDescription>{note}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="outline" onClick={onClick} className="w-full">
          {action}
        </Button>
      </CardContent>
    </Card>
  )
}

function SettingsDialog({
  archive,
  onChange,
  showLabel = false,
}: {
  archive: Archive
  onChange: (next: Archive) => void
  showLabel?: boolean
}) {
  const uid = useId()
  const settings = archive.settings,
    patch = <TKey extends keyof Archive["settings"]>(
      key: TKey,
      value: Archive["settings"][TKey]
    ) => {
      const result = settingsInputSchema.safeParse({
        ...settings,
        [key]: value,
      })
      if (result.success) onChange({ ...archive, settings: result.data })
    }
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size={showLabel ? "default" : "icon"}
          aria-label="Settings"
          className={
            showLabel ? "w-full justify-center xl:justify-start" : undefined
          }
        >
          <Icon icon={Settings02Icon} />
          {showLabel && <span>Settings</span>}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Control the tree layout and what appears on screen. Changes are
            saved locally.
          </DialogDescription>
        </DialogHeader>
        <section className="space-y-3" aria-labelledby={`${uid}-tree-heading`}>
          <div className="space-y-1">
            <h3 id={`${uid}-tree-heading`} className="font-medium">
              Tree layout
            </h3>
            <p className="text-sm text-muted-foreground">
              Choose how many generations appear and where older relatives are
              placed.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id={`${uid}-direction`} label="Direction">
              <Select
                value={settings.direction}
                onValueChange={(value) =>
                  patch("direction", value as typeof settings.direction)
                }
              >
                <SelectTrigger id={`${uid}-direction`} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[
                    ["down", "Older generations above"],
                    ["up", "Older generations below"],
                    ["right", "Older generations left"],
                    ["left", "Older generations right"],
                  ].map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field id={`${uid}-generations`} label="Generation depth">
              <Select
                value={settings.generations}
                onValueChange={(value) => patch("generations", value)}
              >
                <SelectTrigger id={`${uid}-generations`} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["2", "3", "4", "5", "all"].map((value) => (
                    <SelectItem key={value} value={value}>
                      {value === "all"
                        ? "All generations"
                        : `${value} generations`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
        </section>
        <Separator />
        <section
          className="space-y-3"
          aria-labelledby={`${uid}-visibility-heading`}
        >
          <div className="space-y-1">
            <h3 id={`${uid}-visibility-heading`} className="font-medium">
              Visibility and privacy
            </h3>
            <p className="text-sm text-muted-foreground">
              These controls affect the screen only. Complete Rootstory archives
              still include photos and contact details.
            </p>
          </div>
          <Label
            htmlFor={`${uid}-photos`}
            className="flex min-h-14 items-center justify-between gap-4 rounded-xl p-3"
          >
            <span>
              <span className="block font-medium">Show photos</span>
              <span className="block text-xs font-normal text-muted-foreground">
                Display uploaded portraits throughout the app.
              </span>
            </span>
            <Switch
              id={`${uid}-photos`}
              checked={settings.showPhotos}
              onCheckedChange={(value) => patch("showPhotos", value)}
            />
          </Label>
          <Label
            htmlFor={`${uid}-contact`}
            className="flex min-h-14 items-center justify-between gap-4 rounded-xl p-3"
          >
            <span>
              <span className="block font-medium">Show contact details</span>
              <span className="block text-xs font-normal text-muted-foreground">
                Reveal email addresses and phone numbers on screen.
              </span>
            </span>
            <Switch
              id={`${uid}-contact`}
              checked={settings.showContact}
              onCheckedChange={(value) => patch("showContact", value)}
            />
          </Label>
        </section>
      </DialogContent>
    </Dialog>
  )
}

function FamilyDialog({
  archive,
  onChange,
}: {
  archive: Archive
  onChange: (next: Archive) => void
}) {
  const uid = useId()
  const [name, setName] = useState(""),
    [firstPersonName, setFirstPersonName] = useState(""),
    [rename, setRename] = useState("")
  const createValidation = familyNameSchema.safeParse(name),
    firstPersonValidation = familyNameSchema.safeParse(firstPersonName),
    renameValidation = familyNameSchema.safeParse(rename),
    createError = validationMessage(createValidation),
    renameError = validationMessage(renameValidation)
  const create = () => {
    if (!createValidation.success || !firstPersonValidation.success) return
    const id = `family-${Date.now()}`,
      anchor = {
        ...blankPerson(),
        id: `person-${Date.now()}`,
        name: firstPersonValidation.data,
        relation: "You",
      }
    onChange({
      ...archive,
      activeFamilyId: id,
      families: [
        ...archive.families,
        {
          id,
          name: createValidation.data,
          anchorId: anchor.id,
          people: [anchor],
          relationships: [],
          shares: [],
        },
      ],
    })
    setName("")
    setFirstPersonName("")
  }
  const active = archive.families.find(
    (item) => item.id === archive.activeFamilyId
  )
  const renameActive = () => {
    if (!renameValidation.success) return
    onChange({
      ...archive,
      families: archive.families.map((item) =>
        item.id === active?.id ? { ...item, name: renameValidation.data } : item
      ),
    })
  }
  useEffect(() => setRename(active?.name || ""), [active?.name])
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          className="h-auto max-w-48 min-w-0 justify-start px-2 text-left"
        >
          <Icon icon={UserMultiple02Icon} />
          <span className="min-w-0">
            <span className="block truncate font-semibold">{active?.name}</span>
            <span className="block truncate text-xs font-normal text-muted-foreground">
              {archive.families.length}{" "}
              {archive.families.length === 1 ? "family" : "families"} · Local to
              this browser
            </span>
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manage families</DialogTitle>
          <DialogDescription>
            Switch, rename, or create a family. Nothing is uploaded.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          {archive.families.map((family) => (
            <div key={family.id} className="flex gap-2">
              <Button
                variant={
                  family.id === archive.activeFamilyId ? "secondary" : "ghost"
                }
                className="min-w-0 flex-1 justify-between"
                onClick={() =>
                  onChange({ ...archive, activeFamilyId: family.id })
                }
              >
                <span className="truncate">{family.name}</span>
                <Badge variant="outline">{family.people.length} people</Badge>
              </Button>
              <ConfirmAction
                trigger={
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Remove ${family.name}`}
                    disabled={archive.families.length === 1}
                  >
                    <Icon icon={Delete02Icon} />
                  </Button>
                }
                title={`Remove ${family.name}?`}
                description={`This removes ${family.people.length} people and every relationship in this local family. You can restore the previous version from history.`}
                action="Remove family"
                onConfirm={() => {
                  const families = archive.families.filter(
                    (item) => item.id !== family.id
                  )
                  onChange({
                    ...archive,
                    activeFamilyId:
                      family.id === archive.activeFamilyId
                        ? families[0].id
                        : archive.activeFamilyId,
                    families,
                  })
                }}
              />
            </div>
          ))}
        </div>
        <Field
          id={`${uid}-rename`}
          label="Rename active family"
          error={rename ? renameError : undefined}
        >
          <div className="flex gap-2">
            <Input
              id={`${uid}-rename`}
              value={rename}
              onChange={(e) => setRename(e.target.value)}
              maxLength={120}
              aria-invalid={!!(rename && !renameValidation.success)}
              aria-describedby={
                rename && !renameValidation.success
                  ? `${uid}-rename-error`
                  : undefined
              }
            />
            <Button
              variant="outline"
              disabled={
                !renameValidation.success ||
                renameValidation.data === active?.name
              }
              onClick={renameActive}
            >
              Rename
            </Button>
          </div>
        </Field>
        <Separator />
        <Field
          id={`${uid}-create`}
          label="Create a family"
          required
          error={name ? createError : undefined}
        >
          <div className="flex gap-2">
            <Input
              id={`${uid}-create`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Family name"
              maxLength={120}
              aria-invalid={!!(name && !createValidation.success)}
              aria-describedby={
                name && !createValidation.success
                  ? `${uid}-create-error`
                  : undefined
              }
            />
          </div>
        </Field>
        <Field
          id={`${uid}-first-person`}
          label="Your name or the first person"
          required
        >
          <Input
            id={`${uid}-first-person`}
            value={firstPersonName}
            onChange={(event) => setFirstPersonName(event.target.value)}
            placeholder="Full name"
            maxLength={120}
          />
        </Field>
        <Button
          onClick={create}
          disabled={!createValidation.success || !firstPersonValidation.success}
        >
          Create family
        </Button>
        <p className="rounded-xl border bg-muted/30 p-3 text-sm text-muted-foreground">
          <Icon icon={InformationCircleIcon} /> After creating the family,
          select the first person and add a relative. Existing archives can be
          added from Share &amp; transfer.
        </p>
      </DialogContent>
    </Dialog>
  )
}

function PersonDetails({
  person,
  family,
  settings,
  onEdit,
  onDelete,
  onRelationship,
  onRelationshipChange,
  onRelationshipDelete,
  onShowContact,
  onViewInTree,
  onClose,
}: {
  person: Person
  family: Family
  settings: Archive["settings"]
  onEdit: (person: Person) => void
  onDelete: () => void
  onRelationship: (
    target: Person,
    type: RelationshipType,
    isNew: boolean,
    date: string,
    location: string
  ) => void
  onRelationshipChange: (
    id: string,
    patch: Partial<Pick<Relationship, "type" | "date" | "location">>
  ) => void
  onRelationshipDelete: (id: string) => void
  onShowContact: () => void
  onViewInTree: () => void
  onClose?: () => void
}) {
  const photoId = useId()
  const [photoError, setPhotoError] = useState("")
  const relations = family.relationships.filter(
    (item) => item.from === person.id || item.to === person.id
  )
  return (
    <section className="flex h-full min-h-0 flex-col">
      <header className="flex items-start gap-3 p-5 pr-12 pb-4 lg:pr-5">
        <Avatar className="size-12">
          <AvatarImage src={settings.showPhotos ? person.photo : ""} alt="" />
          <AvatarFallback className={tones[person.tone]}>
            {initials(person.name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-lg font-semibold">{person.name}</h2>
          <p className="text-sm text-muted-foreground">{years(person)}</p>
        </div>
        <Badge variant="secondary">{person.relation}</Badge>
        {onClose && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Close person details"
                onClick={onClose}
              >
                <Icon icon={Cancel01Icon} size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Close details</TooltipContent>
          </Tooltip>
        )}
      </header>
      <div className="flex flex-wrap gap-2 px-5 pb-4">
        <RelationshipDialog
          family={family}
          selected={person}
          onSave={onRelationship}
          trigger={
            <Button className="min-w-0 flex-1">
              <Icon icon={UserAdd01Icon} />
              Add relative
            </Button>
          }
        />
        <PersonDialog
          person={person}
          onSave={onEdit}
          trigger={
            <Button variant="outline" aria-label={`Edit ${person.name}`}>
              <Icon icon={Edit02Icon} />
              Edit
            </Button>
          }
        />
        <ConfirmAction
          trigger={
            <Button
              variant="outline"
              size="icon"
              aria-label={`Delete ${person.name}`}
              disabled={family.people.length === 1}
            >
              <Icon icon={Delete02Icon} />
            </Button>
          }
          title={`Delete ${person.name}?`}
          description={`This also removes ${relations.length} connected relationships. You can restore the previous version from history.`}
          action="Delete person"
          onConfirm={onDelete}
        />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              aria-label={`View ${person.name} in tree`}
              onClick={onViewInTree}
            >
              <Icon icon={CenterFocusIcon} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>View in tree</TooltipContent>
        </Tooltip>
      </div>
      <Separator />
      <Tabs defaultValue="overview" className="min-h-0 flex-1 gap-0">
        <ScrollArea className="w-full [&_[data-slot=scroll-area-viewport]]:!overflow-y-hidden">
          <TabsList variant="line" className="mt-2 mb-px w-full min-w-max px-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="relationships">Relationships</TabsTrigger>
            <TabsTrigger value="life">Life</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
            <TabsTrigger value="media">Media</TabsTrigger>
          </TabsList>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
        <ScrollArea className="min-h-0 flex-1 [&_[data-slot=scroll-area-viewport]>div]:!block [&_[data-slot=scroll-area-viewport]>div]:!w-full">
          <TabsContent value="overview" className="space-y-3 p-5">
            <Fact icon={Location01Icon} label="Home" value={person.location} />
            <Fact icon={Briefcase01Icon} label="Work" value={person.work} />
          </TabsContent>
          <TabsContent value="relationships" className="space-y-3 p-5">
            <div className="rounded-xl bg-muted/50 p-4">
              <p className="text-sm font-medium">
                Build {person.name}'s branch
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Add this person's relatives one at a time. Multiple partners or
                spouses are supported and appear as separate relationships.
              </p>
              <p className="mt-2 text-xs font-medium text-muted-foreground">
                Changes save when selected or when you leave a field. Use Undo
                in the header to reverse a mistake.
              </p>
            </div>
            <RelationshipDialog
              family={family}
              selected={person}
              onSave={onRelationship}
              trigger={
                <Button variant="outline" className="w-full">
                  <Icon icon={UserAdd01Icon} />
                  Add another relative
                </Button>
              }
            />
            {relations.map((relation) => {
              const other = family.people.find(
                (item) =>
                  item.id ===
                  (relation.from === person.id ? relation.to : relation.from)
              )
              return (
                <Card key={relation.id} className="gap-0 p-0 shadow-none">
                  <CardContent className="space-y-3 p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{other?.name}</span>
                      <ConfirmAction
                        trigger={
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            aria-label={`Delete relationship with ${other?.name}`}
                          >
                            <Icon icon={Delete02Icon} size={15} />
                          </Button>
                        }
                        title="Delete this relationship?"
                        description={`${person.name} and ${other?.name} will remain in the family. Only their ${relation.type} connection is removed.`}
                        action="Delete relationship"
                        onConfirm={() => onRelationshipDelete(relation.id)}
                      />
                    </div>
                    <Select
                      value={relation.type}
                      onValueChange={(value) => {
                        const result = relationshipTypeSchema.safeParse(value)
                        if (result.success)
                          onRelationshipChange(relation.id, {
                            type: result.data,
                          })
                      }}
                    >
                      <SelectTrigger
                        className="w-full"
                        aria-label={`Relationship type with ${other?.name}`}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {relationshipOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {relationshipChoiceLabel(
                              option.value,
                              person.name,
                              other?.name
                            )}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="grid items-start gap-2 sm:grid-cols-2">
                      <ValidatedRelationshipInput
                        value={relation.date || ""}
                        onCommit={(date) =>
                          onRelationshipChange(relation.id, {
                            date,
                          })
                        }
                        placeholder="YYYY-MM-DD"
                        maxLength={10}
                        label={`Relationship date with ${other?.name}`}
                        schema={partialDateSchema}
                      />
                      <ValidatedRelationshipInput
                        value={relation.location || ""}
                        onCommit={(location) =>
                          onRelationshipChange(relation.id, {
                            location,
                          })
                        }
                        placeholder="Relationship place"
                        maxLength={160}
                        label={`Relationship place with ${other?.name}`}
                        schema={relationshipLocationSchema}
                      />
                    </div>
                  </CardContent>
                </Card>
              )
            })}
            {!relations.length && (
              <p className="text-sm text-muted-foreground">
                No relationships yet.
              </p>
            )}
          </TabsContent>
          <TabsContent value="life" className="space-y-3 p-5">
            <Fact
              icon={BirthdayCakeIcon}
              label={
                person.birthQualifier === "exact"
                  ? "Birth date"
                  : `${person.birthQualifier[0].toUpperCase() + person.birthQualifier.slice(1)} birth date`
              }
              value={formatPartialDate(person.birthDate)}
            />
            {!person.living && (
              <Fact
                icon={HistoryIcon}
                label="Death"
                value={formatPartialDate(person.deathDate)}
              />
            )}
            <p className="rounded-xl border p-4 text-sm leading-6 text-muted-foreground">
              {person.note || "No story added."}
            </p>
          </TabsContent>
          <TabsContent value="contact" className="space-y-3 p-5">
            {settings.showContact ? (
              <>
                <Fact
                  icon={Mail01Icon}
                  label="Email"
                  value={person.email || "Not added"}
                />
                <Fact
                  icon={Home01Icon}
                  label="Phone"
                  value={person.phone || "Not added"}
                />
              </>
            ) : (
              <div className="space-y-3 rounded-xl border p-4 text-sm text-muted-foreground">
                <p className="flex items-center gap-2">
                  <Icon icon={LockIcon} /> Contact fields are hidden for
                  privacy.
                </p>
                <Button variant="outline" size="sm" onClick={onShowContact}>
                  Show contact details
                </Button>
              </div>
            )}
          </TabsContent>
          <TabsContent value="media" className="space-y-3 p-5">
            {person.photo ? (
              <Avatar className="size-32 rounded-2xl">
                <AvatarImage src={person.photo} alt={person.name} />
                <AvatarFallback>{initials(person.name)}</AvatarFallback>
              </Avatar>
            ) : (
              <div className="grid min-h-32 place-items-center rounded-2xl border border-dashed text-muted-foreground">
                <Icon icon={Image01Icon} size={28} />
              </div>
            )}
            <p className="text-sm text-muted-foreground">
              Portraits stay in this browser and are included in complete
              Rootstory archives.
            </p>
            <Label htmlFor={photoId} className="sr-only">
              Upload portrait
            </Label>
            <Input
              id={photoId}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (!file) return
                const result = photoFileSchema.safeParse(file)
                if (!result.success) {
                  setPhotoError(validationMessage(result))
                  return
                }
                const reader = new FileReader()
                reader.onload = () => {
                  onEdit({ ...person, photo: String(reader.result) })
                  setPhotoError("")
                }
                reader.onerror = () =>
                  setPhotoError(
                    "This image could not be read. Try another file."
                  )
                reader.readAsDataURL(file)
              }}
              aria-invalid={!!photoError}
              aria-describedby={photoError ? `${photoId}-error` : undefined}
            />
            {photoError && (
              <p
                id={`${photoId}-error`}
                role="alert"
                className="text-xs text-destructive"
              >
                {photoError}
              </p>
            )}
            {person.photo && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit({ ...person, photo: "" })}
              >
                Remove portrait
              </Button>
            )}
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </section>
  )
}

export function RootstoryApp() {
  const [archive, setArchive] = useState<Archive>(() =>
      cloneArchive(demoArchive)
    ),
    [versions, setVersions] = useState<ArchiveVersion[]>([]),
    [loaded, setLoaded] = useState(false)
  const [selectedId, setSelectedId] = useState("ada"),
    [query, setQuery] = useState(""),
    [view, setView] = useState<View>("tree"),
    [zoom, setZoom] = useState<keyof typeof zooms>(100),
    [detailsOpen, setDetailsOpen] = useState(true),
    [mobileDetails, setMobileDetails] = useState(false),
    [mobileNav, setMobileNav] = useState(false),
    [historyOpen, setHistoryOpen] = useState(false),
    [status, setStatus] = useState("All changes saved locally"),
    [collapsed, setCollapsed] = useState<Set<string>>(new Set()),
    [treeCommand, setTreeCommand] = useState<TreeCommand>()
  const family =
      archive.families.find((item) => item.id === archive.activeFamilyId) ||
      archive.families[0],
    selected =
      family.people.find((item) => item.id === selectedId) || family.people[0]
  useEffect(() => {
    void loadWorkspace()
      .then((workspace) => {
        if (workspace) {
          setArchive(workspace.archive)
          setVersions(workspace.history)
        } else
          setArchive((current) => ({
            ...current,
            updatedAt: new Date().toISOString(),
          }))
      })
      .catch(() =>
        setStatus("Saved data could not be loaded; demo data is open")
      )
      .finally(() => setLoaded(true))
  }, [])
  useEffect(() => {
    document.documentElement.classList.toggle(
      "dark",
      archive.settings.theme === "dark"
    )
    if (!loaded) return
    const timer = window.setTimeout(() => {
      void saveWorkspace(archive, versions)
        .then(() => setStatus("All changes saved locally"))
        .catch(() =>
          setStatus(
            "Save failed: browser storage is full. Export a complete Rootstory archive, then remove large photos."
          )
        )
    }, 250)
    return () => window.clearTimeout(timer)
  }, [archive, loaded, versions])
  useEffect(() => {
    if (!family.people.some((item) => item.id === selectedId))
      setSelectedId(family.anchorId || family.people[0]?.id)
  }, [family, selectedId])
  const commit = (
    label: string,
    next: Archive | ((current: Archive) => Archive)
  ) => {
    setVersions((items) =>
      trimHistory([
        {
          id: `v-${Date.now()}`,
          label,
          date: new Date().toISOString(),
          archive: cloneArchive(archive),
        },
        ...items,
      ])
    )
    setStatus("Saving…")
    setArchive((current) => ({
      ...(typeof next === "function" ? next(current) : next),
      updatedAt: new Date().toISOString(),
    }))
  }
  const updateFamily = (next: Family, label: string) =>
    commit(label, (current) => ({
      ...current,
      families: current.families.map((item) =>
        item.id === next.id ? next : item
      ),
    }))
  const savePerson = (person: Person) =>
    updateFamily(
      {
        ...family,
        people: family.people.map((item) =>
          item.id === person.id ? person : item
        ),
      },
      `Edited ${person.name}`
    )
  const addPerson = (person: Person) => {
    updateFamily(
      { ...family, people: [...family.people, person] },
      `Added ${person.name}`
    )
    setSelectedId(person.id)
  }
  const deletePerson = () => {
    const people = family.people.filter((item) => item.id !== selected.id)
    updateFamily(
      {
        ...family,
        anchorId:
          family.anchorId === selected.id ? people[0].id : family.anchorId,
        people,
        relationships: family.relationships.filter(
          (item) => item.from !== selected.id && item.to !== selected.id
        ),
      },
      `Deleted ${selected.name}`
    )
    setSelectedId(people[0].id)
  }
  const addRelationship = (
    target: Person,
    type: RelationshipType,
    isNew: boolean,
    date: string,
    location: string
  ) => {
    const ends = relationshipEnds(selected.id, target.id, type)
    if (
      family.relationships.some(
        (item) =>
          item.from === ends.from && item.to === ends.to && item.type === type
      )
    ) {
      setStatus("This relationship already exists")
      return
    }
    const rel: Relationship = {
      id: `rel-${Date.now()}`,
      ...ends,
      type,
      date: date.trim() || undefined,
      location: location.trim() || undefined,
    }
    updateFamily(
      {
        ...family,
        people: isNew ? [...family.people, target] : family.people,
        relationships: [...family.relationships, rel],
      },
      `Connected ${selected.name} and ${target.name}`
    )
    if (isNew) setSelectedId(target.id)
  }
  const changeRelationship = (
    id: string,
    patch: Partial<Pick<Relationship, "type" | "date" | "location">>
  ) =>
    updateFamily(
      {
        ...family,
        relationships: family.relationships.map((item) => {
          if (item.id !== id) return item
          const type = patch.type || item.type
          const otherId = item.from === selected.id ? item.to : item.from
          return {
            ...item,
            ...(patch.type
              ? relationshipEnds(selected.id, otherId, type)
              : undefined),
            ...patch,
          }
        }),
      },
      "Changed relationship"
    )
  const deleteRelationship = (id: string) =>
    updateFamily(
      {
        ...family,
        relationships: family.relationships.filter((item) => item.id !== id),
      },
      "Deleted relationship"
    )
  const restore = (version: ArchiveVersion) => {
    const current: ArchiveVersion = {
      id: `v-${Date.now()}`,
      label: "Before restore",
      date: new Date().toISOString(),
      archive: cloneArchive(archive),
    }
    setArchive({
      ...cloneArchive(version.archive),
      updatedAt: new Date().toISOString(),
    })
    setVersions((items) =>
      trimHistory([current, ...items.filter((item) => item.id !== version.id)])
    )
    setHistoryOpen(false)
    setStatus(`Restored ${version.label}`)
  }
  const people = useMemo(() => searchPeople(family, query), [family, query])
  const hiddenBranches = useMemo(() => {
    const hidden = new Set<string>()
    for (const root of collapsed)
      for (const id of descendantIds(family, root)) hidden.add(id)
    return hidden
  }, [collapsed, family])
  const selectedDescendants = useMemo(
    () => descendantIds(family, selected.id),
    [family, selected.id]
  )
  const events = useMemo(() => buildFamilyEvents(family), [family])
  const levelsByPerson = useMemo(() => generationMap(family), [family])
  const treeLevels = [
    ...new Set(
      family.people.map((person) => levelsByPerson.get(person.id) || 0)
    ),
  ].sort((a, b) => a - b)
  const choose = (id: string) => {
      setSelectedId(id)
      if (window.matchMedia("(max-width: 1023px)").matches)
        setMobileDetails(true)
      else setDetailsOpen(true)
    },
    showInTree = (id: string) => {
      setSelectedId(id)
      setView("tree")
      setMobileDetails(false)
      setTreeCommand({ id: Date.now(), type: "center", personId: id })
    },
    changeView = (next: View) => {
      setView(next)
      setMobileNav(false)
    }
  const nav = (next: View, label: string, icon: IconData) => (
    <Tool
      label={label}
      icon={icon}
      active={view === next}
      showLabel
      onClick={() => changeView(next)}
    />
  )
  return (
    <main className="flex h-svh flex-col overflow-hidden bg-background text-foreground print:h-auto print:min-h-svh print:overflow-visible">
      <header className="flex h-16 shrink-0 items-center gap-1 border-b bg-background px-2 sm:gap-2 sm:px-5 print:hidden">
        <div className="flex shrink-0 items-center gap-2">
          <RootstoryMark className="size-9 text-primary" />
          <span className="hidden text-sm font-semibold tracking-tight md:inline">
            Rootstory
          </span>
        </div>
        <FamilyDialog
          archive={archive}
          onChange={(next) => commit("Changed family", next)}
        />
        <div className="ml-auto flex items-center gap-1 lg:hidden">
          <PersonDialog
            onSave={addPerson}
            trigger={
              <Button size="icon" aria-label="Add person">
                <Icon icon={Add01Icon} />
              </Button>
            }
          />
          <Button
            variant="ghost"
            size="icon"
            aria-label="Open navigation"
            onClick={() => setMobileNav(true)}
          >
            <Icon icon={Menu01Icon} />
          </Button>
        </div>
        <div className="ml-auto hidden items-center gap-1.5 lg:flex">
          <PersonSearch
            family={family}
            query={query}
            onQueryChange={setQuery}
            onChoose={showInTree}
            className={
              view === "people" || view === "timeline"
                ? "hidden"
                : "hidden w-64 md:block"
            }
          />
          <Tool
            label="Undo"
            icon={UndoIcon}
            disabled={!versions.length}
            onClick={() => versions[0] && restore(versions[0])}
          />
          <Tool
            label="Version history"
            icon={HistoryIcon}
            onClick={() => setHistoryOpen(true)}
          />
          <Tool
            label="Toggle theme"
            icon={archive.settings.theme === "dark" ? Sun02Icon : Moon02Icon}
            onClick={() =>
              commit("Changed theme", {
                ...archive,
                settings: {
                  ...archive.settings,
                  theme: archive.settings.theme === "dark" ? "light" : "dark",
                },
              })
            }
          />
          <ExportDialog
            archive={archive}
            family={family}
            onImport={(next) => commit("Imported data", next)}
            onStatus={setStatus}
          />
          <PersonDialog
            onSave={addPerson}
            trigger={
              <Button>
                <Icon icon={Add01Icon} />
                Add person
              </Button>
            }
          />
        </div>
      </header>
      <span role="status" aria-live="polite" className="sr-only">
        {status}
      </span>
      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-40 shrink-0 flex-col items-stretch gap-1 border-r px-2 py-3 lg:flex 2xl:w-44 print:hidden">
          {nav("tree", "Tree", GitBranchIcon)}
          {nav("people", "People", UserMultiple02Icon)}
          {nav("timeline", "Timeline", HistoryIcon)}
          {nav("calendar", "Calendar", Calendar03Icon)}
          <Separator className="my-2 w-8" />
          <Tool
            label="Print / PDF"
            icon={PrinterIcon}
            showLabel
            onClick={() => window.print()}
          />
          <div className="mt-auto">
            <SettingsDialog
              archive={archive}
              onChange={(next) => commit("Changed settings", next)}
              showLabel
            />
          </div>
        </aside>
        <section className="relative min-w-0 flex-1 overflow-hidden bg-muted/20 print:overflow-visible">
          {status !== "All changes saved locally" && (
            <div className="absolute bottom-4 left-1/2 z-40 flex max-w-[calc(100%-2rem)] -translate-x-1/2 items-center gap-2 rounded-xl border bg-background px-3 py-2 text-sm shadow-lg print:hidden">
              <Icon icon={Database01Icon} size={16} />
              <span className="truncate">{status}</span>
            </div>
          )}
          {view === "tree" && (
            <>
              <div className="absolute inset-x-3 top-3 z-20 flex max-w-full items-center overflow-x-auto rounded-xl border bg-background p-1 shadow-sm sm:inset-x-auto sm:top-5 sm:left-5 print:hidden">
                <div className="flex shrink-0 items-center gap-1">
                  <div className="hidden items-center gap-1 sm:flex">
                    <Tool
                      label="Zoom out"
                      icon={ZoomOutIcon}
                      onClick={() =>
                        setZoom(
                          (value) =>
                            Math.max(40, value - 10) as keyof typeof zooms
                        )
                      }
                    />
                    <Badge variant="outline">{zoom}%</Badge>
                    <Tool
                      label="Zoom in"
                      icon={ZoomInIcon}
                      onClick={() =>
                        setZoom(
                          (value) =>
                            Math.min(140, value + 10) as keyof typeof zooms
                        )
                      }
                    />
                  </div>
                  <Tool
                    label={`Center ${selected.name}`}
                    icon={CenterFocusIcon}
                    onClick={() =>
                      setTreeCommand({
                        id: Date.now(),
                        type: "center",
                        personId: selected.id,
                      })
                    }
                  />
                  <Tool
                    label="Fit tree"
                    icon={ArrowExpandIcon}
                    onClick={() =>
                      setTreeCommand({ id: Date.now(), type: "fit" })
                    }
                  />
                </div>
                <Separator orientation="vertical" className="mx-1 h-6" />
                <Button
                  variant="ghost"
                  size="sm"
                  className="shrink-0"
                  disabled={
                    !collapsed.has(selected.id) && !selectedDescendants.size
                  }
                  onClick={() =>
                    setCollapsed((current) => {
                      const next = new Set(current)
                      next.has(selected.id)
                        ? next.delete(selected.id)
                        : next.add(selected.id)
                      return next
                    })
                  }
                >
                  {collapsed.has(selected.id)
                    ? `Expand branch (${selectedDescendants.size})`
                    : `Collapse branch (${selectedDescendants.size})`}
                </Button>
                <Separator
                  orientation="vertical"
                  className="mx-1 hidden h-6 sm:block"
                />
                <Select
                  onValueChange={(level) =>
                    document
                      .getElementById(`tree-generation-${level}`)
                      ?.scrollIntoView({
                        behavior: "smooth",
                        block: "center",
                        inline: "center",
                      })
                  }
                >
                  <SelectTrigger
                    className="hidden w-40 shrink-0 border-0 bg-transparent shadow-none sm:flex"
                    aria-label="Jump to generation"
                  >
                    <SelectValue placeholder="Jump to generation" />
                  </SelectTrigger>
                  <SelectContent>
                    {treeLevels.map((level) => (
                      <SelectItem key={level} value={String(level)}>
                        {level < 0
                          ? `${Math.abs(level)} generation${Math.abs(level) === 1 ? "" : "s"} above`
                          : level > 0
                            ? `${level} generation${level === 1 ? "" : "s"} below`
                            : "Starting generation"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <TreeView
                family={family}
                people={family.people.filter(
                  (person) => !hiddenBranches.has(person.id)
                )}
                matchedIds={
                  query.trim() && people.length
                    ? new Set(people.map((person) => person.id))
                    : undefined
                }
                selectedId={selected.id}
                settings={archive.settings}
                zoom={zoom}
                command={treeCommand}
                onZoomChange={setZoom}
                choose={choose}
              />
            </>
          )}
          {view === "people" && (
            <PeopleView
              family={family}
              people={people}
              query={query}
              settings={archive.settings}
              selectedId={selected.id}
              onQueryChange={setQuery}
              choose={choose}
            />
          )}
          {view === "timeline" && (
            <TimelineView
              family={family}
              events={events}
              selectedId={selected.id}
              choose={choose}
              viewInTree={showInTree}
            />
          )}
          {view === "calendar" && (
            <CalendarView
              family={family}
              selectedId={selected.id}
              choose={choose}
              viewInTree={showInTree}
              onStatus={setStatus}
            />
          )}
        </section>
        {detailsOpen && (
          <aside className="hidden min-h-0 w-[25.2rem] shrink-0 overflow-hidden border-l bg-background lg:block print:hidden">
            <PersonDetails
              person={selected}
              family={family}
              settings={archive.settings}
              onEdit={savePerson}
              onDelete={deletePerson}
              onRelationship={addRelationship}
              onRelationshipChange={changeRelationship}
              onRelationshipDelete={deleteRelationship}
              onShowContact={() =>
                commit("Showed contact details", {
                  ...archive,
                  settings: { ...archive.settings, showContact: true },
                })
              }
              onViewInTree={() => showInTree(selected.id)}
              onClose={() => setDetailsOpen(false)}
            />
          </aside>
        )}
      </div>
      <Sheet open={mobileNav} onOpenChange={setMobileNav}>
        <SheetContent side="left" className="w-80 lg:hidden">
          <SheetHeader>
            <SheetTitle>Rootstory workspace</SheetTitle>
            <SheetDescription>
              Search, change views and manage the archive.
            </SheetDescription>
          </SheetHeader>
          <div className="grid gap-2 px-4">
            {view !== "people" && view !== "timeline" && (
              <PersonSearch
                family={family}
                query={query}
                onQueryChange={setQuery}
                onChoose={(id) => {
                  showInTree(id)
                  setMobileNav(false)
                }}
              />
            )}
            {[
              ["tree", "Tree", GitBranchIcon],
              ["people", "People", UserMultiple02Icon],
              ["timeline", "Timeline", HistoryIcon],
              ["calendar", "Calendar", Calendar03Icon],
            ].map(([value, label, icon]) => (
              <Button
                key={String(value)}
                variant={view === value ? "secondary" : "ghost"}
                className="justify-start"
                onClick={() => changeView(value as View)}
              >
                <Icon icon={icon as IconData} />
                {String(label)}
              </Button>
            ))}
            <Separator className="my-2" />
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                aria-label="Undo"
                disabled={!versions.length}
                onClick={() => versions[0] && restore(versions[0])}
              >
                <Icon icon={UndoIcon} />
                Undo
              </Button>
              <Button
                variant="outline"
                aria-label="Version history"
                onClick={() => {
                  setMobileNav(false)
                  setHistoryOpen(true)
                }}
              >
                <Icon icon={HistoryIcon} />
                History
              </Button>
              <Button
                variant="outline"
                className="col-span-2"
                aria-label="Toggle theme"
                onClick={() =>
                  commit("Changed theme", {
                    ...archive,
                    settings: {
                      ...archive.settings,
                      theme:
                        archive.settings.theme === "dark" ? "light" : "dark",
                    },
                  })
                }
              >
                <Icon
                  icon={
                    archive.settings.theme === "dark" ? Sun02Icon : Moon02Icon
                  }
                />
                {archive.settings.theme === "dark" ? "Light mode" : "Dark mode"}
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2 [&>button]:w-full [&>button]:justify-start">
              <ExportDialog
                archive={archive}
                family={family}
                onImport={(next) => commit("Imported data", next)}
                onStatus={setStatus}
                showLabel
              />
              <SettingsDialog
                archive={archive}
                onChange={(next) => commit("Changed settings", next)}
                showLabel
              />
              <Button
                variant="outline"
                aria-label="Print / PDF"
                onClick={() => window.print()}
              >
                <Icon icon={PrinterIcon} />
                Print / PDF
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
      <Sheet open={mobileDetails} onOpenChange={setMobileDetails}>
        <SheetContent
          side="bottom"
          className="max-h-[85svh] rounded-t-3xl lg:hidden"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>{selected.name}</SheetTitle>
            <SheetDescription>Person details</SheetDescription>
          </SheetHeader>
          <PersonDetails
            person={selected}
            family={family}
            settings={archive.settings}
            onEdit={savePerson}
            onDelete={deletePerson}
            onRelationship={addRelationship}
            onRelationshipChange={changeRelationship}
            onRelationshipDelete={deleteRelationship}
            onShowContact={() =>
              commit("Showed contact details", {
                ...archive,
                settings: { ...archive.settings, showContact: true },
              })
            }
            onViewInTree={() => {
              showInTree(selected.id)
            }}
          />
        </SheetContent>
      </Sheet>
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Version history</DialogTitle>
            <DialogDescription>
              Up to 20 recent changes are saved in this browser. Restoring keeps
              the current archive as a recoverable snapshot.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {versions.length ? (
              versions.map((version) => (
                <Card
                  key={version.id}
                  className="border border-border shadow-none ring-0"
                >
                  <CardContent className="flex items-center justify-between p-3">
                    <span>
                      <span className="block text-sm font-medium">
                        {version.label}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {new Date(version.date).toLocaleString()}
                      </span>
                    </span>
                    <Button variant="outline" onClick={() => restore(version)}>
                      Restore
                    </Button>
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No saved changes yet.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </main>
  )
}

type TreeEdgePath = {
  id: string
  path: string
  kind: "parent" | "partner" | "former" | "sibling"
  junction?: { x: number; y: number }
}

const treeEdgeColor: Record<TreeEdgePath["kind"], string> = {
  parent: "text-blue-600 dark:text-blue-400",
  partner: "text-rose-600 dark:text-rose-400",
  former: "text-amber-700 dark:text-amber-400",
  sibling: "text-emerald-600 dark:text-emerald-400",
}

function TreeRelationships({
  family,
  container,
  nodes,
  refreshKey,
  direction,
}: {
  family: Family
  container: React.RefObject<HTMLDivElement | null>
  nodes: React.RefObject<Map<string, HTMLButtonElement>>
  refreshKey: string
  direction: Archive["settings"]["direction"]
}) {
  const [paths, setPaths] = useState<TreeEdgePath[]>([])
  useEffect(() => {
    const root = container.current
    if (!root) return
    const update = () => {
      const rootRect = root.getBoundingClientRect()
      const scaleX = root.offsetWidth ? rootRect.width / root.offsetWidth : 1
      const scaleY = root.offsetHeight ? rootRect.height / root.offsetHeight : 1
      const bounds = (id: string) => {
        const node = nodes.current.get(id)
        if (!node) return null
        const rect = node.getBoundingClientRect()
        const left = (rect.left - rootRect.left) / scaleX
        const top = (rect.top - rootRect.top) / scaleY
        const width = rect.width / scaleX
        const height = rect.height / scaleY
        return {
          left,
          right: left + width,
          top,
          bottom: top + height,
          x: left + width / 2,
          y: top + height / 2,
          width,
          height,
        }
      }
      const treeVertical = direction === "down" || direction === "up"
      const parentGroups = treeParentGroups(family)
      const otherEdges: TreeEdgePath[] = []
      for (const relationship of family.relationships) {
        const parent =
          relationship.type.includes("parent") || relationship.type === "child"
        if (parent) continue
        if (relationship.type === "sibling") {
          const fromParents = parentGroups.get(relationship.from)?.parentIds
          const toParents = parentGroups.get(relationship.to)?.parentIds
          if (
            fromParents &&
            toParents &&
            fromParents.length === toParents.length &&
            fromParents.every((id) => toParents.includes(id))
          )
            continue
        }
        const from = bounds(relationship.from)
        const to = bounds(relationship.to)
        if (!from || !to) continue
        const sibling = relationship.type === "sibling"
        let path: string
        if (treeVertical && sibling) {
          const laneY = Math.max(from.bottom, to.bottom) + 14
          path = `M ${from.x} ${from.bottom} V ${laneY} H ${to.x} V ${to.bottom}`
        } else if (!treeVertical && sibling) {
          const laneX = Math.max(from.right, to.right) + 14
          path = `M ${from.right} ${from.y} H ${laneX} V ${to.y} H ${to.right}`
        } else if (treeVertical) {
          const rightward = to.x >= from.x
          path = `M ${rightward ? from.right : from.left} ${from.y} H ${rightward ? to.left : to.right}`
        } else {
          const downward = to.y >= from.y
          path = `M ${from.x} ${downward ? from.bottom : from.top} V ${downward ? to.top : to.bottom}`
        }
        otherEdges.push({
          id: relationship.id,
          path,
          kind:
            relationship.type === "partner"
              ? "partner"
              : relationship.type === "ex-partner"
                ? "former"
                : "sibling",
        })
      }
      const parentEdges = treeParentUnits(family).flatMap((unit) => {
        const children = unit.childIds.flatMap((id) => {
          const child = bounds(id)
          return child ? [child] : []
        })
        const parents = unit.parentIds.flatMap((id) => {
          const parent = bounds(id)
          return parent ? [parent] : []
        })
        if (!children.length || !parents.length) return []
        const partner = unit.partnerId ? bounds(unit.partnerId) : null
        let path: string
        let junction: TreeEdgePath["junction"]
        if (treeVertical) {
          const downward =
            children.reduce((sum, item) => sum + item.y, 0) / children.length >=
            parents.reduce((sum, item) => sum + item.y, 0) / parents.length
          const childEdge = (item: (typeof children)[number]) =>
            downward ? item.top : item.bottom
          const parentEdge = (item: (typeof parents)[number]) =>
            downward ? item.bottom : item.top
          const nearestChildY = downward
            ? Math.min(...children.map(childEdge))
            : Math.max(...children.map(childEdge))
          const nearParentY = parentEdge(parents[0])
          const junctionY = (nearParentY + nearestChildY) / 2
          const parts: string[] = []
          let originX: number
          let originY: number
          if (parents.length === 1 && partner) {
            originX = (parents[0].x + partner.x) / 2
            originY = (parents[0].y + partner.y) / 2
            junction = { x: originX, y: originY }
          } else if (parents.length === 1) {
            originX = parents[0].x
            originY = nearParentY
          } else {
            const parentXs = parents.map((item) => item.x)
            const left = Math.min(...parentXs)
            const right = Math.max(...parentXs)
            originX = (left + right) / 2
            originY = junctionY
            junction = { x: originX, y: originY }
            parts.push(
              `M ${left} ${junctionY} H ${right}`,
              ...parents.map(
                (item) => `M ${item.x} ${parentEdge(item)} V ${junctionY}`
              )
            )
          }
          const childTurnY = (originY + nearestChildY) / 2
          const childXs = children.map((item) => item.x)
          parts.push(`M ${originX} ${originY} V ${childTurnY}`)
          if (children.length > 1 || childXs[0] !== originX)
            parts.push(
              `M ${Math.min(originX, ...childXs)} ${childTurnY} H ${Math.max(originX, ...childXs)}`
            )
          parts.push(
            ...children.map(
              (item) => `M ${item.x} ${childTurnY} V ${childEdge(item)}`
            )
          )
          path = parts.join(" ")
        } else {
          const rightward =
            children.reduce((sum, item) => sum + item.x, 0) / children.length >=
            parents.reduce((sum, item) => sum + item.x, 0) / parents.length
          const childEdge = (item: (typeof children)[number]) =>
            rightward ? item.left : item.right
          const parentEdge = (item: (typeof parents)[number]) =>
            rightward ? item.right : item.left
          const nearestChildX = rightward
            ? Math.min(...children.map(childEdge))
            : Math.max(...children.map(childEdge))
          const nearParentX = parentEdge(parents[0])
          const junctionX = (nearParentX + nearestChildX) / 2
          const parts: string[] = []
          let originX: number
          let originY: number
          if (parents.length === 1 && partner) {
            originX = (parents[0].x + partner.x) / 2
            originY = (parents[0].y + partner.y) / 2
            junction = { x: originX, y: originY }
          } else if (parents.length === 1) {
            originX = nearParentX
            originY = parents[0].y
          } else {
            const parentYs = parents.map((item) => item.y)
            const top = Math.min(...parentYs)
            const bottom = Math.max(...parentYs)
            originX = junctionX
            originY = (top + bottom) / 2
            junction = { x: originX, y: originY }
            parts.push(
              `M ${junctionX} ${top} V ${bottom}`,
              ...parents.map(
                (item) => `M ${parentEdge(item)} ${item.y} H ${junctionX}`
              )
            )
          }
          const childTurnX = (originX + nearestChildX) / 2
          const childYs = children.map((item) => item.y)
          parts.push(`M ${originX} ${originY} H ${childTurnX}`)
          if (children.length > 1 || childYs[0] !== originY)
            parts.push(
              `M ${childTurnX} ${Math.min(originY, ...childYs)} V ${Math.max(originY, ...childYs)}`
            )
          parts.push(
            ...children.map(
              (item) => `M ${childTurnX} ${item.y} H ${childEdge(item)}`
            )
          )
          path = parts.join(" ")
        }
        return [
          {
            id: unit.relationshipIds.join("-"),
            path,
            kind: "parent" as const,
            junction,
          },
        ]
      })
      setPaths([...parentEdges, ...otherEdges])
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(root)
    for (const node of nodes.current.values()) observer.observe(node)
    window.addEventListener("resize", update)
    return () => {
      observer.disconnect()
      window.removeEventListener("resize", update)
    }
  }, [container, direction, family.relationships, nodes, refreshKey])
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 size-full overflow-visible"
    >
      {paths.map((edge) => (
        <g key={edge.id}>
          <path
            d={edge.path}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={
              edge.kind === "former"
                ? "8 5"
                : edge.kind === "sibling"
                  ? "3 5"
                  : undefined
            }
            className={treeEdgeColor[edge.kind]}
          />
          {edge.junction && (
            <circle
              cx={edge.junction.x}
              cy={edge.junction.y}
              r={2.5}
              className={cn("fill-current", treeEdgeColor.parent)}
            />
          )}
        </g>
      ))}
    </svg>
  )
}

function TreeView({
  family,
  people,
  matchedIds,
  selectedId,
  settings,
  zoom,
  command,
  onZoomChange,
  choose,
}: {
  family: Family
  people: Person[]
  matchedIds?: Set<string>
  selectedId: string
  settings: Archive["settings"]
  zoom: keyof typeof zooms
  command?: TreeCommand
  onZoomChange: (zoom: keyof typeof zooms) => void
  choose: (id: string) => void
}) {
  const container = useRef<HTMLDivElement>(null)
  const nodes = useRef(new Map<string, HTMLButtonElement>())
  const scrollArea = useRef<HTMLDivElement>(null)
  const levels = generationMap(family)
  const maxDepth =
    settings.generations === "all" ? Infinity : Number(settings.generations)
  const rows = [...new Set(people.map((person) => levels.get(person.id) || 0))]
    .filter((level) => Math.abs(level) <= maxDepth)
    .sort((a, b) => a - b)
  if (settings.direction === "up" || settings.direction === "left")
    rows.reverse()
  useEffect(() => {
    if (!command) return
    const viewport = scrollArea.current
    if (!viewport) return
    const centerElement = (element: HTMLElement | null) => {
      if (!element) return
      const viewportRect = viewport.getBoundingClientRect()
      const elementRect = element.getBoundingClientRect()
      viewport.scrollTo({
        left:
          viewport.scrollLeft +
          elementRect.left -
          viewportRect.left -
          viewportRect.width / 2 +
          elementRect.width / 2,
        top:
          viewport.scrollTop +
          elementRect.top -
          viewportRect.top -
          viewportRect.height / 2 +
          elementRect.height / 2,
        behavior: "smooth",
      })
    }
    const centerPerson = () =>
      centerElement(nodes.current.get(command.personId || selectedId) || null)
    let frame = window.requestAnimationFrame(() => {
      if (command.type === "fit" && container.current) {
        const widthRatio =
          (viewport.clientWidth - 48) / container.current.offsetWidth
        const heightRatio =
          (viewport.clientHeight - 176) / container.current.offsetHeight
        const fit = Math.max(
          40,
          Math.min(140, Math.floor(Math.min(widthRatio, heightRatio) * 10) * 10)
        ) as keyof typeof zooms
        onZoomChange(fit)
        frame = window.requestAnimationFrame(() => {
          frame = window.requestAnimationFrame(() =>
            centerElement(container.current)
          )
        })
      } else centerPerson()
    })
    return () => window.cancelAnimationFrame(frame)
  }, [command, onZoomChange, selectedId])
  if (!people.length)
    return (
      <div className="grid h-full place-items-center p-8 text-center">
        <div>
          <h2 className="text-lg font-semibold">No people found</h2>
          <p className="text-sm text-muted-foreground">
            Clear the search or add a new person.
          </p>
        </div>
      </div>
    )
  const horizontal =
    settings.direction === "left" || settings.direction === "right"
  const visibleIds = new Set(people.map((person) => person.id))
  const visibleRelationships = family.relationships.filter(
    (relationship) =>
      visibleIds.has(relationship.from) && visibleIds.has(relationship.to)
  )
  return (
    <div className="relative h-[calc(100svh-4rem)] w-full print:h-auto">
      <div
        ref={scrollArea}
        tabIndex={0}
        aria-label="Scrollable family tree"
        className="size-full touch-auto overflow-auto overscroll-contain scroll-smooth focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none print:overflow-visible"
      >
        <div className="flex min-h-[calc(100svh-4rem)] min-w-max items-center justify-center px-6 pt-32 pb-24 sm:px-12 sm:pt-28 print:min-h-0 print:p-4">
          <div
            ref={container}
            className={cn(
              "relative flex origin-center items-center gap-12 transition-transform motion-reduce:transition-none sm:gap-14",
              horizontal ? "flex-row" : "flex-col",
              zooms[zoom],
              "print:scale-100"
            )}
          >
            <TreeRelationships
              family={family}
              container={container}
              nodes={nodes}
              refreshKey={`${settings.direction}-${zoom}-${people.map((person) => person.id).join("-")}`}
              direction={settings.direction}
            />
            {rows.map((level) => {
              const row = orderPeopleForTree(
                family,
                people.filter(
                  (person) => (levels.get(person.id) || 0) === level
                )
              )
              return (
                <div
                  key={level}
                  id={`tree-generation-${level}`}
                  className="relative z-10 flex shrink-0 flex-col items-center"
                >
                  <div
                    className={cn(
                      "flex items-center justify-center gap-4",
                      horizontal ? "flex-col" : "flex-row"
                    )}
                  >
                    {row.map((person) => (
                      <PersonNode
                        key={person.id}
                        person={person}
                        selected={person.id === selectedId}
                        matched={matchedIds?.has(person.id)}
                        dimmed={!!matchedIds && !matchedIds.has(person.id)}
                        showPhoto={settings.showPhotos}
                        onSelect={() => choose(person.id)}
                        nodeRef={(node) => {
                          if (node) nodes.current.set(person.id, node)
                          else nodes.current.delete(person.id)
                        }}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        <section className="sr-only" aria-label="Family relationships">
          <h2>Family relationships</h2>
          <ul>
            {visibleRelationships.map((relationship) => {
              const from = family.people.find(
                (person) => person.id === relationship.from
              )!
              const to = family.people.find(
                (person) => person.id === relationship.to
              )!
              const description = relationship.type.includes("parent")
                ? `${from.name} is a ${relationshipLabel(relationship.type).toLowerCase()} of ${to.name}.`
                : relationship.type === "child"
                  ? `${from.name} is a parent of ${to.name}.`
                  : `${from.name} and ${to.name} are ${relationshipLabel(relationship.type).toLowerCase()}.`
              return <li key={relationship.id}>{description}</li>
            })}
          </ul>
        </section>
      </div>
      <div className="pointer-events-none absolute top-24 right-4 z-20 rounded-md border bg-background/95 px-2 py-1 text-xs text-muted-foreground shadow-sm sm:hidden print:hidden">
        Drag to explore
      </div>
      <div className="absolute bottom-3 left-3 z-20 grid grid-cols-2 gap-x-3 gap-y-1 rounded-lg bg-background px-3 py-2 text-xs whitespace-nowrap text-muted-foreground sm:bottom-4 sm:left-4 sm:flex print:hidden">
        <span>
          <span
            className={cn(
              "mr-1.5 inline-block h-0.5 w-5 bg-current align-middle",
              treeEdgeColor.parent
            )}
          />
          Parent / child
        </span>
        <span>
          <span
            className={cn(
              "mr-1.5 inline-block h-0.5 w-5 bg-current align-middle",
              treeEdgeColor.partner
            )}
          />
          Partner
        </span>
        <span>
          <span
            className={cn(
              "mr-1.5 inline-block w-5 border-t-2 border-dashed border-current align-middle",
              treeEdgeColor.former
            )}
          />
          Former partner
        </span>
        <span>
          <span
            className={cn(
              "mr-1.5 inline-block w-5 border-t-2 border-dotted border-current align-middle",
              treeEdgeColor.sibling
            )}
          />
          Sibling
        </span>
      </div>
    </div>
  )
}

function PeopleView({
  family,
  people,
  query,
  settings,
  selectedId,
  onQueryChange,
  choose,
}: {
  family: Family
  people: Person[]
  query: string
  settings: Archive["settings"]
  selectedId: string
  onQueryChange: (value: string) => void
  choose: (id: string) => void
}) {
  const [sort, setSort] = useState<"name" | "birth" | "relation">("name"),
    [status, setStatus] = useState<"all" | "living" | "deceased">("all"),
    [connection, setConnection] = useState<"all" | "connected" | "unconnected">(
      "all"
    )
  const visible = [...people]
    .filter(
      (person) =>
        status === "all" ||
        (status === "living" ? person.living : !person.living)
    )
    .filter((person) => {
      if (connection === "all") return true
      const connected = isConnectedPerson(family, person.id)
      return connection === "connected" ? connected : !connected
    })
    .sort((a, b) =>
      sort === "birth"
        ? (a.birthDate || "9999").localeCompare(b.birthDate || "9999")
        : sort === "relation"
          ? a.relation.localeCompare(b.relation)
          : a.name.localeCompare(b.name)
    )
  return (
    <div className="h-[calc(100svh-4rem)] [scrollbar-width:none] overflow-auto [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-8">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">People</h1>
          <p className="text-sm text-muted-foreground">
            {family.people.length}{" "}
            {family.people.length === 1 ? "person" : "people"} in {family.name}.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-[minmax(12rem,1fr)_auto] md:items-end">
          <div className="relative">
            <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground">
              <Icon icon={Search01Icon} size={18} />
            </span>
            <Input
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              className="h-11 pl-10"
              placeholder="Search by name, relationship or place"
              aria-label="Search people"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-3 md:w-[22rem]">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Sort by</Label>
              <Select
                value={sort}
                onValueChange={(value) => setSort(value as typeof sort)}
              >
                <SelectTrigger className="w-full" aria-label="Sort people">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="birth">Birth date</SelectItem>
                  <SelectItem value="relation">Relationship</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Status</Label>
              <Select
                value={status}
                onValueChange={(value) => setStatus(value as typeof status)}
              >
                <SelectTrigger
                  className="w-full"
                  aria-label="Filter living status"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="living">Living</SelectItem>
                  <SelectItem value="deceased">Deceased</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Tree connection
              </Label>
              <Select
                value={connection}
                onValueChange={(value) =>
                  setConnection(value as typeof connection)
                }
              >
                <SelectTrigger
                  className="w-full"
                  aria-label="Filter tree connection"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All records</SelectItem>
                  <SelectItem value="connected">Connected</SelectItem>
                  <SelectItem value="unconnected">Unconnected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 border-b pb-3 text-sm">
          <span className="text-muted-foreground" role="status">
            Showing {visible.length} of {family.people.length}
          </span>
          {(query || status !== "all" || connection !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onQueryChange("")
                setStatus("all")
                setConnection("all")
              }}
            >
              Clear filters
            </Button>
          )}
        </div>
        {visible.length ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {visible.map((person) => (
              <Button
                key={person.id}
                variant="ghost"
                aria-current={selectedId === person.id ? "true" : undefined}
                className={cn(
                  "h-auto min-w-0 justify-start gap-3 rounded-xl border border-transparent p-3 text-left",
                  selectedId === person.id
                    ? "border-primary/25 bg-primary/5 ring-1 ring-primary/15"
                    : "bg-card hover:border-border hover:bg-card"
                )}
                onClick={() => choose(person.id)}
              >
                <Avatar className="size-11">
                  <AvatarImage src={settings.showPhotos ? person.photo : ""} />
                  <AvatarFallback>{initials(person.name)}</AvatarFallback>
                </Avatar>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate font-semibold">
                      {person.name}
                    </span>
                    {!person.living && (
                      <Badge variant="outline" className="shrink-0 text-[10px]">
                        Remembered
                      </Badge>
                    )}
                  </span>
                  <span className="block truncate text-sm text-muted-foreground">
                    {person.relation}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground tabular-nums">
                    {years(person)}
                  </span>
                  {!isConnectedPerson(family, person.id) && (
                    <span className="mt-1 block text-xs font-medium text-amber-700 dark:text-amber-300">
                      Not connected to the tree
                    </span>
                  )}
                </span>
              </Button>
            ))}
          </div>
        ) : (
          <section className="rounded-xl border border-dashed p-8 text-center">
            <h2 className="font-medium">No people found</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Clear the search or filters to see everyone in this family.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                onQueryChange("")
                setStatus("all")
                setConnection("all")
              }}
            >
              Clear filters
            </Button>
          </section>
        )}
      </div>
    </div>
  )
}

function TimelineView({
  family,
  events,
  selectedId,
  choose,
  viewInTree,
}: {
  family: Family
  events: FamilyEvent[]
  selectedId: string
  choose: (id: string) => void
  viewInTree: (id: string) => void
}) {
  const [kind, setKind] = useState<"all" | FamilyEvent["kind"]>("all"),
    [personId, setPersonId] = useState("all")
  const filtered = events.filter(
    (event) =>
      (kind === "all" || event.kind === kind) &&
      (personId === "all" || event.personId === personId)
  )
  const decades = [
    ...new Set(filtered.map((event) => `${event.date.slice(0, 3)}0s`)),
  ]
  const eventKindLabel = (event: FamilyEvent) =>
    event.kind === "birth"
      ? "Birth"
      : event.kind === "death"
        ? "In remembrance"
        : "Relationship"
  const eventDot = (event: FamilyEvent) =>
    event.kind === "birth"
      ? "bg-emerald-500"
      : event.kind === "death"
        ? "bg-muted-foreground"
        : "bg-rose-500"
  return (
    <div className="h-[calc(100svh-4rem)] [scrollbar-width:none] overflow-auto [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      <div className="mx-auto max-w-4xl space-y-7 p-4 sm:p-8">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Family timeline
          </h1>
          <p className="text-sm text-muted-foreground">
            Follow this family’s story from one life event to the next.
          </p>
        </div>
        <div className="space-y-3 border-b pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div
              className="flex gap-1 overflow-x-auto"
              role="group"
              aria-label="Filter timeline events"
            >
              {[
                ["all", "All events"],
                ["birth", "Births"],
                ["death", "Remembrances"],
                ["relationship", "Relationships"],
              ].map(([value, label]) => (
                <Button
                  key={value}
                  variant={kind === value ? "secondary" : "ghost"}
                  size="sm"
                  className="shrink-0"
                  aria-pressed={kind === value}
                  onClick={() => setKind(value as typeof kind)}
                >
                  {label}
                </Button>
              ))}
            </div>
            <div className="w-full sm:w-40">
              <Label className="sr-only">Person</Label>
              <Select value={personId} onValueChange={setPersonId}>
                <SelectTrigger className="w-full" aria-label="Filter person">
                  <SelectValue placeholder="Everyone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Everyone</SelectItem>
                  {family.people.map((person) => (
                    <SelectItem key={person.id} value={person.id}>
                      {person.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <span className="block text-sm text-muted-foreground" role="status">
            {filtered.length} {filtered.length === 1 ? "event" : "events"}
          </span>
        </div>
        {decades.length ? (
          <div className="relative space-y-8 before:absolute before:inset-y-0 before:left-[4.75rem] before:w-px before:bg-border sm:before:left-[6.25rem]">
            {decades.map((decade) => {
              const decadeEvents = filtered.filter(
                (event) => `${event.date.slice(0, 3)}0s` === decade
              )
              return (
                <section
                  key={decade}
                  className="grid grid-cols-[4rem_minmax(0,1fr)] gap-3 sm:grid-cols-[5rem_minmax(0,1fr)] sm:gap-5"
                  aria-labelledby={`timeline-${decade}`}
                >
                  <div>
                    <h2
                      id={`timeline-${decade}`}
                      className="text-lg font-semibold tabular-nums"
                    >
                      {decade}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      {decadeEvents.length}{" "}
                      {decadeEvents.length === 1 ? "event" : "events"}
                    </p>
                  </div>
                  <div className="relative space-y-2 pl-5">
                    {decadeEvents.map((event) => (
                      <article
                        key={event.id}
                        className={cn(
                          "relative rounded-xl",
                          event.personId === selectedId &&
                            "bg-primary/5 ring-1 ring-primary/20"
                        )}
                      >
                        <span
                          aria-hidden="true"
                          className={cn(
                            "absolute top-5 -left-[1.55rem] size-2.5 rounded-full ring-4 ring-background",
                            eventDot(event)
                          )}
                        />
                        <Button
                          variant="ghost"
                          className="h-auto w-full min-w-0 justify-start px-3 py-3 text-left"
                          onClick={() => choose(event.personId)}
                        >
                          <span className="min-w-0 flex-1">
                            <span className="block text-xs font-medium text-muted-foreground tabular-nums">
                              {formatPartialDate(event.date)} ·{" "}
                              {eventKindLabel(event)}
                            </span>
                            <span className="mt-0.5 block font-medium">
                              {event.label}
                            </span>
                            {event.location && (
                              <span className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                                <Icon icon={Location01Icon} size={13} />
                                <span className="truncate">
                                  {event.location}
                                </span>
                              </span>
                            )}
                          </span>
                        </Button>
                        {event.personId === selectedId && (
                          <Button
                            variant="ghost"
                            size="xs"
                            className="mb-2 ml-3"
                            onClick={() => viewInTree(event.personId)}
                          >
                            View in tree
                          </Button>
                        )}
                      </article>
                    ))}
                  </div>
                </section>
              )
            })}
          </div>
        ) : (
          <section className="rounded-xl border border-dashed p-8 text-center">
            <h2 className="font-medium">No matching events</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Change the filters or add dates to the family archive.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                setKind("all")
                setPersonId("all")
              }}
            >
              Clear filters
            </Button>
          </section>
        )}
      </div>
    </div>
  )
}

function CalendarView({
  family,
  selectedId,
  choose,
  viewInTree,
  onStatus,
}: {
  family: Family
  selectedId: string
  choose: (id: string) => void
  viewInTree: (id: string) => void
  onStatus: (status: string) => void
}) {
  const [filter, setFilter] = useState<"all" | "birth" | "relationship">("all")
  const peopleById = new Map(family.people.map((person) => [person.id, person]))
  const events = buildFamilyEvents(family).filter(
    (event) =>
      event.date.length >= 10 &&
      (event.kind === "birth" || event.relationshipType === "partner")
  )
  const currentMonth = new Date().getMonth()
  const today = new Date()
  const todayKey = `${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`
  const annual = [...events].sort((a, b) =>
    a.date.slice(5).localeCompare(b.date.slice(5))
  )
  const visibleEvents = annual.filter(
    (event) => filter === "all" || event.kind === filter
  )
  const upcoming =
    annual.find((event) => event.date.slice(5) >= todayKey) ?? annual.at(0)
  const upcomingDate = upcoming
    ? new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      }).format(
        new Date(
          Date.UTC(
            2000,
            Number(upcoming.date.slice(5, 7)) - 1,
            Number(upcoming.date.slice(8, 10) || 1)
          )
        )
      )
    : ""
  const eventTitle = (event: FamilyEvent) =>
    event.kind === "birth"
      ? (peopleById.get(event.personId)?.name ?? event.label)
      : event.label.replace(/: partner$/, "")
  const eventType = (event: FamilyEvent) =>
    event.kind === "relationship"
      ? "Anniversary"
      : peopleById.get(event.personId)?.living
        ? "Birthday"
        : "Birthday · in remembrance"
  const exportDates = () => {
    download(
      exportCalendar(family),
      exportFilename(family, "ics"),
      "text/calendar"
    )
    onStatus(`Downloaded ${exportFilename(family, "ics")}`)
  }
  return (
    <div className="h-[calc(100svh-4rem)] [scrollbar-width:none] overflow-auto [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      <div className="mx-auto max-w-4xl space-y-7 p-4 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">
              Family calendar
            </h1>
            <p className="text-sm text-muted-foreground">
              Birthdays and anniversaries, repeated every year.
            </p>
          </div>
          <Button variant="outline" onClick={exportDates}>
            <Icon icon={Download04Icon} />
            Export calendar
          </Button>
        </div>
        {upcoming ? (
          <section
            aria-labelledby="next-family-date"
            className="flex flex-col gap-4 rounded-xl bg-primary px-4 py-5 text-primary-foreground sm:flex-row sm:items-center sm:justify-between sm:px-5"
          >
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex size-14 shrink-0 flex-col items-center justify-center rounded-lg bg-primary-foreground/10 tabular-nums">
                <span className="text-lg leading-none font-semibold">
                  {upcoming.date.slice(8, 10) || "—"}
                </span>
                <span className="mt-1 text-[11px] font-medium tracking-wide text-primary-foreground/75 uppercase">
                  {new Date(
                    2024,
                    Number(upcoming.date.slice(5, 7)) - 1
                  ).toLocaleString(undefined, { month: "short" })}
                </span>
              </div>
              <div className="min-w-0">
                <p
                  id="next-family-date"
                  className="text-xs font-medium text-primary-foreground/75"
                >
                  Next family date · {upcomingDate}
                </p>
                <p className="truncate text-base font-semibold">
                  {eventTitle(upcoming)}
                </p>
                <p className="text-sm text-primary-foreground/75">
                  {eventType(upcoming)}
                </p>
              </div>
            </div>
            <Button
              variant="secondary"
              onClick={() => choose(upcoming.personId)}
            >
              View person
            </Button>
          </section>
        ) : (
          <section className="rounded-xl border border-dashed p-6 text-center">
            <h2 className="font-medium">No family dates yet</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Add complete birthdays or partner dates to see them here.
            </p>
          </section>
        )}
        {!!events.length && (
          <div
            className="flex gap-1 overflow-x-auto border-b pb-3"
            role="group"
            aria-label="Filter family dates"
          >
            {[
              ["all", "All dates"],
              ["birth", "Birthdays"],
              ["relationship", "Anniversaries"],
            ].map(([value, label]) => (
              <Button
                key={value}
                variant={filter === value ? "secondary" : "ghost"}
                size="sm"
                className="shrink-0"
                aria-pressed={filter === value}
                onClick={() => setFilter(value as typeof filter)}
              >
                {label}
              </Button>
            ))}
          </div>
        )}
        {visibleEvents.length ? (
          <div className="grid items-start gap-x-8 gap-y-7 md:grid-cols-2">
            {Array.from({ length: 12 }, (_, month) => {
              const items = visibleEvents.filter(
                (event) => Number(event.date.slice(5, 7)) === month + 1
              )
              if (!items.length) return null
              return (
                <section
                  key={month}
                  aria-labelledby={`family-month-${month}`}
                  className={cn(
                    "space-y-2",
                    month === currentMonth &&
                      "rounded-xl bg-primary/5 p-3 ring-1 ring-primary/15"
                  )}
                >
                  <div className="flex items-baseline justify-between gap-3 border-b pb-2">
                    <h2 id={`family-month-${month}`} className="font-semibold">
                      {new Date(2024, month).toLocaleString(undefined, {
                        month: "long",
                      })}
                    </h2>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {items.length} {items.length === 1 ? "date" : "dates"}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {items.map((event) => (
                      <div
                        key={event.id}
                        className={cn(
                          "group flex items-center gap-2 rounded-lg",
                          event.personId === selectedId &&
                            "bg-muted ring-1 ring-primary/30"
                        )}
                      >
                        <Button
                          variant="ghost"
                          className="h-auto min-w-0 flex-1 justify-start gap-3 px-2 py-2 text-left"
                          onClick={() => choose(event.personId)}
                        >
                          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-sm font-semibold tabular-nums">
                            {event.date.slice(8, 10) || "—"}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-medium">
                              {eventTitle(event)}
                            </span>
                            <span className="block text-xs text-muted-foreground">
                              {eventType(event)}
                            </span>
                          </span>
                        </Button>
                        {event.personId === selectedId && (
                          <Button
                            variant="ghost"
                            size="xs"
                            className="mr-1 shrink-0"
                            onClick={() => viewInTree(event.personId)}
                          >
                            Tree
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )
            })}
          </div>
        ) : events.length ? (
          <section className="rounded-xl border border-dashed p-6 text-center">
            <h2 className="font-medium">No dates in this category</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Choose another filter to see family dates.
            </p>
          </section>
        ) : null}
      </div>
    </div>
  )
}
