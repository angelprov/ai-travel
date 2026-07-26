import { Router } from "express";
import { getForecast } from "../services/weatherService.js";

export const weatherRouter = Router();

weatherRouter.get("/", async (req, res) => {
  const destination = String(req.query.destination ?? "");
  const date = String(req.query.date ?? "");

  if (!destination || !date) {
    res.status(400).json({ error: "destination and date query params are required" });
    return;
  }

  const forecast = await getForecast(destination, date);
  res.json(forecast);
});
