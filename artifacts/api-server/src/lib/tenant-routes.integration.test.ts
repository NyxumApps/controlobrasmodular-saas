import { randomUUID } from "node:crypto";
import assert from "node:assert/strict";
import test from "node:test";
import express from "express";
import { and, eq, inArray } from "drizzle-orm";
import {
  addressedCostAlertsTable,
  budgetItemsTable,
  companiesTable,
  companyMetricsTable,
  contractsTable,
  db,
  expensesTable,
  incidentsTable,
  membershipsTable,
  worksTable,
} from "@workspace/db";
import { resolveAuthorization, type CompanyRole } from "../middlewares/auth";
import { ensurePilotData } from "./pilot-seed";
import bootstrapRouter from "../routes/bootstrap";
import mutationsRouter from "../routes/mutations";
import { createAttachmentsRouter } from "../routes/attachments";

type HttpMethod = "GET" | "POST" | "PATCH" | "PUT";
type TestResponse = { status: number; body: any };

const roles: CompanyRole[] = ["owner_manager", "office", "site_manager"];

test("authenticated routes isolate companies and enforce every role", async () => {
  const suffix = randomUUID();
  const companyA = `tenant-a-${suffix}`;
  const companyB = `tenant-b-${suffix}`;
  const userByRole = Object.fromEntries(
    roles.map(role => [role, `${role}-${suffix}`]),
  ) as Record<CompanyRole, string>;
  const foreignOwner = `foreign-owner-${suffix}`;

  await db.insert(companiesTable).values([
    { id: companyA, name: "Empresa A" },
    { id: companyB, name: "Empresa B" },
  ]);
  await db.insert(membershipsTable).values([
    ...roles.map(role => ({
      id: `member-${role}-${suffix}`,
      companyId: companyA,
      clerkUserId: userByRole[role],
      role,
    })),
    {
      id: `member-foreign-${suffix}`,
      companyId: companyB,
      clerkUserId: foreignOwner,
      role: "owner_manager" as const,
    },
  ]);
  await Promise.all([ensurePilotData(companyA), ensurePilotData(companyB)]);

  const app = express();
  app.use(express.json());
  app.use(async (req, res, next) => {
    const userId = req.header("x-test-user-id");
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const authorization = await resolveAuthorization(userId);
    if (!authorization) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    req.userId = userId;
    req.authorization = authorization;
    next();
  });

  let objectUploads = 0;
  let objectDeletes = 0;
  const storedObject = {
    exists: async () => [true],
    getMetadata: async () => [{ size: "128", contentType: "application/pdf" }],
    delete: async () => { objectDeletes += 1; },
    createReadStream: () => { throw new Error("not used in this test"); },
  };
  const attachmentsRouter = createAttachmentsRouter({
    objectFile: () => storedObject,
    streamObject: async () => { throw new Error("not used in this test"); },
    uploadObject: async () => { objectUploads += 1; },
  } as any);
  app.use("/api", bootstrapRouter, attachmentsRouter, mutationsRouter);
  const server = app.listen(0);
  await new Promise<void>((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  const address = server.address();
  assert(address && typeof address === "object");
  const baseUrl = `http://127.0.0.1:${address.port}/api`;

  const request = async (
    role: CompanyRole,
    method: HttpMethod,
    path: string,
    body?: unknown,
  ): Promise<TestResponse> => {
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        "content-type": "application/json",
        "x-test-user-id": userByRole[role],
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await response.text();
    return { status: response.status, body: text ? JSON.parse(text) : undefined };
  };

  try {
    const foreignWork = `${companyB}-w1`;
    const foreignItem = `${companyB}-b1`;
    const foreignIncident = `${companyB}-i1`;
    const foreignContract = `${companyB}-c1`;
    const foreignMember = `member-foreign-${suffix}`;

    for (const role of roles) {
      const response = await request(role, "GET", "/bootstrap");
      assert.equal(response.status, 200);
      assert.equal(response.body.company.id, companyA);
      assert.equal(response.body.role, role);
      for (const collection of [
        "members", "works", "budgetItems", "expenses", "incidents",
        "subcontractors", "contracts", "commitments",
      ]) {
        assert.equal(
          response.body[collection].some((row: { companyId?: string; id?: string }) =>
            row.companyId === companyB || row.id?.startsWith(companyB)),
          false,
          `${role} bootstrap leaked ${collection}`,
        );
      }
    }

    const workBody = {
      name: "Obra aislada", client: "Cliente", location: "San José",
      status: "planificación", progress: 0, budget: 1000,
      startDate: "2026-01-01", endDate: "2026-12-31", manager: "",
    };
    assert.equal((await request("owner_manager", "POST", "/works", workBody)).status, 201);
    assert.equal((await request("office", "POST", "/works", workBody)).status, 201);
    assert.equal((await request("site_manager", "POST", "/works", workBody)).status, 403);

    const expenseBody = {
      workId: foreignWork, itemId: foreignItem, description: "Cruce",
      amount: 250, type: "material", date: "2026-01-01", vendor: "Proveedor",
    };
    const [foreignItemBefore] = await db.select().from(budgetItemsTable).where(eq(budgetItemsTable.id, foreignItem));
    const [metricsABefore] = await db.select().from(companyMetricsTable).where(eq(companyMetricsTable.companyId, companyA));
    const [metricsBBefore] = await db.select().from(companyMetricsTable).where(eq(companyMetricsTable.companyId, companyB));
    for (const role of roles) {
      assert.equal((await request(role, "POST", "/expenses", expenseBody)).status, 404);
    }
    const [foreignItemAfter] = await db.select().from(budgetItemsTable).where(eq(budgetItemsTable.id, foreignItem));
    const [metricsAAfter] = await db.select().from(companyMetricsTable).where(eq(companyMetricsTable.companyId, companyA));
    const [metricsBAfter] = await db.select().from(companyMetricsTable).where(eq(companyMetricsTable.companyId, companyB));
    assert.equal(foreignItemAfter.spent, foreignItemBefore.spent);
    assert.equal(metricsAAfter.expensesRegistered, metricsABefore.expensesRegistered);
    assert.equal(metricsBAfter.expensesRegistered, metricsBBefore.expensesRegistered);
    assert.equal(
      (await db.select().from(expensesTable).where(and(
        eq(expensesTable.companyId, companyA),
        eq(expensesTable.itemId, foreignItem),
      ))).length,
      0,
    );

    const incidentBody = {
      workId: foreignWork, title: "Cruce", description: "No permitido",
      priority: "alta", assignee: "Persona",
    };

    const uploadReservation = await request("site_manager", "POST", "/storage/uploads/request-url", {
      name: "avance.pdf",
      contentType: "application/pdf",
      size: 128,
    });
    assert.equal(uploadReservation.status, 200);
    const uploadResponse = await fetch(`http://127.0.0.1:${address.port}${uploadReservation.body.uploadURL}`, {
      method: "PUT",
      headers: {
        "content-type": "application/pdf",
        "x-test-user-id": userByRole.site_manager,
      },
      body: Buffer.alloc(128),
    });
    assert.equal(uploadResponse.status, 204);
    const createdAttachmentBody = {
      objectPath: uploadReservation.body.objectPath,
      fileName: "avance.pdf",
      contentType: "application/pdf",
      size: 128,
      contractId: `${companyA}-c1`,
    };
    const createdAttachment = await request("site_manager", "POST", "/attachments", createdAttachmentBody);
    assert.equal(createdAttachment.status, 201);

    const oversizedReservation = await request("site_manager", "POST", "/storage/uploads/request-url", {
      name: "demasiado.pdf",
      contentType: "application/pdf",
      size: 128,
    });
    assert.equal(oversizedReservation.status, 200);
    const oversizedUpload = await fetch(`http://127.0.0.1:${address.port}${oversizedReservation.body.uploadURL}`, {
      method: "PUT",
      headers: {
        "content-type": "application/pdf",
        "x-test-user-id": userByRole.site_manager,
      },
      body: Buffer.alloc(129),
    });
    assert.equal(oversizedUpload.status, 400);
    const bootstrapAfterAttachment = await request("site_manager", "GET", "/bootstrap");
    assert.equal(bootstrapAfterAttachment.status, 200);
    const persistedAttachment = bootstrapAfterAttachment.body.attachments.find(
      (item: { id: string }) => item.id === createdAttachment.body.id,
    );
    assert.equal(typeof persistedAttachment.createdAt, "string");

    for (const role of ["owner_manager", "office"] as const) {
      assert.equal((await request(role, "PATCH", `/contracts/${foreignContract}/payment`, { amount: 100 })).status, 404);
      assert.equal((await request(role, "POST", `/cost-alerts/${foreignItem}/address`)).status, 404);
    }
    assert.equal((await request("site_manager", "PATCH", `/contracts/${foreignContract}/payment`, { amount: 100 })).status, 403);
    assert.equal((await request("site_manager", "POST", `/cost-alerts/${foreignItem}/address`)).status, 403);

    assert.equal((await request("owner_manager", "PATCH", `/members/${foreignMember}/role`, { role: "office" })).status, 404);
    assert.equal((await request("office", "PATCH", `/members/${foreignMember}/role`, { role: "office" })).status, 403);
    assert.equal((await request("site_manager", "PATCH", `/members/${foreignMember}/role`, { role: "office" })).status, 403);

    for (const role of ["owner_manager", "office"] as const) {
      assert.equal((await request(role, "PATCH", "/company", { name: `Empresa A ${role}` })).status, 200);
      assert.equal((await request(role, "PATCH", "/settings/modules", { module: "profitability", enabled: false })).status, 200);
    }
    assert.equal((await request("site_manager", "PATCH", "/company", { name: "Prohibido" })).status, 403);
    assert.equal((await request("site_manager", "PATCH", "/settings/modules", { module: "profitability", enabled: true })).status, 403);

    const [foreignCompany] = await db.select().from(companiesTable).where(eq(companiesTable.id, companyB));
    const [foreignContractRow] = await db.select().from(contractsTable).where(eq(contractsTable.id, foreignContract));
    const [foreignIncidentRow] = await db.select().from(incidentsTable).where(eq(incidentsTable.id, foreignIncident));
    const [foreignMembershipRow] = await db.select().from(membershipsTable).where(eq(membershipsTable.id, foreignMember));
    assert.equal(foreignCompany.name, "Empresa B");
    assert.equal(foreignContractRow.approvedPaid, 2_000_000);
    assert.equal(foreignContractRow.pendingPayment, 1_500_000);
    assert.equal(foreignContractRow.evidenceCount, 3);
    assert.equal(foreignIncidentRow.status, "en proceso");
    assert.equal(foreignMembershipRow.role, "owner_manager");
    assert.equal(
      (await db.select().from(addressedCostAlertsTable).where(and(
        eq(addressedCostAlertsTable.companyId, companyA),
        eq(addressedCostAlertsTable.budgetItemId, foreignItem),
      ))).length,
      0,
    );
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close(error => error ? reject(error) : resolve()),
    );
    await db.delete(companiesTable).where(inArray(companiesTable.id, [companyA, companyB]));
  }
});
