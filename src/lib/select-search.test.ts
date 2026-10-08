import assert from "node:assert/strict"
import test from "node:test"

import { matchesSelectOption } from "./select-search.ts"

test("select search ignores case and surrounding spaces", () => {
  assert.equal(matchesSelectOption("Foster parent", "  FOSTER "), true)
  assert.equal(matchesSelectOption("Biological parent", "foster"), false)
})
