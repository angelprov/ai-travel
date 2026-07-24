import { Router } from "express";
import type { ChatRequestBody } from "../types.js";
import { getClaudeReply } from "../services/claudeService.js";

export const chatRouter = Router();

chatRouter.post("/", async (req, res) => {
  const body = req.body as Partial<ChatRequestBody>;

  if (!body || typeof body.message !== "string" || !body.profile) {
    res.status(400).json({ error: "message and profile are required" });
    return;
  }

  try {
    const reply = await getClaudeReply(body.message, body.trip ?? null, body.history ?? [], body.profile);
    res.json(reply);
  } catch (error) {
    console.error("[chatRouter] failed to produce a reply:", error);
    res.status(200).json({
      text: "Sorry, I hit a snag putting that together. Could you try again?",
      isError: true,
    });
  }
});
