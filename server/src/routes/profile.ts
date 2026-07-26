import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/requireAuth.js";
import { saveProfile } from "../repositories/profileRepo.js";

export const profileRouter = Router();

const profileSchema = z.object({
  name: z.string().trim().min(1).max(80),
  interests: z
    .array(z.enum(["food", "history", "nature", "art", "nightlife", "shopping", "relaxation", "adventure"]))
    .max(20),
  pace: z.enum(["relaxed", "balanced", "packed"]),
  budget: z.enum(["budget", "mid-range", "luxury"]),
  dietary: z.array(z.string()).max(20),
  subscribed: z.boolean(),
  onboardingComplete: z.boolean(),
});

profileRouter.put("/", requireAuth, async (req, res) => {
  const parsed = profileSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid profile payload." });
    return;
  }

  const result = await saveProfile(req.userId!, parsed.data);
  res.json(result);
});
