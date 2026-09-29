import { randomUUID } from "node:crypto";
import assert from "node:assert/strict";
import test from "node:test";
import { eq, inArray } from "drizzle-orm";
import { companiesTable, db, worksTable } from "@workspace/db";
import { ensurePilotData } from "./pilot-seed";

test("seeds two companies without shared resource identifiers", async () => {
  const companyIds = [`test-${randomUUID()}`, `test-${randomUUID()}`];
  try {
    await db.insert(companiesTable).values(companyIds.map(id => ({ id, name: "Test" })));
    await Promise.all(companyIds.map(ensurePilotData));
    const rows = await db.select({ id: worksTable.id, companyId: worksTable.companyId }).from(worksTable).where(inArray(worksTable.companyId, companyIds));
    const firstIds = new Set(rows.filter(row => row.companyId === companyIds[0]).map(row => row.id));
    const secondIds = rows.filter(row => row.companyId === companyIds[1]).map(row => row.id);
    assert.equal(rows.length, 6);
    assert.equal(secondIds.some(id => firstIds.has(id)), false);
  } finally {
    await db.delete(companiesTable).where(inArray(companiesTable.id, companyIds));
  }
});