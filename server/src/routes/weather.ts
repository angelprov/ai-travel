import { Router } from "express";
import { getForecast } from "../services/weatherService.js";

export const weatherRouter = Router();

weatherRouter.get("/", async (req, res) => {
  const destinationId = String(req.query.destinationId ?? "");
  const date = String(req.query.date ?? "");

  if (!destinationId || !date) {
    res.status(400).json({ error: "destinationId and date query params are required" });
    return;
  }

  const forecast = await getForecast(destinationId, date);
  res.json(forecast);
});
