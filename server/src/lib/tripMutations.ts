import type { Day, Place, Trip } from "../types.js";
import { destinations, findDestinationById, findDestinationByMessage, type Destination } from "../mocks/destinations.js";

// ---------------------------------------------------------------------------
// Pure trip-mutation helpers. Two layers here:
//   - Generic primitives (replacePlaceAt, appendDay) that apply *any*
//     replacement/new-day content to a trip, regardless of where that
//     content came from.
//   - Mock-data-backed wrappers (swapPlace, addExtraDay) used by the
//     keyword-based intent engine fallback, which pull their content from
//     the fixed mock destination followups.
// The real AI path (aiService.ts) calls the generic primitives directly
// with LLM-generated content instead, for any destination — not just the
// three mocked ones. Both paths mutate a trip the exact same way, so the
// itinerary panel and chat bubbles never have to know which one ran.
// ---------------------------------------------------------------------------

const STOP_WORDS = new Set([
  "the",
  "of",
  "and",
  "at",
  "in",
  "a",
  "an",
  "al",
  "da",
  "di",
  "la",
  "le",
  "for",
]);

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function significantWords(name: string): string[] {
  return normalize(name)
    .split(" ")
    .filter((word) => word.length >= 4 && !STOP_WORDS.has(word));
}

export interface PlaceMatch {
  day: Day;
  place: Place;
  score: number;
}

/** Fuzzy-finds the itinerary place a free-text message is most likely referring to. */
export function findPlaceByQuery(trip: Trip, query: string): PlaceMatch | null {
  const normalizedQuery = normalize(query);
  let best: PlaceMatch | null = null;

  for (const day of trip.days) {
    for (const place of day.places) {
      const words = significantWords(place.name);
      const score = words.filter((word) => normalizedQuery.includes(word)).length;
      if (score > 0 && (!best || score > best.score)) {
        best = { day, place, score };
      }
    }
  }

  return best;
}

function getDestinationForTrip(trip: Trip): Destination {
  return findDestinationById(trip.destinationId);
}

function cloneTrip(trip: Trip): Trip {
  return { ...trip, days: trip.days.map((day) => ({ ...day, places: [...day.places] })) };
}

function addOneDay(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00`);
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
}

export function generateTrip(messageOrDestinationId: string): Trip {
  const byId = destinations.find((destination) => destination.id === messageOrDestinationId);
  const destination = byId ?? findDestinationByMessage(messageOrDestinationId);
  return destination.buildTrip();
}

// --- Generic primitives -----------------------------------------------

export interface ReplaceResult {
  trip: Trip;
  day: Day;
  removed: Place;
  added: Place;
}

/** Replaces the place at [dayId, placeId] with `replacement`, keeping the original's date/timeSlot unless the replacement specifies its own. */
export function replacePlaceAt(trip: Trip, dayId: string, placeId: string, replacement: Omit<Place, "id">): ReplaceResult {
  const next = cloneTrip(trip);
  const day = next.days.find((d) => d.id === dayId)!;
  const index = day.places.findIndex((p) => p.id === placeId);
  const removed = day.places[index];

  const added: Place = {
    ...replacement,
    id: `${trip.id}-swap-${Date.now()}`,
    date: replacement.date ?? removed.date,
    timeSlot: replacement.timeSlot ?? removed.timeSlot,
  };
  day.places[index] = added;

  return { trip: next, day, removed, added };
}

export interface NewDayInput {
  label: string;
  date?: string;
  places: Omit<Place, "id">[];
}

/** Appends a new day, defaulting its date to one day after the trip's current last day. */
export function appendDay(trip: Trip, input: NewDayInput): { trip: Trip; day: Day } {
  const lastDay = trip.days[trip.days.length - 1];
  const nextDate = input.date ?? (lastDay ? addOneDay(lastDay.date) : trip.startDate);

  const day: Day = {
    id: `${trip.id}-day-${trip.days.length + 1}`,
    dayNumber: trip.days.length + 1,
    date: nextDate,
    label: input.label,
    places: input.places.map((place, index) => ({
      ...place,
      id: `${trip.id}-extra-${Date.now()}-${index}`,
      date: place.date ?? nextDate,
    })),
  };

  const next = cloneTrip(trip);
  next.days.push(day);
  next.endDate = nextDate;

  return { trip: next, day };
}

// --- Mock-data-backed wrappers (used by the keyword intent engine) -----

export interface SwapResult {
  trip: Trip;
  matchedExisting: boolean;
  day?: Day;
  removed?: Place;
  added: Place;
}

/** Replaces a named place in-place with the destination's alternative suggestion. */
export function swapPlace(trip: Trip, query: string): SwapResult {
  const destination = getDestinationForTrip(trip);
  const alternative = destination.followups.alternativeSight;
  const match = findPlaceByQuery(trip, query);

  if (!match) {
    return { trip, matchedExisting: false, added: { ...alternative, id: `${trip.id}-swap-${Date.now()}` } };
  }

  const result = replacePlaceAt(trip, match.day.id, match.place.id, alternative);
  return { trip: result.trip, matchedExisting: true, day: result.day, removed: result.removed, added: result.added };
}

export interface RemoveResult {
  trip: Trip;
  day?: Day;
  removed?: Place;
}

export function removePlace(trip: Trip, query: string): RemoveResult {
  const match = findPlaceByQuery(trip, query);
  if (!match) return { trip };

  const next = cloneTrip(trip);
  const day = next.days.find((d) => d.id === match.day.id)!;
  day.places = day.places.filter((p) => p.id !== match.place.id);

  return { trip: next, day, removed: match.place };
}

export interface AddDayResult {
  trip: Trip;
  day: Day;
}

/** Appends a "free exploration" day built from the destination's unused follow-up suggestions. */
export function addExtraDay(trip: Trip): AddDayResult {
  const destination = getDestinationForTrip(trip);
  const nextDate = trip.days[trip.days.length - 1] ? addOneDay(trip.days[trip.days.length - 1].date) : trip.startDate;

  return appendDay(trip, {
    label: "Free Exploration",
    date: nextDate,
    places: [
      { ...destination.followups.alternativeSight, timeSlot: "Morning" },
      { ...destination.followups.veganRestaurant, timeSlot: "13:00" },
      { ...destination.followups.eveningEvent, timeSlot: "Evening" },
    ],
  });
}
