import express, { type Express } from "express";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { requireAllowedHost } from "./middlewares/allowedHost";
import { authenticateSession } from "./middlewares/auth";
import { errorHandler, notFoundHandler } from "./middlewares/errors";

const app: Express = express();
// Behind a reverse proxy in production; needed for rate limits and secure cookies.
app.set("trust proxy", 1);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(requireAllowedHost);
app.use(cookieParser(process.env.SESSION_SECRET));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(authenticateSession);

app.use("/api", router);
app.use("/api", notFoundHandler);
app.use(errorHandler);

export default app;
