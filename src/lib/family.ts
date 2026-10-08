export type RelationshipType =
  | "biological parent"
  | "adopted parent"
  | "foster parent"
  | "surrogate parent"
  | "godparent"
  | "partner"
  | "ex-partner"
  | "sibling"
  | "child"

export type Person = {
  id: string
  name: string
  relation: string
  gender: "female" | "male" | "other" | "unspecified"
  birthDate: string
  birthQualifier: "exact" | "about" | "before" | "after"
  deathDate: string
  living: boolean
  location: string
  work: string
  email: string
  phone: string
  note: string
  photo: string
  tone: "indigo" | "rose" | "moss" | "amber"
}

export type Relationship = {
  id: string
  from: string
  to: string
  type: RelationshipType
  date?: string
  location?: string
}
export type ShareGrant = {
  id: string
  recipient: string
  role: "view" | "edit"
  scope: "whole family" | "selected branch" | "selected people"
  includeLiving: boolean
  includeContact: boolean
  allowDownload: boolean
  allowReshare: boolean
  expires: string
  revoked: boolean
}
export type Family = {
  id: string
  name: string
  anchorId: string
  people: Person[]
  relationships: Relationship[]
  shares: ShareGrant[]
}
export type ArchiveSettings = {
  theme: "light" | "dark"
  direction: "down" | "up" | "left" | "right"
  showPhotos: boolean
  showContact: boolean
  generations: string
}
export type Archive = {
  version: 1
  activeFamilyId: string
  families: Family[]
  settings: ArchiveSettings
  updatedAt: string
}

export type FamilyEvent = {
  id: string
  date: string
  kind: "birth" | "death" | "relationship"
  label: string
  personId: string
  relationshipType?: RelationshipType
  location?: string
}

const person = (
  id: string,
  name: string,
  relation: string,
  birthDate: string,
  tone: Person["tone"],
  extra: Partial<Person> = {}
): Person => ({
  id,
  name,
  relation,
  birthDate,
  tone,
  gender: "unspecified",
  birthQualifier: "exact",
  deathDate: "",
  living: true,
  location: "Not added",
  work: "Not added",
  email: "",
  phone: "",
  note: "No story has been added yet.",
  photo: "",
  ...extra,
})

export const demoArchive: Archive = {
  version: 1,
  activeFamilyId: "moreno",
  updatedAt: "2026-10-08T00:00:00.000Z",
  settings: {
    theme: "light",
    direction: "down",
    showPhotos: true,
    showContact: false,
    generations: "4",
  },
  families: [
    {
      id: "moreno",
      name: "The Moreno archive",
      anchorId: "ada",
      shares: [],
      people: [
        person("ada", "Ada Moreno", "You", "1988-04-12", "indigo", {
          gender: "female",
          location: "Lisbon, Portugal",
          work: "Architect",
          email: "ada@example.test",
          note: "Collects family recipes and is mapping the Moreno branch.",
        }),
        person("tomas", "Tomás Moreno", "Father", "1959-02-02", "moss", {
          gender: "male",
          location: "Porto, Portugal",
          work: "Retired teacher",
          note: "Keeps the oldest letters and school photographs in the archive.",
        }),
        person("maya", "Maya Moreno", "Mother", "1962-08-19", "rose", {
          gender: "female",
          location: "Porto, Portugal",
          work: "Ceramic artist",
          note: "Recorded the oral history for three generations of the family.",
        }),
        person("elias", "Elias Moreno", "Grandfather", "1929-06-03", "amber", {
          gender: "male",
          living: false,
          deathDate: "2014-11-20",
          location: "Braga, Portugal",
          work: "Carpenter",
          note: "Built the long dining table still used at family gatherings.",
        }),
        person("ines", "Inês Rocha", "Grandmother", "1934-09-14", "rose", {
          gender: "female",
          living: false,
          deathDate: "2019-01-08",
          location: "Braga, Portugal",
          work: "Tailor",
          note: "Her notebooks contain measurements, poems, and pressed flowers.",
        }),
        person("leo", "Leo Moreno", "Brother", "1991-12-27", "moss", {
          gender: "male",
          location: "Madrid, Spain",
          work: "Sound designer",
          note: "Digitizing cassette recordings from family celebrations.",
        }),
        person("noa", "Noa Silva", "Partner", "1989-05-06", "amber", {
          location: "Lisbon, Portugal",
          work: "Editor",
          note: "Helps preserve context around photographs and letters.",
        }),
        person("june", "June Moreno", "Daughter", "2018-10-10", "indigo", {
          gender: "female",
          location: "Lisbon, Portugal",
          work: "Student",
          note: "The youngest storyteller in this branch.",
        }),
      ],
      relationships: [
        { id: "r1", from: "tomas", to: "ada", type: "biological parent" },
        { id: "r2", from: "maya", to: "ada", type: "biological parent" },
        { id: "r3", from: "elias", to: "tomas", type: "biological parent" },
        { id: "r4", from: "ines", to: "tomas", type: "biological parent" },
        { id: "r5", from: "ada", to: "leo", type: "sibling" },
        {
          id: "r6",
          from: "ada",
          to: "noa",
          type: "partner",
          date: "2015-06-20",
          location: "Lisbon, Portugal",
        },
        { id: "r7", from: "ada", to: "june", type: "biological parent" },
      ],
    },
  ],
}

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
export const years = (item: Person) =>
  `${item.birthDate.slice(0, 4) || "?"} — ${item.living ? "present" : item.deathDate.slice(0, 4) || "?"}`

export function formatPartialDate(value: string, locale?: string) {
  if (!value) return "Unknown"
  const [year, month, day] = value.split("-").map(Number)
  if (!month) return String(year)
  const date = new Date(Date.UTC(year, month - 1, day || 1))
  return new Intl.DateTimeFormat(locale, {
    timeZone: "UTC",
    year: "numeric",
    month: "short",
    ...(day ? { day: "numeric" as const } : {}),
  }).format(date)
}

export const isConnectedPerson = (family: Family, personId: string) =>
  personId === family.anchorId ||
  family.relationships.some(
    (relationship) =>
      relationship.from === personId || relationship.to === personId
  )

export function searchPeople(family: Family, query: string) {
  const normalized = query.trim().toLocaleLowerCase()
  if (!normalized) return family.people
  return family.people
    .map((member) => {
      const fields = [
        member.name,
        member.relation,
        member.location,
        member.work,
        member.note,
      ].map((value) => value.toLocaleLowerCase())
      const score = fields.reduce((total, value, index) => {
        if (value === normalized) return total + 100 - index
        if (value.startsWith(normalized)) return total + 50 - index
        if (value.includes(normalized)) return total + 10 - index
        return total
      }, 0)
      return { person: member, score }
    })
    .filter((result) => result.score > 0)
    .sort(
      (a, b) => b.score - a.score || a.person.name.localeCompare(b.person.name)
    )
    .map((result) => result.person)
}

export function buildFamilyEvents(family: Family): FamilyEvent[] {
  return [
    ...family.people.flatMap((member) => [
      ...(member.birthDate
        ? [
            {
              id: `${member.id}-birth`,
              date: member.birthDate,
              kind: "birth" as const,
              label: `${member.name} was born`,
              personId: member.id,
            },
          ]
        : []),
      ...(!member.living && member.deathDate
        ? [
            {
              id: `${member.id}-death`,
              date: member.deathDate,
              kind: "death" as const,
              label: `${member.name} died`,
              personId: member.id,
            },
          ]
        : []),
    ]),
    ...family.relationships.flatMap((relationship) => {
      if (!relationship.date) return []
      const from = family.people.find(
        (member) => member.id === relationship.from
      )
      const to = family.people.find((member) => member.id === relationship.to)
      return from && to
        ? [
            {
              id: `${relationship.id}-relationship`,
              date: relationship.date,
              kind: "relationship" as const,
              label: `${from.name} and ${to.name}: ${relationship.type}`,
              personId: from.id,
              relationshipType: relationship.type,
              location: relationship.location,
            },
          ]
        : []
    }),
  ].sort((a, b) => a.date.localeCompare(b.date))
}
export const cloneArchive = (archive: Archive): Archive =>
  structuredClone(archive)

const isString = (value: unknown): value is string => typeof value === "string"
const relationshipTypes: RelationshipType[] = [
  "biological parent",
  "adopted parent",
  "foster parent",
  "surrogate parent",
  "godparent",
  "partner",
  "ex-partner",
  "sibling",
  "child",
]
const generationDepths = ["2", "3", "4", "5", "all"]
const personKeys: (keyof Person)[] = [
  "id",
  "name",
  "relation",
  "gender",
  "birthDate",
  "birthQualifier",
  "deathDate",
  "location",
  "work",
  "email",
  "phone",
  "note",
  "photo",
  "tone",
]

function validPerson(value: unknown): value is Person {
  if (!value || typeof value !== "object") return false
  const item = value as Partial<Person>
  return (
    personKeys.every((key) => isString(item[key])) &&
    typeof item.living === "boolean"
  )
}

export function parseArchive(value: unknown): Archive {
  if (!value || typeof value !== "object")
    throw new Error("This file is not a Rootstory archive.")
  const candidate = value as Partial<Archive>
  if (
    candidate.version !== 1 ||
    !Array.isArray(candidate.families) ||
    !candidate.families.length
  )
    throw new Error("Unsupported or empty Rootstory archive.")
  if (
    !candidate.settings ||
    !["light", "dark"].includes(candidate.settings.theme) ||
    !["down", "up", "left", "right"].includes(candidate.settings.direction) ||
    typeof candidate.settings.showPhotos !== "boolean" ||
    typeof candidate.settings.showContact !== "boolean" ||
    !generationDepths.includes(candidate.settings.generations)
  )
    throw new Error("The archive contains invalid display settings.")
  const familyIds = new Set<string>()
  for (const family of candidate.families) {
    if (
      !family.id ||
      !family.name ||
      familyIds.has(family.id) ||
      !family.anchorId ||
      !Array.isArray(family.people) ||
      !family.people.length ||
      !Array.isArray(family.relationships) ||
      !Array.isArray(family.shares)
    )
      throw new Error("The archive contains an invalid family record.")
    familyIds.add(family.id)
    if (!family.people.every(validPerson))
      throw new Error("The archive contains an invalid person record.")
    if (
      new Set(family.people.map((item) => item.id)).size !==
      family.people.length
    )
      throw new Error("The archive contains duplicate person IDs.")
    const personIds = new Set(family.people.map((item) => item.id))
    if (!personIds.has(family.anchorId))
      throw new Error("A family anchor points to a missing person.")
    const relationshipIds = new Set<string>()
    if (
      family.relationships.some((item) => {
        const invalid =
          !item.id ||
          relationshipIds.has(item.id) ||
          !relationshipTypes.includes(item.type) ||
          !personIds.has(item.from) ||
          !personIds.has(item.to) ||
          item.from === item.to ||
          (item.date !== undefined && !isString(item.date)) ||
          (item.location !== undefined && !isString(item.location))
        relationshipIds.add(item.id)
        return invalid
      })
    )
      throw new Error("A relationship points to a missing person.")
    if (
      family.shares.some(
        (share) =>
          !share.id ||
          !isString(share.recipient) ||
          !["view", "edit"].includes(share.role) ||
          !["whole family", "selected branch", "selected people"].includes(
            share.scope
          ) ||
          !isString(share.expires) ||
          [
            share.includeLiving,
            share.includeContact,
            share.allowDownload,
            share.allowReshare,
            share.revoked,
          ].some((setting) => typeof setting !== "boolean")
      )
    )
      throw new Error("The archive contains an invalid sharing record.")
  }
  if (!candidate.activeFamilyId || !familyIds.has(candidate.activeFamilyId))
    throw new Error("The active family is missing.")
  if (
    !isString(candidate.updatedAt) ||
    Number.isNaN(Date.parse(candidate.updatedAt))
  )
    throw new Error("The archive has no valid update time.")
  return candidate as Archive
}

export function relationshipEnds(
  selectedId: string,
  targetId: string,
  type: RelationshipType
) {
  if (type.includes("parent")) return { from: targetId, to: selectedId }
  return { from: selectedId, to: targetId }
}

export function generationMap(family: Family) {
  const levels = new Map<string, number>([[family.anchorId, 0]])
  let passes = family.people.length
  while (passes > 0) {
    passes -= 1
    for (const relation of family.relationships) {
      const from = levels.get(relation.from),
        to = levels.get(relation.to)
      const parent = relation.type.includes("parent")
      const child = relation.type === "child"
      if (parent && to !== undefined && from === undefined)
        levels.set(relation.from, to - 1)
      if (parent && from !== undefined && to === undefined)
        levels.set(relation.to, from + 1)
      if (child && from !== undefined && to === undefined)
        levels.set(relation.to, from + 1)
      if (child && to !== undefined && from === undefined)
        levels.set(relation.from, to - 1)
      if (!parent && !child && from !== undefined && to === undefined)
        levels.set(relation.to, from)
      if (!parent && !child && to !== undefined && from === undefined)
        levels.set(relation.from, to)
    }
  }
  for (const item of family.people)
    if (!levels.has(item.id)) levels.set(item.id, 0)
  return levels
}

export function descendantIds(family: Family, personId: string) {
  const descendants = new Set<string>()
  const queue = [personId]
  while (queue.length) {
    const parentId = queue.shift()!
    for (const relationship of family.relationships) {
      if (
        relationship.from === parentId &&
        (relationship.type.includes("parent") ||
          relationship.type === "child") &&
        !descendants.has(relationship.to)
      ) {
        descendants.add(relationship.to)
        queue.push(relationship.to)
      }
    }
  }
  return descendants
}

export function treeParentGroups(family: Family) {
  const groups = new Map<
    string,
    { parentIds: string[]; partnerId?: string; relationshipIds: string[] }
  >()
  for (const relationship of family.relationships) {
    if (!relationship.type.includes("parent") && relationship.type !== "child")
      continue
    const group = groups.get(relationship.to) || {
      parentIds: [],
      relationshipIds: [],
    }
    if (!group.parentIds.includes(relationship.from))
      group.parentIds.push(relationship.from)
    group.relationshipIds.push(relationship.id)
    groups.set(relationship.to, group)
  }
  let passes = family.people.length
  while (passes > 0) {
    passes -= 1
    for (const relationship of family.relationships) {
      if (relationship.type !== "sibling") continue
      const from = groups.get(relationship.from)
      const to = groups.get(relationship.to)
      if (from && !to)
        groups.set(relationship.to, {
          parentIds: [...from.parentIds],
          relationshipIds: [relationship.id],
        })
      else if (to && !from)
        groups.set(relationship.from, {
          parentIds: [...to.parentIds],
          relationshipIds: [relationship.id],
        })
    }
  }
  for (const group of groups.values()) {
    if (group.parentIds.length !== 1) continue
    const parentId = group.parentIds[0]
    const partners = family.relationships.flatMap((relationship) => {
      if (relationship.type !== "partner") return []
      if (relationship.from === parentId) return [relationship.to]
      if (relationship.to === parentId) return [relationship.from]
      return []
    })
    if (partners.length === 1) group.partnerId = partners[0]
  }
  return groups
}

export function treeParentUnits(family: Family) {
  const units = new Map<
    string,
    {
      parentIds: string[]
      partnerId?: string
      childIds: string[]
      relationshipIds: string[]
    }
  >()
  for (const [childId, group] of treeParentGroups(family)) {
    const key = `${[...group.parentIds].sort().join("|")}::${group.partnerId || ""}`
    const unit = units.get(key) || {
      parentIds: group.parentIds,
      ...(group.partnerId ? { partnerId: group.partnerId } : {}),
      childIds: [],
      relationshipIds: [],
    }
    unit.childIds.push(childId)
    for (const id of group.relationshipIds)
      if (!unit.relationshipIds.includes(id)) unit.relationshipIds.push(id)
    units.set(key, unit)
  }
  return [...units.values()]
}

export function orderPeopleForTree(family: Family, people: Person[]) {
  const visible = new Map(people.map((member) => [member.id, member]))
  const ordered: Person[] = []
  const added = new Set<string>()
  for (const member of people) {
    if (added.has(member.id)) continue
    ordered.push(member)
    added.add(member.id)
    for (const relationship of family.relationships) {
      if (relationship.type !== "partner" && relationship.type !== "ex-partner")
        continue
      const partnerId =
        relationship.from === member.id
          ? relationship.to
          : relationship.to === member.id
            ? relationship.from
            : ""
      const partner = visible.get(partnerId)
      if (partner && !added.has(partner.id)) {
        ordered.push(partner)
        added.add(partner.id)
      }
    }
  }
  return ordered
}
