import assert from "node:assert/strict"
import test from "node:test"

import { demoArchive, generationMap, relationshipEnds } from "./family.ts"
import {
  exportBackup,
  exportCalendar,
  exportGedcom,
  exportReadOnlyHtml,
  importBackup,
  importGedcom,
} from "./portable.ts"

test("native backup preserves the full archive", () => {
  assert.deepEqual(importBackup(exportBackup(demoArchive)), demoArchive)
})

test("invalid backups are rejected at the import boundary", () => {
  assert.throws(
    () => importBackup('{"version":1,"families":[]}'),
    /Unsupported or empty/
  )
  const broken = structuredClone(demoArchive)
  broken.families[0].relationships[0].to = "missing"
  assert.throws(() => importBackup(JSON.stringify(broken)), /missing person/)
  const empty = structuredClone(demoArchive)
  empty.families[0].people = []
  assert.throws(() => importBackup(JSON.stringify(empty)), /invalid family/)
  const invalidSettings = structuredClone(demoArchive)
  invalidSettings.settings.generations = "99"
  assert.throws(
    () => importBackup(JSON.stringify(invalidSettings)),
    /invalid display settings/
  )
})

test("GEDCOM round-trip preserves people and parent links", () => {
  const source = demoArchive.families[0]
  const imported = importGedcom(exportGedcom(source))
  assert.equal(imported.people.length, source.people.length)
  assert.equal(imported.relationships.length, source.relationships.length)
  assert.equal(imported.people[0].name, source.people[0].name)
  assert.deepEqual(
    imported.relationships.map((item) => item.type).sort(),
    source.relationships.map((item) => item.type).sort()
  )
  const partner = imported.relationships.find((item) => item.type === "partner")
  assert.equal(partner?.date, "2015-06-20")
  assert.equal(partner.location, "Dhaka, Bangladesh")
})

test("GEDCOM groups parents and never exports siblings as children", () => {
  const gedcom = exportGedcom(demoArchive.families[0])
  assert.match(gedcom, /1 HUSB @I2@\n1 WIFE @I3@\n1 CHIL @I1@/)
  assert.doesNotMatch(gedcom, /1 HUSB @I1@\n1 CHIL @I6@/)
})

test("read-only HTML escapes every user-controlled field", () => {
  const family = structuredClone(demoArchive.families[0])
  family.name = '<img src=x onerror="alert(1)">'
  family.people[3].name = "A & <script>"
  const html = exportReadOnlyHtml(family)
  assert.doesNotMatch(html, /<script>|<img/)
  assert.match(html, /&amp; &lt;script&gt;/)
})

test("read-only HTML excludes living and private fields", () => {
  const family = structuredClone(demoArchive.families[0])
  const html = exportReadOnlyHtml(family)
  assert.match(html, /Azizur Rahman/)
  assert.doesNotMatch(
    html,
    /Farhana Rahman|farhana@example\.test|Dhaka, Bangladesh/
  )
  assert.match(
    html,
    /Living people, contact details, photos, locations and notes are excluded/
  )
})

test("calendar export contains recurring birthdays and anniversaries", () => {
  const calendar = exportCalendar(demoArchive.families[0])
  assert.match(calendar, /BEGIN:VCALENDAR/)
  assert.match(calendar, /RRULE:FREQ=YEARLY/)
  assert.match(calendar, /Farhana Rahman — birthday/)
  assert.match(calendar, /Farhana Rahman and Samira Ahmed: partner/)
})

test("relationship direction and generation levels are stable", () => {
  assert.deepEqual(relationshipEnds("child", "parent", "biological parent"), {
    from: "parent",
    to: "child",
  })
  assert.deepEqual(relationshipEnds("parent", "child", "child"), {
    from: "parent",
    to: "child",
  })
  const levels = generationMap(demoArchive.families[0])
  assert.equal(levels.get("elias"), -2)
  assert.equal(levels.get("june"), 1)

  const family = structuredClone(demoArchive.families[0])
  family.relationships = [
    { id: "child-link", from: "ada", to: "june", type: "child" },
  ]
  assert.equal(generationMap(family).get("june"), 1)
})
