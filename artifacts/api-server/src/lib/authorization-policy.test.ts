import test from "node:test";
import assert from "node:assert/strict";
import { can } from "./authorization-policy";

test("site managers cannot administer company financial controls", () => {
  assert.equal(can("site_manager", "create_work"), false);
  assert.equal(can("site_manager", "approve_payment"), false);
  assert.equal(can("site_manager", "cost_alert"), false);
  assert.equal(can("site_manager", "expense"), true);
});
test("office cannot modify membership roles", () => {
  assert.equal(can("office", "member_roles"), false);
  assert.equal(can("office", "company_settings"), true);
});