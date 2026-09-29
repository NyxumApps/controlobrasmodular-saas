import assert from "node:assert/strict";
import test from "node:test";
import { getAllowedHosts, getRequestHost } from "./allowedHost";

function withAllowedHosts(value: string, run: () => void) {
  const previous = process.env.ALLOWED_HOSTS;
  process.env.ALLOWED_HOSTS = value;
  try { run(); } finally {
    if (previous === undefined) delete process.env.ALLOWED_HOSTS;
    else process.env.ALLOWED_HOSTS = previous;
  }
}

test("rejects forged forwarded hosts", () => {
  withAllowedHosts("obra-control.example", () => {
    assert.equal(
      getRequestHost({ headers: { host: "obra-control.example", "x-forwarded-host": "attacker.example" } }),
      undefined,
    );
  });
});

test("uses only the trusted rightmost forwarded host from the allowlist", () => {
  withAllowedHosts("obra-control.example", () => {
    assert.equal(
      getRequestHost({ headers: { host: "internal", "x-forwarded-host": "attacker.example, obra-control.example" } }),
      "obra-control.example",
    );
    assert.equal(getAllowedHosts().has("attacker.example"), false);
  });
});
