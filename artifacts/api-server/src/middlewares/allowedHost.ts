import type { IncomingHttpHeaders } from "http";
import type { RequestHandler } from "express";

function normalizeHost(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const host = value.trim().toLowerCase().replace(/^https?:\/\//, "").split("/")[0]?.split(":")[0];
  return host || undefined;
}

/** Hosts from ALLOWED_HOSTS (comma separated); localhost is added outside production. */
export function getAllowedHosts(env: NodeJS.ProcessEnv = process.env): Set<string> {
  const hosts = new Set(
    (env.ALLOWED_HOSTS ?? "")
      .split(",")
      .map(normalizeHost)
      .filter((host): host is string => Boolean(host)),
  );
  if (env.NODE_ENV !== "production") {
    hosts.add("localhost");
    hosts.add("127.0.0.1");
  }
  return hosts;
}

/**
 * Returns the public hostname of the request when it is in the allowlist.
 * Behind a reverse proxy only the rightmost x-forwarded-host value is trusted,
 * because it is the one appended by our own proxy.
 */
export function getRequestHost(req: { headers: IncomingHttpHeaders }): string | undefined {
  const forwarded = req.headers["x-forwarded-host"];
  const raw = Array.isArray(forwarded) ? forwarded.at(-1) : forwarded;
  const forwardedValues = raw?.split(",").map(value => value.trim()).filter(Boolean);
  const candidate = normalizeHost(forwardedValues?.at(-1) ?? req.headers.host);
  return candidate && getAllowedHosts().has(candidate) ? candidate : undefined;
}

/** Same as getRequestHost but keeps the port, needed to build links in local development. */
export function getRequestHostWithPort(req: { headers: IncomingHttpHeaders }): string | undefined {
  if (!getRequestHost(req)) return undefined;
  const forwarded = req.headers["x-forwarded-host"];
  const raw = Array.isArray(forwarded) ? forwarded.at(-1) : forwarded;
  const value = raw?.split(",").map(item => item.trim()).filter(Boolean).at(-1) ?? req.headers.host;
  return value?.trim().toLowerCase().replace(/^https?:\/\//, "").split("/")[0] || undefined;
}

export const requireAllowedHost: RequestHandler = (req, res, next) => {
  if (!getRequestHost(req)) {
    res.status(400).json({ error: "Invalid request host" });
    return;
  }
  next();
};
