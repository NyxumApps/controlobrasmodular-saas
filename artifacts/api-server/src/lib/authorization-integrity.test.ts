import assert from "node:assert/strict";
import test from "node:test";
import { canDemoteOwner, isValidPayment } from "./authorization-integrity";

test("prevents demoting the company's last owner", () => {
  assert.equal(canDemoteOwner("owner_manager", "office", 1), false);
  assert.equal(canDemoteOwner("owner_manager", "office", 2), true);
});

test("accepts only positive payments within the pending balance", () => {
  assert.equal(isValidPayment(0, 100), false);
  assert.equal(isValidPayment(101, 100), false);
  assert.equal(isValidPayment(100, 100), true);
});