# Waypoint

An AI travel planner MVP. The whole app is a persistent chat thread: onboard once, then describe
a trip and keep pulling recommendations from the same conversation.

## Stack

- Vite + React + TypeScript
- Tailwind CSS v4
- React Router (`/`, `/trip/:tripId`, `/welcome`)
- Zustand for profile/chat state (persisted to `localStorage`)
- lucide-react icons

## Running locally

```bash
npm install
npm run dev
```

Open the printed local URL. First run goes through onboarding at `/welcome`; after that you land
straight in the chat thread.

## What's mocked

No backend or real API keys are wired up yet:

- `src/mocks/destinations.ts` — sample itineraries for Rome, Lisbon, and Kyoto, plus canned
  follow-up suggestions (vegan restaurant, evening event, alternative sight) per destination.
- `src/lib/chatService.ts` — `getAssistantReply()` does keyword matching over the mock data with
  a simulated delay. Clearly commented as the seam where a real Claude API call would go (full
  chat history + trip state resent every turn, since the Messages API is stateless).
- `src/lib/bookingService.ts` — `getBookingUrl()` returns plausible, non-functional deep links for
  GetYourGuide/Airbnb/Booking.com. Booking modals are mocked "widget" frames (GetYourGuide,
  Booking.com) or an honest hand-off card (Airbnb, which has no partner widget).

## Project structure

```
src/
  components/   ChatThread, MessageBubble, Composer, QuickPrompts, TypingIndicator,
                PlaceCard, DayCard, StayCard, PlaceDetailSheet, BookingModal, onboarding/
  screens/      OnboardingScreen, ChatScreen
  lib/          chatService.ts, bookingService.ts, onboardingOptions.ts
  mocks/        destinations.ts
  store/        profileStore.ts, chatStore.ts
  types.ts
```
