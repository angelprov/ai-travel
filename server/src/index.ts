import "dotenv/config";
import express from "express";
import cors from "cors";
import { chatRouter } from "./routes/chat.js";
import { weatherRouter } from "./routes/weather.js";
import { eventsRouter } from "./routes/events.js";

const app = express();
const PORT = Number(process.env.PORT ?? 8787);

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true, claudeConfigured: Boolean(process.env.ANTHROPIC_API_KEY) });
});

app.use("/api/chat", chatRouter);
app.use("/api/weather", weatherRouter);
app.use("/api/events", eventsRouter);

app.listen(PORT, () => {
  console.log(`Waypoint server listening on http://localhost:${PORT}`);
});
