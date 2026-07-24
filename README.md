# Waypoint

An AI travel planner. The whole app is a persistent chat thread with an always-visible, live
itinerary panel next to it: onboard once, describe a trip, then keep editing it — by chatting or
by tapping swap/remove on any card — and watch both sides update together.

## Stack

**Client** (`/`)
- Vite + React + TypeScript
- Tailwind CSS v4
- React Router (`/`, `/trip/:tripId`, `/welcome`)
- Zustand for profile/chat state (persisted to `localStorage`)
- lucide-react icons

**Server** (`/server`)
- Node + Express + TypeScript
- `@anthropic-ai/sdk` for real Claude-driven replies (optional — falls back to a mock intent
  engine when no API key is set)

## Running locally

```bash
npm install        # installs client deps, then server deps via postinstall
npm run dev         # runs client (5173) and server (8787) together
```

Open the printed client URL. First run goes through onboarding at `/welcome`; after that you land
straight in the chat thread with the itinerary panel beside it (a swipeable tab on mobile).

The client works even if you skip starting the server — `chatService.ts` falls back to local mock
logic on any network error, though you'll lose live weather/events and the richer edit intents.

## What's real vs. mocked

Nothing requires API keys to run — every integration point has a working mock behind the same
interface a real provider would use. See `server/.env.example`.

- **Chat + itinerary edits** (`server/src/services/claudeService.ts`) — with `ANTHROPIC_API_KEY`
  set, every turn is sent to Claude with the full conversation history + current trip state (the
  Messages API is stateless, so everything is resent each call) using tool-use to get back a
  structured `{ reply, action, target }`. That action is applied via
  `server/src/lib/tripMutations.ts` — the same swap/remove/add-day/generate helpers the mock path
  uses, so both produce identically-shaped itinerary edits. No key → falls back to
  `server/src/lib/intentEngine.ts`, a keyword-based mock that performs the same real mutations.
- **Weather** (`server/src/services/weatherService.ts`) — deterministic mock forecast per
  destination/date. `WEATHER_API_KEY` hand-off point documented inline (e.g. OpenWeatherMap).
- **Live events** (`server/src/services/eventsService.ts`) — filters the mock destination data by
  time-of-day ("what's on tonight" actually checks opening hours). `EVENTS_API_KEY` hand-off point
  documented inline.
- **Bookings** (`src/lib/bookingService.ts`) — `getBookingUrl()` returns plausible, non-functional
  deep links for GetYourGuide/Airbnb/Booking.com. Booking modals are mocked "widget" frames
  (GetYourGuide, Booking.com) or an honest hand-off card (Airbnb, which has no partner widget).
- **Activity/event media** (`src/lib/placeVisuals.ts`, `PlaceMedia`, `MediaLightbox`) — deterministic
  on-brand gradient "photos" per place (no external image APIs), with a mock video-preview
  lightbox (play/pause, no real video file) for activities and events.

## Editing the itinerary

Every edit — whether typed in the composer or tapped as a Swap/Remove button on a card in the
itinerary panel — goes through the same `sendMessage()` chat pipeline, so the conversation log and
the live itinerary panel never disagree. Supported edit intents: swap a named place, remove a named
place, add another day, ask about weather, ask for food/tonight suggestions, resurface the stay.

## Project structure

```
src/
  components/   ChatThread, MessageBubble, Composer, QuickPrompts, TypingIndicator,
                PlaceCard, DayCard, StayCard, PlaceDetailSheet, BookingModal,
                PlaceMedia, MediaLightbox, ItineraryPanel, onboarding/
  screens/      OnboardingScreen, ChatScreen (split view: chat + itinerary panel)
  lib/          chatService.ts, bookingService.ts, weatherService.ts, eventsService.ts,
                apiClient.ts, placeVisuals.ts, onboardingOptions.ts
  mocks/        destinations.ts
  store/        profileStore.ts, chatStore.ts
  types.ts

server/
  src/
    routes/      chat.ts, weather.ts, events.ts
    services/    claudeService.ts, weatherService.ts, eventsService.ts
    lib/         intentEngine.ts, tripMutations.ts
    mocks/       destinations.ts
    types.ts
```
