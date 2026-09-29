import assert from "node:assert/strict";
import test from "node:test";
import { getAllowedHosts, getClerkProxyHost } from "./clerkProxyMiddleware";

test("rejects forged forwarded hosts", () => {
  const previousDomains = process.env.REPLIT_DOMAINS;
  process.env.REPLIT_DOMAINS = "obra-control.example";
  try {
    assert.equal(
      getClerkProxyHost({
        headers: {
          host: "obra-control.example",
          "x-forwarded-host": "attacker.example",
        },
      }),
      undefined,
    );
  } finally {
    if (previousDomains === undefined) delete process.env.REPLIT_DOMAINS;
    else process.env.REPLIT_DOMAINS = previousDomains;
  }
});

test("uses only the trusted rightmost forwarded host from the allowlist", () => {
  const previousDomains = process.env.REPLIT_DOMAINS;
  process.env.REPLIT_DOMAINS = "obra-control.example";
  try {
    assert.equal(
      getClerkProxyHost({
        headers: {
          host: "internal",
          "x-forwarded-host": "attacker.example, obra-control.example",
        },
      }),
      "obra-control.example",
    );
    assert.equal(getAllowedHosts().has("attacker.example"), false);
  } finally {
    if (previousDomains === undefined) delete process.env.REPLIT_DOMAINS;
    else process.env.REPLIT_DOMAINS = previousDomains;
  }
});