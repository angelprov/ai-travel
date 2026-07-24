import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { chatRouter } from "./routes/chat.js";
import { weatherRouter } from "./routes/weather.js";
import { eventsRouter } from "./routes/events.js";
import { authRouter } from "./routes/auth.js";
import { profileRouter } from "./routes/profile.js";
import { usingFallbackJwtSecret } from "./lib/auth.js";

const app = express();
const PORT = Number(process.env.PORT ?? 8787);
const CLIENT_URL = process.env.CLIENT_URL ?? "http://localhost:5173";

app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true, claudeConfigured: Boolean(process.env.ANTHROPIC_API_KEY) });
});

app.use("/api/auth", authRouter);
app.use("/api/profile", profileRouter);
app.use("/api/chat", chatRouter);
app.use("/api/weather", weatherRouter);
app.use("/api/events", eventsRouter);

app.listen(PORT, () => {
  console.log(`Waypoint server listening on http://localhost:${PORT}`);
  if (usingFallbackJwtSecret) {
    console.warn(
      "[auth] JWT_SECRET is not set — using an insecure dev-only fallback. Set JWT_SECRET before deploying anywhere real.",
    );
  }
});
