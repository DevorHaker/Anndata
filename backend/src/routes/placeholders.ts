import { Router, Request, Response } from "express";
import { sendError } from "../utils/response";

export function createPlaceholderRouter(
  moduleName: string,
  targetPhase: string,
): Router {
  const router = Router();

  router.all("*", (req: Request, res: Response) => {
    return sendError(
      res,
      501,
      "NOT_IMPLEMENTED",
      `The [${moduleName}] domain API module is scheduled for implementation in ${targetPhase}.`,
      [
        {
          module: moduleName,
          path: req.originalUrl,
          method: req.method,
          phase: targetPhase,
        },
      ],
    );
  });

  return router;
}
