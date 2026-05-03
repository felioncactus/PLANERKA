import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { conflict, unauthorized, badRequest } from "../utils/httpError.js";
import {
  createUser,
  findUserByEmail,
} from "../repositories/users.repo.js";

const MAX_AVATAR_LEN = 2_000_000; // ~2MB text (data URL). Keeps DB sane.

const avatarSchema = z
  .string()
  .max(MAX_AVATAR_LEN)
  .refine((v) => v.startsWith("data:image/"), { message: "avatar must be a data:image/* URL" });

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be at most 72 characters")
  .regex(/[a-z]/, "Password must include a lowercase letter")
  .regex(/[A-Z]/, "Password must include an uppercase letter")
  .regex(/\d/, "Password must include a number")
  .regex(/[^A-Za-z0-9]/, "Password must include a symbol");

const registerSchema = z.object({
  email: z.string().email().max(255),
  password: passwordSchema,
  name: z.string().min(1).max(100),
  avatarUrl: avatarSchema.optional().nullable(),
  language: z.enum(["en", "ru", "ko", "kk", "uz"]).optional(),
});

const loginSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(1).max(72),
});

function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatar_url: user.avatar_url ?? null,
    language: user.language || "en",
    created_at: user.created_at,
    updated_at: user.updated_at,
  };
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

  const token = signToken(user);

  return { user: publicUser(user), token };
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

  const user = publicUser(userWithHash);
  const token = signToken(user);

  return { user, token };
}
