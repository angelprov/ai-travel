import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db/client.js";
import { AUTH_COOKIE_NAME, hashPassword, sessionCookieOptions, signSessionToken, verifyPassword } from "../lib/auth.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { getProfile } from "../repositories/profileRepo.js";
import { getTrip } from "../repositories/tripRepo.js";
import { getMessages } from "../repositories/chatRepo.js";
import type { HydrateResponse } from "../types.js";

export const authRouter = Router();

const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(200),
});

async function buildHydrateResponse(userId: string, email: string): Promise<HydrateResponse> {
  const [{ profile, onboardingComplete }, trip, messages] = await Promise.all([
    getProfile(userId),
    getTrip(userId),
    getMessages(userId),
  ]);

  return { user: { id: userId, email }, profile, onboardingComplete, trip, messages };
}

authRouter.post("/signup", async (req, res) => {
  const parsed = credentialsSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Enter a valid email and a password with at least 8 characters." });
    return;
  }

  const { email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    res.status(409).json({ error: "An account with this email already exists." });
    return;
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({ data: { email, passwordHash } });

  res.cookie(AUTH_COOKIE_NAME, signSessionToken(user.id), sessionCookieOptions());
  res.status(201).json(await buildHydrateResponse(user.id, user.email));
});

authRouter.post("/login", async (req, res) => {
  const parsed = credentialsSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Enter a valid email and password." });
    return;
  }

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  const valid = user ? await verifyPassword(password, user.passwordHash) : false;

  if (!user || !valid) {
    res.status(401).json({ error: "Invalid email or password." });
    return;
  }

  res.cookie(AUTH_COOKIE_NAME, signSessionToken(user.id), sessionCookieOptions());
  res.json(await buildHydrateResponse(user.id, user.email));
});

authRouter.post("/logout", (_req, res) => {
  res.clearCookie(AUTH_COOKIE_NAME, sessionCookieOptions());
  res.json({ ok: true });
});

authRouter.get("/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId! } });
  if (!user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  res.json(await buildHydrateResponse(user.id, user.email));
});
