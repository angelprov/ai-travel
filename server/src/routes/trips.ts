import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/requireAuth.js";
import { getAiReply } from "../services/aiService.js";
import { getProfile } from "../repositories/profileRepo.js";
import {
  createTrip,
  deleteTrip,
  getTripById,
  listTrips,
  saveTrip,
} from "../repositories/tripRepo.js";
import { appendMessage, getMessages } from "../repositories/chatRepo.js";
import type { ChatRequestBody } from "../types.js";

export const tripsRouter = Router();

tripsRouter.use(requireAuth);

tripsRouter.get("/", async (req, res) => {
  const trips = await listTrips(req.userId!);
  res.json({ trips });
});

const createTripSchema = z.object({
  destination: z.string().trim().max(200).optional(),
  destinationId: z.string().trim().max(200).optional(),
  startDate: z.string().trim().max(20).optional(),
  endDate: z.string().trim().max(20).optional(),
  travelerCount: z.number().int().min(1).max(20).optional(),
});

tripsRouter.post("/", async (req, res) => {
  const parsed = createTripSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid trip payload." });
    return;
  }

  const trip = await createTrip(req.userId!, parsed.data);
  res.status(201).json({ trip });
});

tripsRouter.get("/:tripId", async (req, res) => {
  const trip = await getTripById(req.userId!, req.params.tripId);
  if (!trip) {
    res.status(404).json({ error: "Trip not found" });
    return;
  }
  res.json({ trip });
});

tripsRouter.delete("/:tripId", async (req, res) => {
  await deleteTrip(req.userId!, req.params.tripId);
  res.json({ ok: true });
});

tripsRouter.get("/:tripId/chat", async (req, res) => {
  const trip = await getTripById(req.userId!, req.params.tripId);
  if (!trip) {
    res.status(404).json({ error: "Trip not found" });
    return;
  }
  const messages = await getMessages(req.params.tripId);
  res.json({ messages });
});

// Server-authoritative: the client only sends the new message text. Trip
// identity comes from the validated :tripId path param (never a
// client-supplied body field), and profile/history are loaded from the
// database by the authenticated user's id — never trusted from the request
// body. This closes an obvious tamper vector and means every device a user
// logs into sees the same live itinerary and history.
tripsRouter.post("/:tripId/chat", async (req, res) => {
  const body = req.body as Partial<ChatRequestBody>;

  if (!body || typeof body.message !== "string" || !body.message.trim()) {
    res.status(400).json({ error: "message is required" });
    return;
  }

  const userId = req.userId!;
  const tripId = req.params.tripId;

  try {
    const [{ profile }, trip, history] = await Promise.all([
      getProfile(userId),
      getTripById(userId, tripId),
      getMessages(tripId),
    ]);

    if (!trip) {
      res.status(404).json({ error: "Trip not found" });
      return;
    }

    await appendMessage(userId, tripId, { role: "user", text: body.message });

    const reply = await getAiReply(body.message, trip, history, profile);
    const updatedTrip = reply.trip ? await saveTrip(userId, tripId, reply.trip) : trip;

    await appendMessage(userId, tripId, {
      role: "assistant",
      text: reply.text,
      status: reply.isError ? "error" : "sent",
      attachments: reply.attachments,
    });

    res.json({ ...reply, trip: updatedTrip });
  } catch (error) {
    console.error("[tripsRouter] failed to produce a reply:", error);
    res.status(200).json({
      text: "Sorry, I hit a snag putting that together. Could you try again?",
      isError: true,
    });
  }
});
