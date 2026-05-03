import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { conflict, unauthorized, badRequest } from "../utils/httpError.js";
import {
  createUser,
  findUserByEmail,
  markUserEmailVerified,
  updateUserPassword,
} from "../repositories/users.repo.js";
import {
  consumeEmailVerificationCode,
  consumePasswordResetCode,
  createEmailVerificationCode,
  createPasswordResetCode,
  getLatestEmailVerificationCode,
  getLatestPasswordResetCode,
} from "../repositories/authCodes.repo.js";
import { sendEmail } from "./email.service.js";

const MAX_AVATAR_LEN = 2_000_000; // ~2MB text (data URL). Keeps DB sane.

const avatarSchema = z
  .string()
  .max(MAX_AVATAR_LEN)
  .refine((v) => v.startsWith("data:image/"), { message: "avatar must be a data:image/* URL" });

const registerSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(72),
  name: z.string().min(1).max(100),
  avatarUrl: avatarSchema.optional().nullable(),
  language: z.enum(["en", "ru", "ko", "kk", "uz"]).optional(),
});

const loginSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(1).max(72),
});

const emailSchema = z.object({
  email: z.string().email().max(255),
});

const verifyEmailSchema = z.object({
  email: z.string().email().max(255),
  code: z.string().regex(/^\d{6}$/),
});

const resetPasswordSchema = z.object({
  email: z.string().email().max(255),
  code: z.string().regex(/^\d{6}$/),
  password: z.string().min(8).max(72),
});

function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatar_url: user.avatar_url ?? null,
    language: user.language || "en",
    email_verified_at: user.email_verified_at ?? null,
    created_at: user.created_at,
    updated_at: user.updated_at,
  };
}

function makeCode() {
  return String(crypto.randomInt(100000, 1000000));
}

function hashCode(code) {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is missing in .env");
  }
  return crypto.createHmac("sha256", process.env.JWT_SECRET).update(String(code)).digest("hex");
}

function codeExpiresAt(minutes = 15) {
  return new Date(Date.now() + minutes * 60 * 1000);
}

async function sendVerificationCode(user) {
  const code = makeCode();
  await createEmailVerificationCode({
    userId: user.id,
    codeHash: hashCode(code),
    expiresAt: codeExpiresAt(15),
  });
  await sendEmail({
    to: user.email,
    subject: "Your PLANERKA verification code",
    text: `Your PLANERKA verification code is ${code}. It expires in 15 minutes.`,
    html: `<p>Your PLANERKA verification code is <strong>${code}</strong>.</p><p>It expires in 15 minutes.</p>`,
  });
}

async function sendPasswordResetCode(user) {
  const code = makeCode();
  await createPasswordResetCode({
    userId: user.id,
    codeHash: hashCode(code),
    expiresAt: codeExpiresAt(15),
  });
  await sendEmail({
    to: user.email,
    subject: "Your PLANERKA password reset code",
    text: `Your PLANERKA password reset code is ${code}. It expires in 15 minutes.`,
    html: `<p>Your PLANERKA password reset code is <strong>${code}</strong>.</p><p>It expires in 15 minutes.</p>`,
  });
}

function assertCodeValid(row, code) {
  if (!row || row.consumed_at || new Date(row.expires_at).getTime() < Date.now() || row.code_hash !== hashCode(code)) {
    throw badRequest("Invalid or expired code", "INVALID_CODE");
  }
}

export function signToken(user) {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is missing in .env");
  }
  if (process.env.NODE_ENV === "production" && (process.env.JWT_SECRET.length < 32 || /change_me/i.test(process.env.JWT_SECRET))) {
    throw new Error("JWT_SECRET must be a strong production secret (32+ characters)");
  }
  const expiresIn = process.env.JWT_EXPIRES_IN || "7d";
  return jwt.sign(
    { email: user.email, name: user.name },
    process.env.JWT_SECRET,
    { subject: user.id, expiresIn }
  );
}

export async function register(input) {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    throw badRequest("Invalid register payload", "VALIDATION_ERROR");
  }

  const { email, password, name, avatarUrl, language } = parsed.data;
  const normalizedEmail = email.trim().toLowerCase();

  const existing = await findUserByEmail(normalizedEmail);
  if (existing) {
    throw conflict("Email already registered", "EMAIL_TAKEN");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await createUser({ email: normalizedEmail, passwordHash, name, avatarUrl: avatarUrl ?? null, language: language || "en" });

  await sendVerificationCode(user);

  return {
    pendingVerification: true,
    email: user.email,
    message: "Verification code sent",
  };
}

export async function login(input) {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    throw badRequest("Invalid login payload", "VALIDATION_ERROR");
  }

  const { email, password } = parsed.data;

  const userWithHash = await findUserByEmail(email.trim().toLowerCase());
  if (!userWithHash) {
    throw unauthorized("Invalid email or password", "INVALID_CREDENTIALS");
  }

  const ok = await bcrypt.compare(password, userWithHash.password_hash);
  if (!ok) {
    throw unauthorized("Invalid email or password", "INVALID_CREDENTIALS");
  }

  if (!userWithHash.email_verified_at) {
    await sendVerificationCode(userWithHash);
    throw unauthorized("Please verify your email before logging in. We sent a new code.", "EMAIL_NOT_VERIFIED");
  }

  const user = publicUser(userWithHash);
  const token = signToken(user);

  return { user, token };
}

export async function verifyEmail(input) {
  const parsed = verifyEmailSchema.safeParse(input);
  if (!parsed.success) throw badRequest("Invalid verification payload", "VALIDATION_ERROR");

  const user = await findUserByEmail(parsed.data.email.trim().toLowerCase());
  if (!user) throw badRequest("Invalid or expired code", "INVALID_CODE");

  const row = await getLatestEmailVerificationCode(user.id);
  assertCodeValid(row, parsed.data.code);
  await consumeEmailVerificationCode(row.id);
  const verified = await markUserEmailVerified(user.id);
  const token = signToken(verified);
  return { user: publicUser(verified), token };
}

export async function resendVerification(input) {
  const parsed = emailSchema.safeParse(input);
  if (!parsed.success) throw badRequest("Invalid email", "VALIDATION_ERROR");
  const user = await findUserByEmail(parsed.data.email.trim().toLowerCase());
  if (user && !user.email_verified_at) await sendVerificationCode(user);
  return { ok: true, message: "If that account needs verification, a code was sent." };
}

export async function forgotPassword(input) {
  const parsed = emailSchema.safeParse(input);
  if (!parsed.success) throw badRequest("Invalid email", "VALIDATION_ERROR");
  const user = await findUserByEmail(parsed.data.email.trim().toLowerCase());
  if (user) await sendPasswordResetCode(user);
  return { ok: true, message: "If that account exists, a recovery code was sent." };
}

export async function resetPassword(input) {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) throw badRequest("Invalid reset payload", "VALIDATION_ERROR");
  const user = await findUserByEmail(parsed.data.email.trim().toLowerCase());
  if (!user) throw badRequest("Invalid or expired code", "INVALID_CODE");

  const row = await getLatestPasswordResetCode(user.id);
  assertCodeValid(row, parsed.data.code);
  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  await updateUserPassword(user.id, passwordHash);
  await consumePasswordResetCode(row.id);
  if (!user.email_verified_at) await markUserEmailVerified(user.id);
  return { ok: true, message: "Password updated" };
}
