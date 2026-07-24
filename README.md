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
```

## Deploying for real

Not done yet, but the pieces are in place: swap `prisma/schema.prisma`'s datasource to
`postgresql` + a `DATABASE_URL`, set a real `JWT_SECRET`, set `CLIENT_URL` to your deployed
frontend's origin, and the cookie's `secure` flag already turns on automatically under
`NODE_ENV=production`.
