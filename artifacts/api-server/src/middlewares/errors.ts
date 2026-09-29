import type { ErrorRequestHandler, RequestHandler } from "express";

/** JSON 404 for unknown API routes, so the client never has to parse HTML. */
export const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json({ error: "No encontramos lo que buscas", code: "not_found" });
};

/**
 * Last-resort handler. Internal details go to the log with the request id;
 * the person using the app only receives a calm message and that id, which
 * support can use to find the failure.
 */
export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  const status = typeof error?.status === "number" && error.status >= 400 && error.status < 500 ? error.status : 500;
  req.log?.error({ err: error }, "Unhandled request error");
  if (res.headersSent) { res.destroy(); return; }
  const messages: Record<number, string> = {
    400: "No pudimos leer la información enviada. Revisa los datos e intenta de nuevo.",
    413: "El contenido enviado es demasiado grande.",
  };
  res.status(status).json({
    error: messages[status] ?? "Tuvimos un problema de nuestro lado. Tu información está segura; intenta de nuevo en unos minutos.",
    code: status === 500 ? "internal_error" : "bad_request",
    requestId: String(req.id ?? ""),
  });
};
