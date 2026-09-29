import { timingSafeEqual } from "node:crypto";

export type AnalyticsModule =
  | "profitability"
  | "communications"
  | "subcontractors";

export type AnalyticsRecord = {
  eventName: string;
  visitorHash: string;
  occurredAt: Date;
  module: string;
};

export function createIpRateLimiter(limit: number, windowMs: number) {
  const buckets = new Map<string, { count: number; resetsAt: number }>();
  return (ip: string, now = Date.now()): boolean => {
    for (const [key, bucket] of buckets) {
      if (bucket.resetsAt <= now) buckets.delete(key);
    }
    const bucket = buckets.get(ip);
    if (!bucket) {
      buckets.set(ip, { count: 1, resetsAt: now + windowMs });
      return false;
    }
    bucket.count += 1;
    return bucket.count > limit;
  };
}

export function isPilotKeyAuthorized(
  provided: string | undefined,
  expected: string | undefined,
): boolean {
  if (!provided || !expected) return false;
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);
  return (
    providedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(providedBuffer, expectedBuffer)
  );
}

type EventRule = {
  module: AnalyticsModule | readonly AnalyticsModule[];
  properties: Record<string, (value: unknown) => boolean>;
};

const oneOf =
  <T extends string>(values: readonly T[]) =>
  (value: unknown): boolean =>
    typeof value === "string" && values.includes(value as T);
const isBoolean = (value: unknown): boolean => typeof value === "boolean";

const eventRules: Record<string, EventRule> = {
  work_created: {
    module: "profitability",
    properties: { initial_status: oneOf(["planificación"]) },
  },
  work_reviewed: {
    module: "profitability",
    properties: {
      status: oneOf(["planificación", "en curso", "pausada", "completada"]),
    },
  },
  expense_registered: {
    module: "profitability",
    properties: {
      expense_type: oneOf([
        "material",
        "mano_obra",
        "equipo",
        "subcontrato",
        "otro",
      ]),
      creates_overrun: isBoolean,
    },
  },
  cost_alert_addressed: {
    module: "profitability",
    properties: { alert_type: oneOf(["projected_overrun"]) },
  },
  incident_created: {
    module: "communications",
    properties: { priority: oneOf(["alta", "media", "baja"]) },
  },
  incident_status_changed: {
    module: "communications",
    properties: {
      from_status: oneOf(["abierto", "en proceso", "resuelto"]),
      to_status: oneOf(["abierto", "en proceso", "resuelto"]),
      priority: oneOf(["alta", "media", "baja"]),
    },
  },
  incident_resolved: {
    module: "communications",
    properties: { priority: oneOf(["alta", "media", "baja"]) },
  },
  evidence_upload_selected: {
    module: "subcontractors",
    properties: { evidence_type: oneOf(["image", "document"]) },
  },
  payment_approved: {
    module: "subcontractors",
    properties: {
      has_evidence: isBoolean,
      progress_band: oneOf(["low", "medium", "high"]),
    },
  },
  module_toggled: {
    module: ["communications", "subcontractors"],
    properties: { enabled: isBoolean },
  },
};

export function isAllowedEvent(
  eventName: string,
  module: string,
  properties: Record<string, unknown>,
): boolean {
  const rule = eventRules[eventName];
  if (!rule) return false;
  const modules = Array.isArray(rule.module) ? rule.module : [rule.module];
  if (!modules.includes(module as AnalyticsModule)) return false;
  const expectedNames = Object.keys(rule.properties);
  const actualNames = Object.keys(properties);
  return (
    actualNames.length === expectedNames.length &&
    actualNames.every(
      (name) => rule.properties[name]?.(properties[name]) === true,
    )
  );
}

function retentionFor(
  events: AnalyticsRecord[],
  currentWeekStart: Date,
  previousWeekStart: Date,
) {
  const currentVisitors = new Set(
    events
      .filter(
        (event) =>
          event.occurredAt >= currentWeekStart &&
          event.occurredAt < new Date(currentWeekStart.getTime() + 7 * 86400000),
      )
      .map((event) => event.visitorHash),
  );
  const previousVisitors = new Set(
    events
      .filter(
        (event) =>
          event.occurredAt >= previousWeekStart &&
          event.occurredAt < currentWeekStart,
      )
      .map((event) => event.visitorHash),
  );
  const returningVisitors = [...currentVisitors].filter((visitor) =>
    previousVisitors.has(visitor),
  ).length;
  return {
    currentWeeklyVisitors: currentVisitors.size,
    previousWeeklyVisitors: previousVisitors.size,
    returningVisitors,
    retentionRate:
      previousVisitors.size === 0
        ? 0
        : Math.round((returningVisitors / previousVisitors.size) * 100),
  };
}

export function summarizeAnalytics(events: AnalyticsRecord[], now: Date) {
  const currentWeekStart = new Date(now);
  currentWeekStart.setUTCHours(0, 0, 0, 0);
  currentWeekStart.setUTCDate(
    currentWeekStart.getUTCDate() - ((currentWeekStart.getUTCDay() + 6) % 7),
  );
  const previousWeekStart = new Date(currentWeekStart.getTime() - 7 * 86400000);
  const globalRetention = retentionFor(
    events,
    currentWeekStart,
    previousWeekStart,
  );
  const modules: AnalyticsModule[] = [
    "profitability",
    "communications",
    "subcontractors",
  ];
  const byModule = Object.fromEntries(
    modules.map((module) => [
      module,
      retentionFor(
        events.filter((event) => event.module === module),
        currentWeekStart,
        previousWeekStart,
      ),
    ]),
  ) as Record<AnalyticsModule, ReturnType<typeof retentionFor>>;
  const count = (name: string) =>
    events.filter((event) => event.eventName === name).length;

  return {
    totalEvents: events.length,
    weeklyVisitors: globalRetention.currentWeeklyVisitors,
    returningVisitors: globalRetention.returningVisitors,
    worksCreated: count("work_created"),
    worksReviewed: count("work_reviewed"),
    expensesRegistered: count("expense_registered"),
    costAlertsActedOn: count("cost_alert_addressed"),
    incidencesCreated: count("incident_created"),
    incidencesResolved: count("incident_resolved"),
    evidenceUploads: count("evidence_upload_selected"),
    paymentApprovals: count("payment_approved"),
    moduleChanges: count("module_toggled"),
    byModule,
  };
}