import app from "./app";
import { logger } from "./lib/logger";
import { clerkClient } from "@clerk/express";
import { processClerkInvitationRevocations } from "./lib/clerk-invitation-revocations";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const server = app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});

let retryRunning = false;
const retryTimer = setInterval(async () => {
  if (retryRunning) return;
  retryRunning = true;
  try {
    const result = await processClerkInvitationRevocations({
      revokeClerkInvitation: id => clerkClient.invitations.revokeInvitation(id),
    });
    if (result.processed > 0) {
      logger.info(result, "Processed Clerk invitation revocation retries");
    }
  } catch (err) {
    logger.error({ err }, "Clerk invitation revocation worker failed");
  } finally {
    retryRunning = false;
  }
}, 30_000);
retryTimer.unref();

server.on("close", () => clearInterval(retryTimer));
