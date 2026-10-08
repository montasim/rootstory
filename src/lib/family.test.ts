import assert from "node:assert/strict"
import test from "node:test"

import {
  buildFamilyEvents,
  descendantIds,
  demoArchive,
  formatPartialDate,
  isConnectedPerson,
  orderPeopleForTree,
  searchPeople,
  treeParentGroups,
  treeParentUnits,
} from "./family.ts"
import { trimHistory } from "./storage.ts"

const family = demoArchive.families[0]

test("search ranks exact and prefix matches across useful profile fields", () => {
  assert.equal(searchPeople(family, "Maya")[0].name, "Maya Moreno")
  assert.equal(searchPeople(family, "architect")[0].name, "Ada Moreno")
  assert.deepEqual(searchPeople(family, "missing"), [])
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
