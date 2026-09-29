import assert from "node:assert/strict";
import test from "node:test";
import { belongsToCompany, budgetItemBelongsToWork } from "./tenant-integrity";

test("rejects resources owned by another company", () => {
  assert.equal(belongsToCompany({ companyId: "company-b" }, "company-a"), false);
});

test("requires a budget item to match both company and work", () => {
  assert.equal(
    budgetItemBelongsToWork(
      { companyId: "company-a", workId: "work-b" },
      "company-a",
      "work-a",
    ),
    false,
  );
});