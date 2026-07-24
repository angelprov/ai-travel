import type { Day, Place, Trip } from "../types.js";
import { destinations, findDestinationById, findDestinationByMessage, type Destination } from "../mocks/destinations.js";

// ---------------------------------------------------------------------------
// Pure trip-mutation helpers. Both the mock intent engine and the real
// Claude tool-use path (claudeService.ts) call these — the only difference
// between the two is *which* mutation to run and with what arguments, never
// *how* the mutation is applied. Keeping this logic in one place means the
// itinerary panel, the chat bubbles, and Claude's tool calls all agree on
// what "swap", "remove", and "add a day" actually do.
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

export function generateTrip(messageOrDestinationId: string): Trip {
  const byId = destinations.find((destination) => destination.id === messageOrDestinationId);
  const destination = byId ?? findDestinationByMessage(messageOrDestinationId);
  return destination.buildTrip();
}

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
  const alternative: Place = { ...destination.followups.alternativeSight, id: `${trip.id}-swap-${Date.now()}` };
  const match = findPlaceByQuery(trip, query);

  if (!match) {
    return { trip, matchedExisting: false, added: alternative };
  }

  const next = cloneTrip(trip);
  const day = next.days.find((d) => d.id === match.day.id)!;
  const index = day.places.findIndex((p) => p.id === match.place.id);
  const replacement: Place = {
    ...alternative,
    date: match.place.date,
    timeSlot: match.place.timeSlot,
  };
  day.places[index] = replacement;

  return { trip: next, matchedExisting: true, day, removed: match.place, added: replacement };
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

function addOneDay(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00`);
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
}

export interface AddDayResult {
  trip: Trip;
  day: Day;
}

/** Appends a "free exploration" day built from the destination's unused follow-up suggestions. */
export function addExtraDay(trip: Trip): AddDayResult {
  const destination = getDestinationForTrip(trip);
  const lastDay = trip.days[trip.days.length - 1];
  const nextDate = lastDay ? addOneDay(lastDay.date) : trip.startDate;

  const bonusPlaces: Place[] = [
    { ...destination.followups.alternativeSight, id: `${trip.id}-extra-${Date.now()}-1`, date: nextDate, timeSlot: "Morning" },
    { ...destination.followups.veganRestaurant, id: `${trip.id}-extra-${Date.now()}-2`, date: nextDate, timeSlot: "13:00" },
    { ...destination.followups.eveningEvent, id: `${trip.id}-extra-${Date.now()}-3`, date: nextDate, timeSlot: "Evening" },
  ];

  const day: Day = {
    id: `${trip.id}-day-${trip.days.length + 1}`,
    dayNumber: trip.days.length + 1,
    date: nextDate,
    label: "Free Exploration",
    places: bonusPlaces,
  };

  const next = cloneTrip(trip);
  next.days.push(day);
  next.endDate = nextDate;

  return { trip: next, day };
}
