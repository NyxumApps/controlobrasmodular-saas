import { createHash, randomUUID } from "node:crypto";
import { Router, type IRouter, type Request } from "express";
import { db } from "@workspace/db";
import { analyticsEventsTable } from "@workspace/db/schema";
import {
  GetAnalyticsSummaryResponse,
  RecordAnalyticsEventBody,
} from "@workspace/api-zod";
import {
  createIpRateLimiter,
  isAllowedEvent,
  isPilotKeyAuthorized,
  summarizeAnalytics,
} from "../lib/analytics-policy";

const router: IRouter = Router();
const VISITOR_COOKIE = "obracontrol_visitor";
const MAX_EVENTS_PER_HOUR = 120;
const isRateLimited = createIpRateLimiter(
  MAX_EVENTS_PER_HOUR,
  60 * 60 * 1000,
);

function isSameSiteRequest(req: Request): boolean {
  const fetchSite = req.get("sec-fetch-site");
  if (fetchSite) return fetchSite === "same-origin" || fetchSite === "same-site";

  const origin = req.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).host === req.get("host");
  } catch {
    return false;
  }
}

function getVisitor(req: Request): string | undefined {
  const value = req.signedCookies?.[VISITOR_COOKIE];
  return typeof value === "string" ? value : undefined;
}

router.post("/analytics/events", async (req, res): Promise<void> => {
  if (!isSameSiteRequest(req)) {
    res.status(403).json({ error: "Same-site request required" });
    return;
  }

  const parsed = RecordAnalyticsEventBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid analytics event" });
    return;
  }

  if (
    !isAllowedEvent(
      parsed.data.name,
      parsed.data.module,
      parsed.data.properties,
    )
  ) {
    res.status(400).json({ error: "Disallowed analytics property" });
    return;
  }

  const visitor = getVisitor(req) ?? randomUUID();
  const visitorHash = createHash("sha256").update(visitor).digest("hex");
  if (isRateLimited(req.ip ?? "unknown")) {
    res.status(429).json({ error: "Analytics rate limit exceeded" });
    return;
  }

  res.cookie(VISITOR_COOKIE, visitor, {
    signed: true,
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: 365 * 24 * 60 * 60 * 1000,
  });

  await db.insert(analyticsEventsTable).values({
    eventName: parsed.data.name,
    visitorHash,
    module: parsed.data.module,
    properties: parsed.data.properties,
  });
  res.sendStatus(204);
});

router.get("/analytics/summary", async (req, res): Promise<void> => {
  const expectedKey = process.env.PILOT_ANALYTICS_KEY;
  const providedKey = req.get("x-pilot-analytics-key");
  if (
    !isSameSiteRequest(req) ||
    !isPilotKeyAuthorized(providedKey, expectedKey)
  ) {
    res.status(403).json({ error: "Pilot administrator access required" });
    return;
  }

  const events = await db
    .select({
      eventName: analyticsEventsTable.eventName,
      visitorHash: analyticsEventsTable.visitorHash,
      occurredAt: analyticsEventsTable.occurredAt,
      module: analyticsEventsTable.module,
    })
    .from(analyticsEventsTable);

  res.json(
    GetAnalyticsSummaryResponse.parse(summarizeAnalytics(events, new Date())),
  );
});

export default router;