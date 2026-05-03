import { Router } from "express";
import {
  loginHandler,
  registerHandler,
  meHandler,
  verifyEmailHandler,
  resendVerificationHandler,
  forgotPasswordHandler,
  resetPasswordHandler,
} from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { rateLimit } from "../middleware/rateLimit.middleware.js";

export const authRouter = Router();

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30 });

authRouter.post("/register", authLimiter, registerHandler);
authRouter.post("/login", authLimiter, loginHandler);
authRouter.post("/verify-email", authLimiter, verifyEmailHandler);
authRouter.post("/resend-verification", authLimiter, resendVerificationHandler);
authRouter.post("/forgot-password", authLimiter, forgotPasswordHandler);
authRouter.post("/reset-password", authLimiter, resetPasswordHandler);
authRouter.get("/me", requireAuth, meHandler);
