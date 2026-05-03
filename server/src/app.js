import express from "express";
import cors from "cors";
import { apiRouter } from "./routes/index.js";
import { uploadsRouter } from "./routes/uploads.routes.js";
import path from "path";
import fs from "fs";
import { errorMiddleware } from "./middleware/error.middleware.js";

function parseOrigins(value) {
  if (!value) return ["http://localhost:5173"];
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    next();
  });

  const allowedOrigins = parseOrigins(process.env.CORS_ORIGIN);

  const corsOptions = {
    origin(origin, cb) {
      // allow non-browser clients (no Origin header)
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error(`Not allowed by CORS: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  };

  app.use(cors(corsOptions));
  // Express 5 + path-to-regexp does NOT accept '*' for routes; use a regex for preflight.
  app.options(/.*/, cors(corsOptions));

  app.use(express.json({ limit: "3mb" }));

  app.get("/health", (req, res) => res.json({ ok: true }));
  // serve uploaded assets (course images/banners)
  const uploadsDir = (() => {
    const direct = path.resolve(process.cwd(), "uploads");
    const nested = path.resolve(process.cwd(), "server", "uploads");
    if (fs.existsSync(direct)) return direct;
    if (fs.existsSync(nested)) return nested;
    return direct;
  })();

  app.use("/uploads", uploadsRouter);
  app.use("/uploads", express.static(uploadsDir));
  app.use("/api", apiRouter);

  const clientDist = (() => {
    const direct = path.resolve(process.cwd(), "client", "dist");
    const sibling = path.resolve(process.cwd(), "..", "client", "dist");
    if (fs.existsSync(direct)) return direct;
    if (fs.existsSync(sibling)) return sibling;
    return null;
  })();

  if (clientDist) {
    app.use(express.static(clientDist));
    app.get(/^(?!\/(?:api|uploads|health)(?:\/|$)).*/, (req, res) => {
      res.sendFile(path.join(clientDist, "index.html"));
    });
  }

  // error handler last
  app.use(errorMiddleware);

  return app;
}
