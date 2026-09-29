import assert from "node:assert/strict";
import test from "node:test";
import { serializeIncident } from "./api-serialization";

test("serializes database incident timestamps for the API contract", () => {
  const result = serializeIncident({
    id: "i1",
    createdAt: new Date("2024-01-10T10:00:00.000Z"),
  });
  assert.equal(result.createdAt, "2024-01-10T10:00:00.000Z");
});