import assert from "node:assert/strict"
import test from "node:test"

import {
  buildFamilyEvents,
  descendantIds,
  demoArchive,
  estimateBirthYear,
  formatPartialDate,
  isConnectedPerson,
  orderPeopleForTree,
  searchPeople,
  relationshipDescription,
  relationshipTypeForPerson,
  treeParentGroups,
  treeParentUnits,
} from "./family.ts"
import {
  migrateLegacyDemoArchive,
  pushHistory,
  relativeTime,
  trimHistory,
} from "./storage.ts"

const family = demoArchive.families[0]

test("search ranks exact and prefix matches across useful profile fields", () => {
  assert.equal(searchPeople(family, "Nasima")[0].name, "Nasima Begum")
  assert.equal(searchPeople(family, "architect")[0].name, "Farhana Rahman")
  assert.deepEqual(searchPeople(family, "missing"), [])
})

test("age at death estimates an approximate birth year", () => {
  assert.equal(estimateBirthYear("2014-11-20", "80"), "1934")
  assert.equal(estimateBirthYear("2014", "131"), "")
  assert.equal(estimateBirthYear("", "80"), "")
})

test("relationship labels follow the selected person's perspective", () => {
  const relationship = family.relationships.find((item) => item.id === "r7")!
  assert.equal(relationshipTypeForPerson(relationship, "ada"), "child")
  assert.equal(
    relationshipTypeForPerson(relationship, "june"),
    "biological parent"
  )
  assert.equal(
    relationshipTypeForPerson(
      { id: "child", from: "ada", to: "june", type: "child" },
      "june"
    ),
    "biological parent"
  )
  assert.equal(
    relationshipDescription(
      { id: "sibling", from: "ada", to: "leo", type: "sibling" },
      "Farhana",
      "Rafiq"
    ),
    "Farhana and Rafiq are siblings."
  )
})

test("partial dates keep their recorded precision", () => {
  assert.equal(formatPartialDate("1988", "en"), "1988")
  assert.equal(formatPartialDate("1988-04", "en"), "Apr 1988")
  assert.equal(formatPartialDate("1988-04-12", "en"), "Apr 12, 1988")
})

test("family events and connection state come from the relationship graph", () => {
  const events = buildFamilyEvents(family)
  assert.ok(events.some((event) => event.kind === "death"))
  assert.ok(events.some((event) => event.relationshipType === "partner"))
  assert.equal(isConnectedPerson(family, "ada"), true)
  const copy = structuredClone(family)
  copy.people.push({
    ...copy.people[0],
    id: "unconnected",
    name: "Unconnected",
  })
  assert.equal(isConnectedPerson(copy, "unconnected"), false)
})

test("tree ordering keeps partners beside each other", () => {
  const generation = family.people.filter((person) =>
    ["ada", "leo", "noa"].includes(person.id)
  )
  assert.deepEqual(
    orderPeopleForTree(family, generation).map((person) => person.id),
    ["ada", "noa", "leo"]
  )
})

test("tree descendants include the whole branch without partners or siblings", () => {
  assert.deepEqual([...descendantIds(family, "tomas")].sort(), ["ada", "june"])
  assert.deepEqual([...descendantIds(family, "june")], [])
})

test("single-parent children attach to the visible parent partnership", () => {
  assert.deepEqual(treeParentGroups(family).get("june"), {
    parentIds: ["ada"],
    partnerId: "noa",
    relationshipIds: ["r7"],
  })
})

test("siblings without recorded parents inherit their sibling's display parents", () => {
  assert.deepEqual(treeParentGroups(family).get("leo"), {
    parentIds: ["tomas", "maya"],
    relationshipIds: ["r5"],
  })
})

test("siblings with shared parents use one tree parent unit", () => {
  assert.deepEqual(
    treeParentUnits(family).find((unit) => unit.childIds.includes("ada")),
    {
      parentIds: ["tomas", "maya"],
      childIds: ["ada", "leo"],
      relationshipIds: ["r1", "r2", "r5"],
    }
  )
})

test("history retention keeps the newest entries", () => {
  const history = Array.from({ length: 25 }, (_, index) => ({
    id: String(index),
    label: String(index),
    date: new Date(index).toISOString(),
    archive: demoArchive,
  }))
  assert.equal(trimHistory(history).length, 20)
  assert.equal(trimHistory(history)[0].id, "0")
})

test("rapid display changes share one recoverable snapshot", () => {
  const first = {
    id: "1",
    label: "Display: photos shown",
    date: "2026-10-08T12:00:00.000Z",
    archive: demoArchive,
  }
  const next = {
    ...first,
    id: "2",
    label: "Display: contact details shown",
    date: "2026-10-08T12:00:01.000Z",
    archive: structuredClone(demoArchive),
  }
  const history = pushHistory([first], next)
  assert.equal(history.length, 1)
  assert.equal(history[0].label, next.label)
  assert.equal(history[0].archive, first.archive)
  assert.equal(
    relativeTime("2026-10-08T11:59:00.000Z", Date.parse(first.date)),
    "1 minute ago"
  )
})

test("the untouched legacy demo migrates without replacing edited archives", () => {
  const legacy = structuredClone(demoArchive)
  legacy.activeFamilyId = "moreno"
  legacy.families[0].id = "moreno"
  legacy.families[0].name = "The Moreno archive"
  legacy.families[0].people.forEach((person, index) => {
    person.name = [
      "Ada Moreno",
      "Tomás Moreno",
      "Maya Moreno",
      "Elias Moreno",
      "Inês Rocha",
      "Leo Moreno",
      "Noa Silva",
      "June Moreno",
    ][index]
  })

  assert.equal(
    migrateLegacyDemoArchive(legacy).families[0].people[0].name,
    "Farhana Rahman"
  )
  legacy.families[0].people[0].name = "My real name"
  assert.equal(migrateLegacyDemoArchive(legacy), legacy)
})
