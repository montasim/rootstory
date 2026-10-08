import type { Archive } from "./family.ts"
import { parseArchive } from "./family.ts"

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

export const trimHistory = (versions: ArchiveVersion[], limit = 20) =>
  versions.slice(0, limit)

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
      archive: parseArchive(stored),
      history: trimHistory((await read<ArchiveVersion[]>(HISTORY_KEY)) || []),
    }

  for (const key of LEGACY_KEYS) {
    const legacy = localStorage.getItem(key)
    if (!legacy) continue
    const archive = parseArchive(JSON.parse(legacy) as unknown)
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
