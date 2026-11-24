import express from "express";
import type { ErrorRequestHandler } from "express";
import { shopsRouter } from "./routes/shops.js";
import { HotPepperServiceError } from "./types/hotpepper.js";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.use(express.json());

  app.get("/api/health", (_request, response) => {
    response.json({ status: "ok" });
  });

  app.use("/api/shops", shopsRouter);

  const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
    if (error instanceof HotPepperServiceError) {
      response.status(error.statusCode).json({
        error: { code: error.code, message: error.message },
      });
      return;
    }

    // URLには座標や上流APIキーが含まれ得るため、要求URLや例外の全文は記録しない。
    console.error("Unexpected API error.");
    response.status(500).json({
      error: { code: "INTERNAL_SERVER_ERROR", message: "An unexpected error occurred." },
    });
  };

  app.use(errorHandler);
  return app;
}
