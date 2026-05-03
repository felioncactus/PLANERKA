import {
  forgotPassword,
  login,
  register,
  resendVerification,
  resetPassword,
  verifyEmail,
} from "../services/auth.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const registerHandler = asyncHandler(async (req, res) => {
  const result = await register(req.body);
  res.status(201).json(result);
});

export const loginHandler = asyncHandler(async (req, res) => {
  const result = await login(req.body);
  res.status(200).json(result);
});

export const verifyEmailHandler = asyncHandler(async (req, res) => {
  const result = await verifyEmail(req.body);
  res.status(200).json(result);
});

export const resendVerificationHandler = asyncHandler(async (req, res) => {
  const result = await resendVerification(req.body);
  res.status(200).json(result);
});

export const forgotPasswordHandler = asyncHandler(async (req, res) => {
  const result = await forgotPassword(req.body);
  res.status(200).json(result);
});

export const resetPasswordHandler = asyncHandler(async (req, res) => {
  const result = await resetPassword(req.body);
  res.status(200).json(result);
});

export const meHandler = asyncHandler(async (req, res) => {
  // req.user is set by requireAuth middleware
  res.json({ user: req.user });
});
