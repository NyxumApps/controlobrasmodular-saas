import assert from "node:assert/strict";
import test from "node:test";
import { CreateExpenseBody } from "@workspace/api-zod";

const baseExpense = {
  workId: "work-1",
  itemId: "item-1",
  description: "Material",
  type: "material" as const,
  date: "2026-09-08",
  vendor: "Proveedor",
};

test("rejects zero and negative expense amounts at the API boundary", () => {
  assert.equal(CreateExpenseBody.safeParse({ ...baseExpense, amount: 0 }).success, false);
  assert.equal(CreateExpenseBody.safeParse({ ...baseExpense, amount: -1 }).success, false);
  assert.equal(CreateExpenseBody.safeParse({ ...baseExpense, amount: 1 }).success, true);
});