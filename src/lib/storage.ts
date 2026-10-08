import type { Archive } from "./family.ts"
import { demoArchive, parseArchive } from "./family.ts"

export type ArchiveVersion = {
  id: string
  label: string
  date: string
  archive: Archive
}

const DATABASE = "rootstory"
const STORE = "workspace"
const ARCHIVE_KEY = "archive"
const HISTORY_KEY = "history"
const LEGACY_KEYS = ["rootstory-archive-v1", "kinship-archive-v1"]
const LEGACY_DEMO_NAMES: Record<string, string> = {
  ada: "Ada Moreno",
  tomas: "Tomás Moreno",
  maya: "Maya Moreno",
  elias: "Elias Moreno",
  ines: "Inês Rocha",
  leo: "Leo Moreno",
  noa: "Noa Silva",
  june: "June Moreno",
}
const LEGACY_DEMO_PLACES: Record<string, string> = {
  ada: "Lisbon, Portugal",
  tomas: "Porto, Portugal",
  maya: "Porto, Portugal",
  elias: "Braga, Portugal",
  ines: "Braga, Portugal",
  leo: "Madrid, Spain",
  noa: "Lisbon, Portugal",
  june: "Lisbon, Portugal",
}

export const trimHistory = (versions: ArchiveVersion[], limit = 20) =>
  versions.slice(0, limit)

export function pushHistory(
  versions: ArchiveVersion[],
  version: ArchiveVersion
) {
  if (!versions.length) return [version]
  const latest = versions[0]
  if (
    latest.label.startsWith("Display:") &&
    version.label.startsWith("Display:") &&
    Date.parse(version.date) - Date.parse(latest.date) < 2_000
  )
    return trimHistory([
      { ...version, archive: latest.archive },
      ...versions.slice(1),
    ])
  return trimHistory([version, ...versions])
}

export function relativeTime(date: string, now = Date.now()) {
  const seconds = Math.round((Date.parse(date) - now) / 1_000)
  const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" })
  if (Math.abs(seconds) < 60) return formatter.format(seconds, "second")
  const minutes = Math.round(seconds / 60)
  if (Math.abs(minutes) < 60) return formatter.format(minutes, "minute")
  const hours = Math.round(minutes / 60)
  if (Math.abs(hours) < 24) return formatter.format(hours, "hour")
  return formatter.format(Math.round(hours / 24), "day")
}

export function migrateLegacyDemoArchive(archive: Archive) {
  const family = archive.families[0]
  if (
    archive.families.length !== 1 ||
    family.id !== "moreno" ||
    family.name !== "The Moreno archive" ||
    family.people.length !== Object.keys(LEGACY_DEMO_NAMES).length ||
    !family.people.every(
      (person) => LEGACY_DEMO_NAMES[person.id] === person.name
    )
  )
    return archive

  const replacements = new Map(
    demoArchive.families[0].people.map((person) => [person.id, person])
  )
  return {
    ...archive,
    families: [
      {
        ...family,
        name: demoArchive.families[0].name,
        people: family.people.map((person) => {
          const replacement = replacements.get(person.id)!
          return {
            ...person,
            name: replacement.name,
            location:
              person.location === LEGACY_DEMO_PLACES[person.id]
                ? replacement.location
                : person.location,
            email:
              person.email === "ada@example.test"
                ? replacement.email
                : person.email,
            note: person.note.replaceAll("Moreno", "Rahman"),
          }
        }),
        relationships: family.relationships.map((relationship) => ({
          ...relationship,
          location:
            relationship.location === "Lisbon, Portugal"
              ? "Dhaka, Bangladesh"
              : relationship.location,
        })),
      },
    ],
  }
}

function database() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 1)
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE))
        request.result.createObjectStore(STORE)
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function read<T>(key: string) {
  const db = await database()
  return new Promise<T | undefined>((resolve, reject) => {
    const transaction = db.transaction(STORE, "readonly")
    const request = transaction.objectStore(STORE).get(key)
    request.onsuccess = () => resolve(request.result as T | undefined)
    request.onerror = () => reject(request.error)
    transaction.oncomplete = () => db.close()
  })
}

async function write(key: string, value: unknown) {
  const db = await database()
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE, "readwrite")
    transaction.objectStore(STORE).put(value, key)
    transaction.oncomplete = () => {
      db.close()
      resolve()
    }
    transaction.onerror = () => reject(transaction.error)
  })
}

export async function loadWorkspace() {
  const stored = await read<Archive>(ARCHIVE_KEY)
  if (stored)
    return {
      archive: migrateLegacyDemoArchive(parseArchive(stored)),
      history: trimHistory((await read<ArchiveVersion[]>(HISTORY_KEY)) || []),
    }

  for (const key of LEGACY_KEYS) {
    const legacy = localStorage.getItem(key)
    if (!legacy) continue
    const archive = migrateLegacyDemoArchive(
      parseArchive(JSON.parse(legacy) as unknown)
    )
    await write(ARCHIVE_KEY, archive)
    localStorage.removeItem(key)
    return { archive, history: [] }
  }
  return null
}

export async function saveWorkspace(
  archive: Archive,
  history: ArchiveVersion[]
) {
  await Promise.all([
    write(ARCHIVE_KEY, archive),
    write(HISTORY_KEY, trimHistory(history)),
  ])
}
