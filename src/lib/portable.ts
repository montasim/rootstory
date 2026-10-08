import type { Archive, Family, Person, Relationship } from "./family.ts"
import { buildFamilyEvents, parseArchive } from "./family.ts"

const escapeCsv = (value: string | boolean) =>
  `"${String(value).replaceAll('"', '""')}"`
const safeName = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "family"
const months = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
]
const relationshipTypes: Relationship["type"][] = [
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
const toGedcomDate = (date: string) => {
  const [year, month, day] = date.split("-")
  return [day && Number(day), month && months[Number(month) - 1], year]
    .filter(Boolean)
    .join(" ")
}
const fromGedcomDate = (value: string) => {
  const parts = value.replace(/^(ABT|BEF|AFT)\s+/, "").split(/\s+/)
  const year = parts.at(-1) || ""
  const month =
    parts.length > 1
      ? String(months.indexOf(parts.at(-2) || "") + 1).padStart(2, "0")
      : ""
  const day = parts.length > 2 ? String(Number(parts[0])).padStart(2, "0") : ""
  return [year, month, day].filter(Boolean).join("-")
}

export function download(
  content: string,
  filename: string,
  type = "text/plain"
) {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export const exportBackup = (archive: Archive) =>
  JSON.stringify(archive, null, 2)
export const importBackup = (text: string) =>
  parseArchive(JSON.parse(text) as unknown)

const escapeIcs = (value: string) =>
  value
    .replaceAll("\\", "\\\\")
    .replaceAll("\n", "\\n")
    .replaceAll(",", "\\,")
    .replaceAll(";", "\\;")

export function exportCalendar(family: Family) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Rootstory//Family dates//EN",
    "CALSCALE:GREGORIAN",
  ]
  for (const event of buildFamilyEvents(family).filter(
    (item) => item.kind === "birth" || item.relationshipType === "partner"
  )) {
    const [, month = "01", day = "01"] = event.date.split("-")
    lines.push(
      "BEGIN:VEVENT",
      `UID:${escapeIcs(`${event.id}@rootstory.local`)}`,
      `DTSTART;VALUE=DATE:2000${month}${day}`,
      "RRULE:FREQ=YEARLY",
      `SUMMARY:${escapeIcs(event.kind === "birth" ? event.label.replace(" was born", " — birthday") : event.label)}`,
      "END:VEVENT"
    )
  }
  lines.push("END:VCALENDAR")
  return `${lines.join("\r\n")}\r\n`
}

export function exportCsv(family: Family) {
  const fields: (keyof Person)[] = [
    "id",
    "name",
    "relation",
    "gender",
    "birthDate",
    "birthQualifier",
    "deathDate",
    "living",
    "location",
    "work",
    "email",
    "phone",
    "note",
  ]
  return [
    fields.map(escapeCsv).join(","),
    ...family.people.map((person) =>
      fields.map((field) => escapeCsv(person[field])).join(",")
    ),
  ].join("\n")
}

export function exportGedcom(family: Family) {
  const pointer = new Map(
    family.people.map((person, index) => [person.id, `@I${index + 1}@`])
  )
  const lines = [
    "0 HEAD",
    "1 SOUR ROOTSTORY",
    "1 GEDC",
    "2 VERS 5.5.1",
    "1 CHAR UTF-8",
  ]
  for (const person of family.people) {
    lines.push(
      `0 ${pointer.get(person.id)} INDI`,
      `1 NAME ${person.name.replace(/ (\S+)$/, " /$1/")}`
    )
    if (person.gender !== "unspecified")
      lines.push(
        `1 SEX ${person.gender === "male" ? "M" : person.gender === "female" ? "F" : "X"}`
      )
    if (person.birthDate)
      lines.push(
        "1 BIRT",
        `2 DATE ${person.birthQualifier === "exact" ? "" : `${person.birthQualifier === "about" ? "ABT" : person.birthQualifier === "before" ? "BEF" : "AFT"} `}${toGedcomDate(person.birthDate)}`
      )
    if (!person.living && person.deathDate)
      lines.push("1 DEAT", `2 DATE ${toGedcomDate(person.deathDate)}`)
    if (person.location !== "Not added")
      lines.push("1 RESI", `2 PLAC ${person.location}`)
    if (person.note) lines.push(`1 NOTE ${person.note.replaceAll("\n", " ")}`)
    for (const relationship of family.relationships.filter(
      (item) => item.from === person.id
    )) {
      lines.push(
        `1 ASSO ${pointer.get(relationship.to)}`,
        `2 RELA ${relationship.type}`
      )
      if (relationship.date)
        lines.push(`2 DATE ${toGedcomDate(relationship.date)}`)
      if (relationship.location)
        lines.push(`2 PLAC ${relationship.location.replaceAll("\n", " ")}`)
    }
  }
  const families = new Map<string, { parents: string[]; children: string[] }>()
  for (const relationship of family.relationships.filter((item) =>
    item.type.includes("parent")
  )) {
    const group = families.get(relationship.to) || {
      parents: [],
      children: [relationship.to],
    }
    group.parents.push(relationship.from)
    families.set(relationship.to, group)
  }
  for (const relationship of family.relationships.filter(
    (item) => item.type === "partner" || item.type === "ex-partner"
  )) {
    const key = [relationship.from, relationship.to].sort().join(":")
    families.set(key, {
      parents: [relationship.from, relationship.to],
      children: [],
    })
  }
  for (const [index, group] of [...families.values()].entries()) {
    lines.push(`0 @F${index + 1}@ FAM`)
    group.parents
      .slice(0, 2)
      .forEach((id, parentIndex) =>
        lines.push(`1 ${parentIndex ? "WIFE" : "HUSB"} ${pointer.get(id)}`)
      )
    group.children.forEach((id) => lines.push(`1 CHIL ${pointer.get(id)}`))
  }
  return `${lines.join("\n")}\n0 TRLR\n`
}

export function importGedcom(text: string): Family {
  const records = text.split(/\r?\n(?=0 )/)
  const people: Person[] = []
  const pointerToId = new Map<string, string>()
  const personRecords = new Map<string, string>()
  for (const record of records) {
    const header = record.match(/^0\s+(@[^@]+@)\s+INDI/m)
    if (!header) continue
    const id = `ged-${people.length + 1}`
    pointerToId.set(header[1], id)
    personRecords.set(header[1], record)
    const name = (
      record.match(/^1 NAME (.+)$/m)?.[1] || `Person ${people.length + 1}`
    )
      .replaceAll("/", "")
      .trim()
    const rawBirthDate = record.match(/^1 BIRT\r?\n2 DATE (.+)$/m)?.[1] || ""
    const rawDeathDate = record.match(/^1 DEAT\r?\n2 DATE (.+)$/m)?.[1] || ""
    const birthDate = fromGedcomDate(rawBirthDate)
    const deathDate = fromGedcomDate(rawDeathDate)
    const sex = record.match(/^1 SEX (.+)$/m)?.[1]
    people.push({
      id,
      name,
      relation: "Relative",
      gender: sex === "M" ? "male" : sex === "F" ? "female" : "unspecified",
      birthDate,
      birthQualifier: rawBirthDate.startsWith("ABT ")
        ? "about"
        : rawBirthDate.startsWith("BEF ")
          ? "before"
          : rawBirthDate.startsWith("AFT ")
            ? "after"
            : "exact",
      deathDate,
      living: !deathDate,
      location: record.match(/^2 PLAC (.+)$/m)?.[1] || "Not added",
      work: "Not added",
      email: "",
      phone: "",
      note: record.match(/^1 NOTE (.+)$/m)?.[1] || "",
      photo: "",
      tone: people.length % 2 ? "moss" : "indigo",
    })
  }
  if (!people.length)
    throw new Error("No individual records were found in this GEDCOM file.")
  const relationships: Relationship[] = []
  for (const [sourcePointer, record] of personRecords) {
    const source = pointerToId.get(sourcePointer)
    const matches = [
      ...record.matchAll(
        /^1 ASSO (.+)\r?\n2 RELA (.+)(?:\r?\n2 DATE (.+))?(?:\r?\n2 PLAC (.+))?$/gm
      ),
    ]
    for (const match of matches) {
      const target = pointerToId.get(match[1])
      const type = match[2] as Relationship["type"]
      if (source && target && relationshipTypes.includes(type))
        relationships.push({
          id: `ged-r${relationships.length + 1}`,
          from: source,
          to: target,
          type,
          date: match[3] ? fromGedcomDate(match[3]) : undefined,
          location: match[4] || undefined,
        })
    }
  }
  if (relationships.length)
    return {
      id: `import-${Date.now()}`,
      name: "Imported family",
      anchorId: people[0].id,
      people,
      relationships,
      shares: [],
    }
  for (const record of records) {
    if (!/^0\s+@[^@]+@\s+FAM/m.test(record)) continue
    const parents = [...record.matchAll(/^1 (?:HUSB|WIFE) (.+)$/gm)]
      .map((match) => pointerToId.get(match[1]))
      .filter((id): id is string => !!id)
    const children = [...record.matchAll(/^1 CHIL (.+)$/gm)]
      .map((match) => pointerToId.get(match[1]))
      .filter((id): id is string => !!id)
    for (const parent of parents)
      for (const child of children)
        relationships.push({
          id: `ged-r${relationships.length + 1}`,
          from: parent,
          to: child,
          type: "biological parent",
        })
    if (!children.length && parents.length === 2)
      relationships.push({
        id: `ged-r${relationships.length + 1}`,
        from: parents[0],
        to: parents[1],
        type: "partner",
      })
  }
  return {
    id: `import-${Date.now()}`,
    name: "Imported family",
    anchorId: people[0].id,
    people,
    relationships,
    shares: [],
  }
}

export function exportText(family: Family) {
  return family.people
    .map(
      (person) =>
        `${person.name} (${person.relation})\n${person.birthDate || "Date unknown"}${person.living ? "" : ` – ${person.deathDate}`}\n${person.note}`
    )
    .join("\n\n")
}

export function exportReadOnlyHtml(family: Family) {
  const escapeHtml = (value: string) =>
    value
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;")
  const people = family.people.filter((person) => !person.living)
  const includedIds = new Set(people.map((person) => person.id))
  const items = people
    .map(
      (person) =>
        `<article><h2>${escapeHtml(person.name)}</h2><p>${escapeHtml(person.relation)}</p><p>${escapeHtml(person.birthDate || "Date unknown")} — ${escapeHtml(person.deathDate || "Date unknown")}</p></article>`
    )
    .join("")
  const relationships = family.relationships
    .filter(
      (relationship) =>
        includedIds.has(relationship.from) && includedIds.has(relationship.to)
    )
    .map((relationship) => {
      const from = family.people.find(
        (person) => person.id === relationship.from
      )!
      const to = family.people.find((person) => person.id === relationship.to)!
      const description = relationship.type.includes("parent")
        ? `${from.name} is ${to.name}'s ${relationship.type}.`
        : relationship.type === "child"
          ? `${from.name} is a parent of ${to.name}.`
          : `${from.name} and ${to.name} are connected as ${relationship.type}.`
      return `<li>${escapeHtml(description)}</li>`
    })
    .join("")
  const name = escapeHtml(family.name)
  return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${name}</title><style>:root{color-scheme:light dark;font:16px/1.5 system-ui,sans-serif}body{margin:0;background:#f5f7fb;color:#172033}main{max-width:54rem;margin:auto;padding:3rem 1.25rem}header{border-bottom:1px solid #ccd3df;padding-bottom:1.5rem}h1{margin:0 0 .5rem;font-size:clamp(2rem,6vw,3.5rem)}.people{display:grid;grid-template-columns:repeat(auto-fit,minmax(13rem,1fr));gap:1rem;margin:2rem 0}article{border:1px solid #d7dce5;border-radius:.75rem;background:white;padding:1rem}article h2{margin:0;font-size:1.1rem}article p{margin:.25rem 0 0;color:#536076}.empty{border:1px dashed #aab3c2;border-radius:.75rem;padding:1rem}@media(prefers-color-scheme:dark){body{background:#101722;color:#eef2f8}article{background:#182231;border-color:#344055}article p{color:#b9c3d2}}</style><body><main><header><h1>${name}</h1><p>Private read-only copy. Living people, contact details, photos, locations and notes are excluded.</p></header>${items ? `<section aria-labelledby="people"><h2 id="people">People remembered</h2><div class="people">${items}</div></section>` : '<p class="empty">This privacy-safe copy contains no deceased people to show.</p>'}${relationships ? `<section aria-labelledby="relationships"><h2 id="relationships">Family connections</h2><ul>${relationships}</ul></section>` : ""}</main></body></html>`
}

export const exportFilename = (family: Family, extension: string) =>
  `${safeName(family.name)}.${extension}`

export async function checksum(content: string) {
  const data = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(content)
  )
  return [...new Uint8Array(data)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
}
