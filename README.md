# Rootstory

Rootstory is a private, local-first family archive for mapping relationships,
preserving life details and photographs, and keeping a portable copy of family
history. It runs in the browser without an account and does not automatically
upload archive data.

[Open Rootstory](https://rootstory-240.netlify.app) · [View source](https://github.com/montasim/rootstory)

## What Rootstory does

- Builds a visual family tree with parent, child, partner, former-partner, and
  sibling connections.
- Keeps profiles, partial dates, places, work, notes, contact details, and local
  portraits together.
- Provides searchable People, Family timeline, and Calendar views.
- Keeps up to 20 recent archive versions in the browser for recovery.
- Imports complete Rootstory archives and GEDCOM family data.
- Exports complete backups, GEDCOM, CSV, text, privacy-safe HTML, printable PDF,
  and recurring iCalendar dates.
- Supports light and dark themes, configurable generation depth, and optional
  on-screen hiding of photos and contact details.

## Privacy and data storage

Rootstory stores the active archive and version history in the browser's
IndexedDB database. Older local-storage archives are migrated when found.

This local-first model has practical consequences:

- Clearing browser site data can delete the working archive.
- Data is not synchronized between browsers or devices automatically.
- A complete `.rootstory.json` backup is the restorable transfer format. It
  includes families, people, relationships, photographs, private fields,
  sharing records, and display settings.
- GEDCOM and CSV are interoperability exports and intentionally omit some
  Rootstory-specific data.
- The read-only HTML export excludes living people, contact details, photos,
  locations, and notes.

Use **Share & transfer → Download complete archive** regularly if the archive
matters. Keep exported backups somewhere protected; they can contain private
family information.

## Run locally

### Prerequisites

- Node.js 22.12 or newer
- pnpm 11.7.0

### Install and start

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open `http://localhost:3000`. The landing page should load, and **Open the
archive** should open the family workspace at `/app`.

The workspace starts with an editable demonstration family so the tree,
profiles, timeline, calendar, import/export, and settings workflows can be
explored immediately.

## Primary workflows

### Build a family tree

1. Open `/app`.
2. Select an existing person or choose **Add person**.
3. Use **Add relative** to connect a parent, child, sibling, partner, or former
   partner.
4. Select a person to edit profile details, life events, contact information,
   and a portrait.

The Tree view supports zooming, fitting, centering, generation navigation, and
branch collapsing. Relationship lines use separate visual styles for each
connection type.

### Review the archive

- **People** searches and filters every profile.
- **Timeline** groups births, remembrances, and relationship events by decade.
- **Calendar** shows recurring birthdays and anniversaries and can export an
  `.ics` calendar.
- **Print / PDF** opens the browser print workflow for a printable copy.

### Move or restore data

Open **Share & transfer** to:

- download a complete, restorable Rootstory archive;
- restore a complete archive after reviewing its contents;
- import a GEDCOM family without replacing the current archive;
- export GEDCOM, CSV, plain text, or privacy-safe HTML;
- verify the most recent complete backup with its SHA-256 digest.

## Development commands

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Start the development server on port 3000 |
| `pnpm build` | Build the client and server production bundles |
| `pnpm preview` | Preview the production build locally |
| `pnpm check` | Verify Prettier formatting |
| `pnpm lint` | Run ESLint |
| `pnpm typecheck` | Run TypeScript without emitting files |
| `pnpm test` | Run the Node test suite |
| `pnpm generate-routes` | Regenerate the TanStack Router route tree |

## Architecture

Rootstory is a TanStack Start application using React, TypeScript, Tailwind CSS,
Radix UI primitives, shadcn/ui conventions, Hugeicons, and Zod validation.

The main boundaries are:

- `src/routes/` — landing page, application route, and document shell.
- `src/components/rootstory-app.tsx` — application workflows and responsive UI.
- `src/lib/family.ts` — archive model, relationship graph, events, and tree
  ordering.
- `src/lib/storage.ts` — IndexedDB persistence and version history.
- `src/lib/portable.ts` — backup, genealogy, spreadsheet, calendar, text, and
  HTML import/export.
- `src/lib/validation.ts` — validation at user-input and import boundaries.

The automated suite covers search, partial dates, relationship direction,
family-tree ordering, version retention, complete backup restoration, malformed
imports, GEDCOM round-trips, privacy-safe HTML, calendar recurrence, and input
validation.

## Deploy to Netlify

The repository is configured for TanStack Start's Netlify SSR adapter.

```sh
pnpm build
```

The verified build contract is:

- Build command: `vite build`
- Publish directory: `dist/client`
- Runtime: SSR through the generated Netlify function
- Server entry: `.netlify/v1/functions/server.mjs`

`netlify.toml` records the build and development settings. No environment
variables are required by the current application.

## Project status and limitations

- Rootstory is currently a browser-local application, not a hosted sync service.
- Anyone with access to the browser profile or an exported complete archive may
  be able to read its private data.
- GEDCOM interoperability is limited to the records supported by the importer
  and exporter; Rootstory-specific fields and photos are not preserved there.
- The included family is demonstration data and is not intended as a real
  archive.

## License

Rootstory is available under the [MIT License](LICENSE).
