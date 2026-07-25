import { Router } from "express";
import type { ChatRequestBody } from "../types.js";
import { getAiReply } from "../services/aiService.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { getProfile } from "../repositories/profileRepo.js";
import { getTrip, saveTrip } from "../repositories/tripRepo.js";
import { appendMessage, getMessages } from "../repositories/chatRepo.js";

export const chatRouter = Router();

// Server-authoritative: the client only sends the new message text. Trip,
// profile, and conversation history are all loaded from the database by
// the authenticated user's id, never trusted from the request body — that
// both closes an obvious tamper vector and means every device a user logs
// into sees the same live itinerary and history.
chatRouter.post("/", requireAuth, async (req, res) => {
  const body = req.body as Partial<ChatRequestBody>;

  if (!body || typeof body.message !== "string" || !body.message.trim()) {
    res.status(400).json({ error: "message is required" });
    return;
  }

  const userId = req.userId!;

  try {
    const [{ profile }, trip, history] = await Promise.all([
      getProfile(userId),
      getTrip(userId),
      getMessages(userId),
    ]);

    await appendMessage(userId, { role: "user", text: body.message });

    const reply = await getAiReply(body.message, trip, history, profile);
    const updatedTrip = reply.trip ? await saveTrip(userId, reply.trip) : trip;

    await appendMessage(userId, {
      role: "assistant",
      text: reply.text,
      status: reply.isError ? "error" : "sent",
      attachments: reply.attachments,
    });

    res.json({ ...reply, trip: updatedTrip });
  } catch (error) {
    console.error("[chatRouter] failed to produce a reply:", error);
    res.status(200).json({
      text: "Sorry, I hit a snag putting that together. Could you try again?",
      isError: true,
    });
  }
});
