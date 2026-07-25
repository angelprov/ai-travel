import "dotenv/config";
import express from "express";
import type { ErrorRequestHandler } from "express";
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

// CORS allowlist. Beyond the configured web CLIENT_URL, this always allows
// Capacitor's native WebView origins so the iOS/Android app shells work
// out of the box:
//   - capacitor://localhost — iOS, bundled production build
//   - http://localhost      — Android, bundled production build
// Note: a *bundled* native build's origin is a different scheme than this
// API (capacitor:// vs http://), so SameSite=Lax session cookies won't
// cross that boundary — for local development, run the native shell in
// Capacitor's live-reload mode instead (CAP_SERVER_URL, see
// capacitor.config.ts), which points the WebView at this same Vite dev
// server origin and keeps cookie auth working exactly like the web app.
// A bundled native build talking to a real deployed backend will need
// SameSite=None; Secure over HTTPS, or a token-based auth scheme.
const ALWAYS_ALLOWED_ORIGINS = new Set([CLIENT_URL, "capacitor://localhost", "http://localhost", "https://localhost"]);

// Extra origins (e.g. your Mac's LAN IP, for testing on a physical device),
// comma-separated: CORS_EXTRA_ORIGINS=http://192.168.1.23:5173
for (const origin of (process.env.CORS_EXTRA_ORIGINS ?? "").split(",").map((o) => o.trim()).filter(Boolean)) {
  ALWAYS_ALLOWED_ORIGINS.add(origin);
}

app.use(
  cors({
    origin(origin, callback) {
      // Requests with no Origin header (curl, health checks, native fetch
      // in some configurations) aren't a CORS concern — allow them through.
      if (!origin || ALWAYS_ALLOWED_ORIGINS.has(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);
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

const handleError: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof Error && err.message === "Not allowed by CORS") {
    res.status(403).json({ error: "Origin not allowed" });
    return;
  }
  console.error("[server] unhandled error:", err);
  res.status(500).json({ error: "Something went wrong" });
};
app.use(handleError);

app.listen(PORT, () => {
  console.log(`Waypoint server listening on http://localhost:${PORT}`);
  if (usingFallbackJwtSecret) {
    console.warn(
      "[auth] JWT_SECRET is not set — using an insecure dev-only fallback. Set JWT_SECRET before deploying anywhere real.",
    );
  }
});
