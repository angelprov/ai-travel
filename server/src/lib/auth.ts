import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { CookieOptions } from "express";

// ---------------------------------------------------------------------------
// Password hashing + session tokens. Sessions are a JWT stored in an
// httpOnly cookie (not localStorage) so the token itself is never reachable
// from client-side JS.
// ---------------------------------------------------------------------------

const DEV_FALLBACK_SECRET = "dev-only-local-secret-change-me";
const JWT_SECRET = process.env.JWT_SECRET || DEV_FALLBACK_SECRET;
const TOKEN_TTL_DAYS = 30;

export const AUTH_COOKIE_NAME = "waypoint_session";
export const usingFallbackJwtSecret = JWT_SECRET === DEV_FALLBACK_SECRET;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

interface SessionPayload {
  userId: string;
}

export function signSessionToken(userId: string): string {
  return jwt.sign({ userId } satisfies SessionPayload, JWT_SECRET, { expiresIn: `${TOKEN_TTL_DAYS}d` });
}

export function verifySessionToken(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as SessionPayload;
  } catch {
    return null;
  }
}

export function sessionCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
    path: "/",
  };
}
