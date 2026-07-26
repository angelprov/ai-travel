import { Router } from "express";
import { getLiveEvents } from "../services/eventsService.js";

export const eventsRouter = Router();

eventsRouter.get("/", async (req, res) => {
  const destinationId = String(req.query.destinationId ?? "");
  const destination = String(req.query.destination ?? "");
  const date = String(req.query.date ?? "");
  const hour = req.query.hour !== undefined ? Number(req.query.hour) : undefined;

  if (!destinationId || !destination || !date) {
    res.status(400).json({ error: "destinationId, destination, and date query params are required" });
    return;
  }

  const result = await getLiveEvents(destinationId, destination, date, hour);
  res.json({ destinationId, date, events: result.events, source: result.source });
});
