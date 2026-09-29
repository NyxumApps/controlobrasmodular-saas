import assert from "node:assert/strict";
import test from "node:test";
import {
  createIpRateLimiter,
  isAllowedEvent,
  isPilotKeyAuthorized,
  summarizeAnalytics,
  type AnalyticsRecord,
} from "./analytics-policy";

test("requires an exact provisioned pilot key", () => {
  assert.equal(isPilotKeyAuthorized(undefined, "secret"), false);
  assert.equal(isPilotKeyAuthorized("wrong", "secret"), false);
  assert.equal(isPilotKeyAuthorized("secret", "secret"), true);
});

test("bounds repeated cookie-less submissions by IP and expires buckets", () => {
  const limited = createIpRateLimiter(2, 1_000);
  assert.equal(limited("203.0.113.10", 0), false);
  assert.equal(limited("203.0.113.10", 100), false);
  assert.equal(limited("203.0.113.10", 200), true);
  assert.equal(limited("203.0.113.10", 1_001), false);
});

test("rejects properties outside the event allowlist", () => {
  assert.equal(isAllowedEvent("work_reviewed", "profitability", { status: "en curso" }), true);
  assert.equal(isAllowedEvent("work_reviewed", "profitability", { status: "custom text" }), false);
  assert.equal(isAllowedEvent("work_reviewed", "communications", { status: "en curso" }), false);
  assert.equal(isAllowedEvent("work_reviewed", "profitability", { name: "private" }), false);
  assert.equal(isAllowedEvent("unknown_event", "profitability", {}), false);
});

test("counts only current-week visitors who also appeared before as returning", () => {
  const events: AnalyticsRecord[] = [
    { eventName: "work_reviewed", visitorHash: "returning", module: "profitability", occurredAt: new Date("2026-09-01T12:00:00Z") },
    { eventName: "work_reviewed", visitorHash: "returning", module: "profitability", occurredAt: new Date("2026-09-08T12:00:00Z") },
    { eventName: "work_reviewed", visitorHash: "new", module: "profitability", occurredAt: new Date("2026-09-09T12:00:00Z") },
    { eventName: "work_reviewed", visitorHash: "old-only", module: "profitability", occurredAt: new Date("2026-08-20T12:00:00Z") },
  ];

  const summary = summarizeAnalytics(events, new Date("2026-09-09T18:00:00Z"));
  assert.equal(summary.weeklyVisitors, 2);
  assert.equal(summary.returningVisitors, 1);
  assert.ok(summary.returningVisitors <= summary.weeklyVisitors);
  assert.equal(summary.byModule.profitability.returningVisitors, 1);
  assert.equal(summary.byModule.communications.returningVisitors, 0);
});

test("does not let future events redefine the current-week cohort", () => {
  const events: AnalyticsRecord[] = [
    { eventName: "work_reviewed", visitorHash: "future", module: "profitability", occurredAt: new Date("2026-09-20T12:00:00Z") },
  ];

  const summary = summarizeAnalytics(events, new Date("2026-09-09T18:00:00Z"));
  assert.equal(summary.weeklyVisitors, 0);
  assert.equal(summary.returningVisitors, 0);
});