import assert from "node:assert/strict"
import test from "node:test"

import {
  familyNameSchema,
  partialDateSchema,
  personInputSchema,
  relationshipInputSchema,
  settingsInputSchema,
  shareInputSchema,
} from "./validation.ts"

test("partial dates accept supported precision and reject impossible dates", () => {
  for (const value of ["", "2026", "2026-10", "2024-02-29"])
    assert.equal(partialDateSchema.safeParse(value).success, true)
  for (const value of ["26", "2026-13", "2025-02-29", "2026/10/08"])
    assert.equal(partialDateSchema.safeParse(value).success, false)
})

test("person fields use category-specific validation", () => {
  const base = {
    name: "Ada Moreno",
    relation: "You",
    gender: "female",
    birthDate: "1988-04-12",
    birthQualifier: "exact",
    living: true,
    deathDate: "",
    location: "Lisbon",
    work: "Architect",
    email: "ada@example.test",
    phone: "+351 210 000 000",
    note: "Story",
  }
  assert.equal(personInputSchema.safeParse(base).success, true)
  assert.equal(
    personInputSchema.safeParse({ ...base, email: "not-an-email" }).success,
    false
  )
  assert.equal(
    personInputSchema.safeParse({ ...base, phone: "12" }).success,
    false
  )
  assert.equal(
    personInputSchema.safeParse({ ...base, living: false }).success,
    false
  )
})

test("family and sharing fields reject blank or expired values", () => {
  assert.equal(familyNameSchema.safeParse("   ").success, false)
  assert.equal(
    shareInputSchema.safeParse({
      recipient: "Family historian",
      role: "view",
      scope: "selected branch",
      expires: "2000-01-01",
    }).success,
    false
  )
})

test("relationship and settings selects are validated with their text fields", () => {
  const relationship = {
    mode: "new",
    targetId: "",
    name: "Noa Silva",
    gender: "male",
    type: "partner",
    date: "2026-10",
    location: "Lisbon",
  }
  assert.equal(relationshipInputSchema.safeParse(relationship).success, true)
  assert.equal(
    relationshipInputSchema.safeParse({
      ...relationship,
      gender: "",
      date: "2026-15",
    }).success,
    false
  )
  assert.equal(
    settingsInputSchema.safeParse({
      theme: "light",
      direction: "down",
      showPhotos: true,
      showContact: false,
      generations: "4",
    }).success,
    true
  )
  assert.equal(
    settingsInputSchema.safeParse({
      theme: "light",
      direction: "diagonal",
      showPhotos: true,
      showContact: false,
      generations: "99",
    }).success,
    false
  )
})
