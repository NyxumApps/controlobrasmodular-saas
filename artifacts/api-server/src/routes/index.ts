import { Router, type IRouter } from "express";
import healthRouter from "./health";
import analyticsRouter from "./analytics";
import { requireAuth } from "../middlewares/auth";
import bootstrapRouter from "./bootstrap";
import mutationsRouter from "./mutations";
import auditEventsRouter from "./audit-events";
import invitationsRouter from "./invitations";
import onboardingRouter from "./onboarding";
import attachmentsRouter from "./attachments";

const router: IRouter = Router();

router.use(healthRouter);
router.use(analyticsRouter);
router.use(invitationsRouter);
router.use(onboardingRouter);
router.use(requireAuth);
router.use(bootstrapRouter);
router.use(attachmentsRouter);
router.use(mutationsRouter);
router.use(auditEventsRouter);

export default router;
