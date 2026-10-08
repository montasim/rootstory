import { z } from "zod"

const requiredText = (label: string, max: number) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required.`)
    .max(max, `${label} must be ${max} characters or fewer.`)

const optionalText = (label: string, max: number) =>
  z.string().trim().max(max, `${label} must be ${max} characters or fewer.`)

const isCalendarDate = (value: string) => {
  if (!value) return true
  const match = /^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/.exec(value)
  if (!match) return false
  const year = Number(match[1]),
    month = match[2] ? Number(match[2]) : 1,
    day = match[3] ? Number(match[3]) : 1
  if (month < 1 || month > 12) return false
  const date = new Date(Date.UTC(year, month - 1, day))
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  )
}

export const partialDateSchema = z
  .string()
  .trim()
  .refine(
    isCalendarDate,
    "Use a real date in YYYY, YYYY-MM or YYYY-MM-DD format."
  )

export const personInputSchema = z
  .object({
    name: requiredText("Full name", 120),
    relation: requiredText("Profile label", 60),
    gender: z.enum(["male", "female", "other", "unspecified"]),
    birthDate: partialDateSchema,
    birthQualifier: z.enum(["exact", "about", "before", "after"]),
    living: z.boolean(),
    deathDate: partialDateSchema,
    location: optionalText("Place", 160),
    work: optionalText("Profession", 120),
    email: z
      .string()
      .trim()
      .refine(
        (value) => !value || z.email().safeParse(value).success,
        "Enter a valid email address."
      ),
    phone: z
      .string()
      .trim()
      .refine(
        (value) => !value || /^[+]?[-\d\s().]{7,25}$/.test(value),
        "Enter a valid phone number."
      ),
    note: optionalText("Life story", 4000),
  })
  .superRefine((person, context) => {
    if (!person.living && !person.deathDate)
      context.addIssue({
        code: "custom",
        path: ["deathDate"],
        message: "Death date is required when the person is deceased.",
      })
  })

export const relationshipLocationSchema = optionalText(
  "Relationship place",
  160
)

export const relationshipTypeSchema = z.enum([
  "biological parent",
  "adopted parent",
  "foster parent",
  "surrogate parent",
  "godparent",
  "partner",
  "ex-partner",
  "sibling",
  "child",
])

export const relationshipInputSchema = z
  .object({
    mode: z.enum(["existing", "new"]),
    targetId: z.string(),
    name: optionalText("Full name", 120),
    gender: z.union([
      z.enum(["male", "female", "other", "unspecified"]),
      z.literal(""),
    ]),
    type: z.union([relationshipTypeSchema, z.literal("")]),
    date: partialDateSchema,
    location: relationshipLocationSchema,
  })
  .superRefine((relationship, context) => {
    if (!relationship.type)
      context.addIssue({
        code: "custom",
        path: ["type"],
        message: "Choose a relationship type.",
      })
    if (relationship.mode === "existing" && !relationship.targetId)
      context.addIssue({
        code: "custom",
        path: ["targetId"],
        message: "Choose an existing person.",
      })
    if (relationship.mode === "new") {
      if (!relationship.name)
        context.addIssue({
          code: "custom",
          path: ["name"],
          message: "Full name is required.",
        })
    }
  })

export const shareInputSchema = z.object({
  recipient: requiredText("Recipient or link label", 120),
  role: z.enum(["view", "edit"]),
  scope: z.enum(["whole family", "selected branch", "selected people"]),
  expires: z
    .string()
    .refine(
      (value) => !value || /^\d{4}-\d{2}-\d{2}$/.test(value),
      "Choose a valid expiry date."
    )
    .refine(
      (value) => !value || value >= new Date().toISOString().slice(0, 10),
      "Expiry cannot be in the past."
    ),
})

export const familyNameSchema = requiredText("Family name", 120)
export const searchSchema = optionalText("Search", 120)
export const settingsInputSchema = z.object({
  theme: z.enum(["light", "dark"]),
  direction: z.enum(["down", "up", "left", "right"]),
  showPhotos: z.boolean(),
  showContact: z.boolean(),
  generations: z.enum(["2", "3", "4", "5", "all"]),
})

export const photoFileSchema = z
  .custom<File>(
    (value) => typeof File !== "undefined" && value instanceof File,
    "Choose an image file."
  )
  .refine(
    (file) =>
      typeof File !== "undefined" &&
      file instanceof File &&
      file.size <= 2_000_000,
    "Choose an image smaller than 2 MB."
  )
  .refine(
    (file) =>
      typeof File !== "undefined" &&
      file instanceof File &&
      ["image/jpeg", "image/png", "image/gif", "image/webp"].includes(
        file.type
      ),
    "Choose a JPEG, PNG, GIF or WebP image."
  )

export const importFileSchema = z
  .custom<File>(
    (value) => typeof File !== "undefined" && value instanceof File,
    "Choose a Rootstory archive or GEDCOM file."
  )
  .refine(
    (file) =>
      typeof File !== "undefined" &&
      file instanceof File &&
      file.size <= 50_000_000,
    "Choose a file smaller than 50 MB."
  )
  .refine(
    (file) =>
      typeof File !== "undefined" &&
      file instanceof File &&
      /\.(json|ged)$/i.test(file.name),
    "Choose a .json Rootstory archive or .ged GEDCOM file."
  )

export function validationErrors(result: z.ZodSafeParseResult<unknown>) {
  const errors: Record<string, string> = {}
  if (result.success) return errors
  for (const issue of result.error.issues) {
    const field = String(issue.path[0] || "form")
    errors[field] ||= issue.message
  }
  return errors
}

export const validationMessage = (result: z.ZodSafeParseResult<unknown>) =>
  result.success ? "" : result.error.issues[0]?.message || "Invalid value."
