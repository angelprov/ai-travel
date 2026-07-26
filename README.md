# Waypoint

An AI travel planner with real accounts. Sign up, onboard once, then plan any number of trips —
each with its own persistent chat thread and always-visible, live itinerary panel next to it. Edit
an itinerary by chatting or by tapping swap/remove on any card, and it's saved to your account as
you go. A bottom-tab (mobile) / sidebar (desktop) nav shell ties it together: **Home** (continue
your most recent trip, or start a new one), **Trips** (full history), **Stays** (a rollup of every
trip's accommodation), and **Profile** (account + preferences).

## Stack

**Client** (`/`)
- Vite + React + TypeScript
- Tailwind CSS v4 — clean, minimal palette (neutral surfaces, a single indigo accent), Inter
  throughout (see `src/index.css`)
- React Router: `/login`, `/welcome`, then behind an `AppShell` layout —
  `/home`, `/trips`, `/trips/:tripId` (chat + itinerary for one trip), `/stays`, `/profile`
- Zustand for auth/profile/trips/chat state, hydrated from the server on load (no localStorage)
- lucide-react icons

**Server** (`/server`)
- Node + Express + TypeScript
- Prisma + SQLite for real persistence (users, profiles, trips, chat history) — swap the
  datasource to Postgres for production, same schema. A user can have many trips; each trip owns
  its own itinerary and chat history (`Trip`, scoped by `userId`; `ChatMessage`, scoped by
  `tripId`)
- Session auth: bcrypt password hashing + a JWT in an httpOnly cookie
- AI itinerary generation via [OpenRouter](https://openrouter.ai/) (an OpenAI-compatible gateway
  in front of many models, including Claude) — optional, falls back to a mock intent engine
  bounded to 3 sample destinations when no key is set
- Real weather (OpenWeatherMap) and real dated event listings (Ticketmaster) when keys are set

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
characters), which goes through onboarding once, then into `/home`. Tap "New trip" to create one
and start chatting. Log out and back in (or reload) and everything — profile, every trip, full
per-trip chat history — is exactly as you left it, loaded from the database.

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
since the whole point of an earlier pass was real accounts. AI/weather/events are real *when a key
is set*, each with a graceful mock fallback behind the same interface. See `server/.env.example`.

- **Accounts** (`server/src/routes/auth.ts`, `server/src/lib/auth.ts`) — real signup/login/logout,
  bcrypt-hashed passwords, JWT session cookie (httpOnly, not readable by client JS).
  `POST /api/trips/:tripId/chat` is server-authoritative: the client only ever sends the new
  message text — trip identity comes from the validated `:tripId` path param, and the profile and
  that trip's history are loaded from the database by the authenticated user's id, never trusted
  from the request body.
- **Chat + itinerary generation/edits** (`server/src/services/aiService.ts`) — with
  `OPENROUTER_API_KEY` set, every turn is sent to a real model via OpenRouter with the full
  conversation history + current trip state (the underlying API is stateless, so everything is
  resent each call), using structured tool calls to decide what to do. Itinerary generation is
  **not** bound to a fixed destination list — the model invents a full, real-sounding itinerary
  (day-by-day places + a stay) for wherever the traveler names, and swap/add-day generate new
  content the same way rather than pulling from static data. Those mutations are applied via
  `server/src/lib/tripMutations.ts`'s generic primitives (`replacePlaceAt`, `appendDay`), the same
  ones the mock path's fixed-destination wrappers (`swapPlace`, `addExtraDay`) call internally — so
  both paths mutate a trip identically regardless of where the content came from. Each trip is its
  own isolated database record now (`Trip.userId` is no longer unique, `ChatMessage.tripId` scopes
  history per-trip) — a full rebuild via chat only ever replaces *that* trip's itinerary, and the
  model is steered to point travelers at the "New trip" action instead of overwriting the current
  trip when they name a different destination (`aiService.ts`'s system prompt). No key → falls back
  to `server/src/lib/intentEngine.ts`, a keyword-based mock limited to Rome/Lisbon/Kyoto.
- **Weather** (`server/src/services/weatherService.ts`) — with `WEATHER_API_KEY` set, calls
  OpenWeatherMap's forecast API for the actual destination. No key → deterministic mock forecast.
- **Live events** (`server/src/services/eventsService.ts`) — with `EVENTS_API_KEY` set, calls the
  Ticketmaster Discovery API for real, dated listings (coverage skews North America/Europe). This
  is the one place real data matters most: an LLM can't know what's actually happening on a future
  date, so the AI chat path prefers a live listing over its own invented suggestion whenever one's
  available (`aiService.ts`'s `suggest_event` handling). No key → falls back to filtering the mock
  destination's own places by time of day, which is only sensible for Rome/Lisbon/Kyoto — so the AI
  path skips that fallback for any other destination rather than showing the wrong city's mock data.
- **Bookings** (`src/lib/bookingService.ts`) — `getBookingUrl()` returns plausible, non-functional
  deep links for GetYourGuide/Airbnb/Booking.com. Booking modals are mocked "widget" frames
  (GetYourGuide, Booking.com) or an honest hand-off card (Airbnb, which has no partner widget). Real
  Ticketmaster events route to "Save to itinerary" rather than the GetYourGuide flow, since there's
  no Ticketmaster checkout integration.
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

## Visual system

Clean, minimal, chat-app style: neutral surfaces (`--color-surface`, `--color-card`), a single
indigo accent (`--color-accent`) for primary actions and highlights, Inter throughout, no
monospace/uppercase-label motif. All tokens live in `src/index.css`'s `@theme` block — that's the
one place to retheme.

## Project structure

```
src/
  components/   AppShell (nav shell: bottom tabs on mobile, sidebar on desktop),
                ChatThread, MessageBubble, Composer, QuickPrompts, TypingIndicator,
                PlaceCard, DayCard, StayCard, PlaceDetailSheet, BookingModal,
                PlaceMedia, MediaLightbox, ItineraryPanel, onboarding/
  screens/      AuthScreen, OnboardingScreen, HomeScreen, TripsScreen, StaysScreen,
                ProfileScreen, ChatScreen (one trip's chat + itinerary split view)
  lib/          authService.ts, profileService.ts, chatService.ts, tripsService.ts,
                bookingService.ts, weatherService.ts, eventsService.ts, apiClient.ts,
                placeVisuals.ts, onboardingOptions.ts
  store/        authStore.ts, profileStore.ts, tripsStore.ts, chatStore.ts (trip-scoped:
                loadTrip(tripId) fetches on navigate rather than caching every trip)
  types.ts

server/
  prisma/       schema.prisma, migrations/
  src/
    routes/      auth.ts, profile.ts, trips.ts (list/create/get/delete a trip, plus
                 GET/POST /api/trips/:tripId/chat), weather.ts, events.ts
    services/    aiService.ts, weatherService.ts, eventsService.ts
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
