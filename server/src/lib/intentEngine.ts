import type { AssistantMessage, Trip, UserProfile } from "../types.js";
import { findDestinationById } from "../mocks/destinations.js";
import { generateTrip, swapPlace, removePlace, addExtraDay } from "./tripMutations.js";
import { getForecast } from "../services/weatherService.js";
import { getLiveEvents } from "../services/eventsService.js";

// ---------------------------------------------------------------------------
// Mock conversation + editing engine. This is the "no OPENROUTER_API_KEY"
// fallback path — simple keyword/regex matching over the mock trip data,
// but it performs *real* itinerary edits (swap/remove/add-day mutate the
// actual Trip object), not just canned suggestions.
//
// aiService.ts calls into the same tripMutations helpers when a real key is
// configured, so both paths produce identically-shaped results.
// ---------------------------------------------------------------------------

/** Exported so aiService.ts's check_weather tool reuses this instead of duplicating it. */
export async function handleWeatherQuery(trip: Trip): Promise<AssistantMessage> {
  const firstDay = trip.days[0];
  if (!firstDay) {
    return { text: "I don't have any days planned yet to check the weather for." };
  }
  const forecast = await getForecast(trip.destination, firstDay.date);
  const conditionLabel = forecast.condition.replace("-", " ");
  return {
    text: `Around ${trip.destination.split(",")[0]} on ${firstDay.date}, expect ${conditionLabel} weather, highs near ${forecast.tempHighC}°C and lows near ${forecast.tempLowC}°C.`,
  };
}

async function handleEventQuery(trip: Trip): Promise<AssistantMessage> {
  const destination = findDestinationById(trip.destinationId);
  const referenceDate = trip.days[trip.days.length - 1]?.date ?? trip.startDate;
  const result = await getLiveEvents(trip.destinationId, trip.destination, referenceDate, 20);
  const place = result.events[0] ?? destination.followups.eveningEvent;

  return {
    text: `If you're looking for something tonight, this is a strong pick:`,
    attachments: { place },
  };
}

function handleSwap(trip: Trip, userMessage: string): AssistantMessage {
  const result = swapPlace(trip, userMessage);

  if (result.matchedExisting && result.removed) {
    return {
      text: `Swapped ${result.removed.name} for ${result.added.name} on Day ${result.day?.dayNumber ?? "?"}.`,
      attachments: { place: result.added },
      trip: result.trip,
    };
  }

  return {
    text: `Here's a quieter alternative you can swap in:`,
    attachments: { place: result.added },
  };
}

function handleRemove(trip: Trip, userMessage: string): AssistantMessage {
  const result = removePlace(trip, userMessage);

  if (result.removed) {
    return {
      text: `Removed ${result.removed.name} from Day ${result.day?.dayNumber ?? "?"}.`,
      trip: result.trip,
    };
  }

  return {
    text: "I couldn't find that in your itinerary — could you name it as it appears on a card?",
  };
}

function handleAddDay(trip: Trip): AssistantMessage {
  const result = addExtraDay(trip);
  return {
    text: `Added Day ${result.day.dayNumber} with a few open-ended picks — swap or remove anything that doesn't fit.`,
    attachments: { days: [result.day] },
    trip: result.trip,
  };
}

function handleFood(trip: Trip): AssistantMessage {
  const destination = findDestinationById(trip.destinationId);
  return {
    text: `Found a great option nearby: ${destination.followups.veganRestaurant.name}.`,
    attachments: { place: destination.followups.veganRestaurant },
  };
}

function handleStay(trip: Trip): AssistantMessage {
  if (!trip.stay) return { text: "I don't have a stay booked for this trip yet." };
  const destination = findDestinationById(trip.destinationId);
  return {
    text: `Here's where you're staying in ${destination.name}:`,
    attachments: { stay: trip.stay },
  };
}

export async function runIntentEngine(userMessage: string, trip: Trip, _profile: UserProfile): Promise<AssistantMessage> {
  const lower = userMessage.toLowerCase();

  if (trip.days.length === 0) {
    const newTrip = generateTrip(userMessage);
    return {
      text: `Here's a first pass for ${newTrip.destination}: a ${newTrip.days.length}-day route with a stay in ${newTrip.stay?.neighborhood ?? "a great spot"}. Tap any card for details, or tell me what to change.`,
      attachments: { stay: newTrip.stay ?? undefined, days: newTrip.days },
      trip: newTrip,
    };
  }

  if (/\b(remove|delete|drop|cancel)\b/.test(lower)) {
    return handleRemove(trip, userMessage);
  }

  if (/\b(swap|different|change|instead|alternative|replace)\b/.test(lower)) {
    return handleSwap(trip, userMessage);
  }

  if (/\b(add (a|another) day|one more day|extra day)\b/.test(lower)) {
    return handleAddDay(trip);
  }

  if (/\b(weather|rain|forecast|temperature|hot|cold)\b/.test(lower)) {
    return handleWeatherQuery(trip);
  }

  if (/\b(vegan|food|restaurant|hungry|eat)\b/.test(lower)) {
    return handleFood(trip);
  }

  if (/\b(event|tonight|nightlife|fun)\b/.test(lower)) {
    return handleEventQuery(trip);
  }

  if (/\b(stay|hotel|airbnb|book|accommodation)\b/.test(lower)) {
    return handleStay(trip);
  }

  return {
    text: "Got it — noted. Let me know if you'd like me to adjust any part of the itinerary, find food nearby, or suggest something for tonight.",
  };
}
