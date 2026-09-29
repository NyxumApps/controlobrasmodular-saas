type AnalyticsData = Record<string, string | number | boolean>

const ANALYTICS_SESSION_KEY = "obracontrol_analytics_session"

type AnalyticsModule = "profitability" | "communications" | "subcontractors"

declare global {
  interface Window {
    umami?: {
      track(name: string, data?: AnalyticsData): void
    }
  }
}

export function trackEvent(
  name: string,
  data: AnalyticsData & { module: AnalyticsModule },
): void {
  if (typeof window === "undefined") return

  try {
    const occurredAt = new Date()
    let anonymousSession = sessionStorage.getItem(ANALYTICS_SESSION_KEY)
    if (!anonymousSession) {
      anonymousSession = crypto.randomUUID()
      sessionStorage.setItem(ANALYTICS_SESSION_KEY, anonymousSession)
    }
    const { module, ...properties } = data

    window.umami?.track(name, {
      occurred_at: occurredAt.toISOString(),
      anonymous_session: anonymousSession,
      module,
      ...properties,
    })

    void fetch("/api/analytics/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        name,
        module,
        properties,
      }),
    }).catch(() => {
      // Local operational flows remain available if analytics is temporarily down.
    })
  } catch {
    // Analytics must never interrupt an operational workflow.
  }
}