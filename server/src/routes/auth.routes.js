import { Router } from "express";
import {
  loginHandler,
  registerHandler,
  meHandler,
} from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { rateLimit } from "../middleware/rateLimit.middleware.js";

export const authRouter = Router();

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30 });

authRouter.post("/register", authLimiter, registerHandler);
authRouter.post("/login", authLimiter, loginHandler);
authRouter.get("/me", requireAuth, meHandler);
