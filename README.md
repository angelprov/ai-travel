# Waypoint

An AI travel planner with real accounts. Sign up, onboard once, then describe a trip in a
persistent chat thread with an always-visible, live itinerary panel next to it — edit it by
chatting or by tapping swap/remove on any card, and it's saved to your account as you go.

## Stack

**Client** (`/`)
- Vite + React + TypeScript
- Tailwind CSS v4
- React Router (`/login`, `/welcome`, `/`, `/trip/:tripId`)
- Zustand for auth/profile/chat state, hydrated from the server on load (no localStorage)
- lucide-react icons

**Server** (`/server`)
- Node + Express + TypeScript
- Prisma + SQLite for real persistence (users, profiles, trips, chat history) — swap the
  datasource to Postgres for production, same schema
- Session auth: bcrypt password hashing + a JWT in an httpOnly cookie
- `@anthropic-ai/sdk` for real Claude-driven replies (optional — falls back to a mock intent
  engine when no API key is set)

**iOS** (`/ios`)
- [Capacitor](https://capacitorjs.com/) wraps the same client app in a native WebView shell — no
  separate mobile codebase. Real Xcode project, installable on Simulator or a physical device.

## Running locally

```bash
npm install        # installs client deps, then server deps via postinstall
npm run dev         # runs client (5173) and server (8787) together
```

The first `npm install` in `server/` also needs a database. If you're setting this up fresh:

```bash
cd server
npx prisma migrate dev   # creates prisma/dev.db and applies migrations
```

Open the printed client URL — you'll land on `/login`. Sign up with any email/password (8+
characters), which goes through onboarding once, then into the chat + itinerary view. Log out and
back in (or reload) and everything — profile, trip, full chat history — is exactly as you left it,
loaded from the database.

## Running on iOS (Simulator)

The app is wrapped for iOS with [Capacitor](https://capacitorjs.com/) (`ios/` is a real Xcode
project, `capacitor.config.ts` is the bridge config) — no separate mobile codebase, it's the same
`src/` running inside a native WebView shell.

**Prerequisites:** Xcode installed, and the usual `npm install` from "Running locally" above.

For local development, run the app against the Vite dev server (not a bundled build) so you get
the same hot-reload loop as the web app, and — importantly — so login actually works (see the CORS
note below):

```bash
npm run dev              # client (5173) + server (8787), same as web dev
npm run ios:sync:dev     # points the native shell at http://localhost:5173 and syncs it in
npm run ios:open         # opens ios/App/App.xcodeproj in Xcode
```

In Xcode, pick an iOS Simulator from the scheme/device dropdown (top bar) and hit **Run** (▶). The
Simulator shares your Mac's network stack, so `localhost` inside it reaches your Mac's dev server
directly — no IP juggling needed for the Simulator specifically.

**Why `ios:sync:dev` matters, not just convenience:** a *bundled* Capacitor build (the default,
production-style `npm run ios:sync`) loads the app from the `capacitor://localhost` scheme, which
is a different origin than `http://localhost:8787` — and our session cookie is `SameSite=Lax`,
which doesn't cross scheme boundaries on API calls. Live-reload mode instead points the WebView
directly at `http://localhost:5173`, the *same* origin the web app already uses, so cookie auth
works exactly as it does in a browser tab. A bundled build talking to a real deployed backend will
need `SameSite=None; Secure` over HTTPS (or a token-based auth scheme) — not set up yet, since that
depends on where/how you deploy.

**Testing on a physical iPhone instead of the Simulator:** it doesn't share your Mac's `localhost`,
so you'll need your Mac's LAN IP instead: set `CAP_SERVER_URL=http://<your-mac-ip>:5173` for the
sync step, `CORS_EXTRA_ORIGINS=http://<your-mac-ip>:5173` in `server/.env`, and
`VITE_API_URL=http://<your-mac-ip>:8787` in a root `.env`. Not tested yet — worth a pass together
before you rely on it.

Whenever you change anything under `src/`, just re-run `npm run ios:sync:dev` and hit Run again in
Xcode (or use Xcode's own re-run — the WebView is pulling live from Vite, so most changes hot-reload
without even needing that).

## What's real vs. mocked

Auth and persistence are real and required — there's no offline/localStorage fallback anymore,
since the whole point of this pass was real accounts. Everything else has a realistic mock behind
the same interface a real provider would use, and needs no keys to run. See `server/.env.example`.

- **Accounts** (`server/src/routes/auth.ts`, `server/src/lib/auth.ts`) — real signup/login/logout,
  bcrypt-hashed passwords, JWT session cookie (httpOnly, not readable by client JS). `/api/chat` is
  server-authoritative: the client only ever sends the new message text — profile, trip, and
  history are loaded from the database by the authenticated user's id, never trusted from the
  request body.
- **Chat + itinerary edits** (`server/src/services/claudeService.ts`) — with `ANTHROPIC_API_KEY`
  set, every turn is sent to Claude with the full conversation history + current trip state (the
  Messages API is stateless, so everything is resent each call) using tool-use to get back a
  structured `{ reply, action, target }`. That action is applied via
  `server/src/lib/tripMutations.ts` — the same swap/remove/add-day/generate helpers the mock path
  uses, so both produce identically-shaped itinerary edits, and both get persisted to the database
  the same way. No key → falls back to `server/src/lib/intentEngine.ts`, a keyword-based mock that
  performs the same real mutations.
- **Weather** (`server/src/services/weatherService.ts`) — deterministic mock forecast per
  destination/date. `WEATHER_API_KEY` hand-off point documented inline (e.g. OpenWeatherMap).
- **Live events** (`server/src/services/eventsService.ts`) — filters the mock destination data by
  time-of-day ("what's on tonight" actually checks opening hours). `EVENTS_API_KEY` hand-off point
  documented inline.
- **Bookings** (`src/lib/bookingService.ts`) — `getBookingUrl()` returns plausible, non-functional
  deep links for GetYourGuide/Airbnb/Booking.com. Booking modals are mocked "widget" frames
  (GetYourGuide, Booking.com) or an honest hand-off card (Airbnb, which has no partner widget).
- **Payments** — Waypoint Plus is still just a `subscribed` boolean set from the onboarding
  paywall, now persisted to your account. No Stripe integration yet.
- **Activity/event media** (`src/lib/placeVisuals.ts`, `PlaceMedia`, `MediaLightbox`) — deterministic
  on-brand gradient "photos" per place (no external image APIs), with a mock video-preview
  lightbox (play/pause, no real video file) for activities and events.

## Editing the itinerary

Every edit — whether typed in the composer or tapped as a Swap/Remove button on a card in the
itinerary panel — goes through the same `sendMessage()` chat pipeline, so the conversation log and
the live itinerary panel never disagree, and both are saved to your account. Supported edit
intents: swap a named place, remove a named place, add another day, ask about weather, ask for
food/tonight suggestions, resurface the stay.

## Project structure

```
src/
  components/   ChatThread, MessageBubble, Composer, QuickPrompts, TypingIndicator,
                PlaceCard, DayCard, StayCard, PlaceDetailSheet, BookingModal,
                PlaceMedia, MediaLightbox, ItineraryPanel, onboarding/
  screens/      AuthScreen, OnboardingScreen, ChatScreen (split view: chat + itinerary panel)
  lib/          authService.ts, profileService.ts, chatService.ts, bookingService.ts,
                weatherService.ts, eventsService.ts, apiClient.ts, placeVisuals.ts,
                onboardingOptions.ts
  store/        authStore.ts, profileStore.ts, chatStore.ts
  types.ts

server/
  prisma/       schema.prisma, migrations/
  src/
    routes/      auth.ts, profile.ts, chat.ts, weather.ts, events.ts
    services/    claudeService.ts, weatherService.ts, eventsService.ts
    repositories/ profileRepo.ts, tripRepo.ts, chatRepo.ts (DB row <-> domain type mapping)
    lib/         auth.ts, intentEngine.ts, tripMutations.ts
    middleware/  requireAuth.ts
    db/          client.ts (Prisma singleton)
    mocks/       destinations.ts
    types.ts

capacitor.config.ts   iOS/Android bridge config (webDir, live-reload server.url)
ios/                  Generated Xcode project — open ios/App/App.xcodeproj
```

## Deploying for real

Not done yet, but the pieces are in place: swap `prisma/schema.prisma`'s datasource to
`postgresql` + a `DATABASE_URL`, set a real `JWT_SECRET`, set `CLIENT_URL` to your deployed
frontend's origin, and the cookie's `secure` flag already turns on automatically under
`NODE_ENV=production`.
