import { Router } from "express";
import { getLiveEvents } from "../services/eventsService.js";

export const eventsRouter = Router();

eventsRouter.get("/", async (req, res) => {
  const destinationId = String(req.query.destinationId ?? "");
  const date = String(req.query.date ?? "");
  const hour = req.query.hour !== undefined ? Number(req.query.hour) : undefined;

  if (!destinationId || !date) {
    res.status(400).json({ error: "destinationId and date query params are required" });
    return;
  }

  const events = await getLiveEvents(destinationId, date, hour);
  res.json({ destinationId, date, events, source: "mock" });
});
