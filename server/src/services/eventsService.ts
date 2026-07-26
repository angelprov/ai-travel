import type { Place } from "../types.js";
import { findDestinationById } from "../mocks/destinations.js";

// ---------------------------------------------------------------------------
// Live local events/activities provider.
//
// With EVENTS_API_KEY set, queries the Ticketmaster Discovery API for real,
// dated events in the destination city. This is where "real data" matters
// most: an LLM's static training knowledge can't know what's actually
// happening on a specific future date, so this is the one signal in the app
// that's genuinely live rather than generated.
//
// Without a key (or on a failed/empty live lookup), falls back to filtering
// the *mock* destination's own itinerary places by whatever's open at the
// requested hour — which only produces sensible results for the three mock
// destinations (Rome/Lisbon/Kyoto). For an AI-generated trip to anywhere
// else, callers should treat a "mock" source result as not destination-
// accurate and prefer to skip it rather than show it (see aiService.ts).
// ---------------------------------------------------------------------------

export interface LiveEventsResult {
  events: Place[];
  source: "mock" | "live";
}

function hourInRange(hour: number, openHours?: { start: string; end: string }): boolean {
  if (!openHours) return true;
  const startH = Number(openHours.start.split(":")[0]);
  const endH = Number(openHours.end.split(":")[0]);
  if (endH >= startH) return hour >= startH && hour <= endH;
  return hour >= startH || hour <= endH; // overnight wrap, e.g. 22:00-02:00
}

interface TicketmasterEvent {
  name: string;
  dates: { start: { localDate: string; localTime?: string } };
  priceRanges?: { min: number; max: number; currency: string }[];
  classifications?: { segment?: { name: string }; genre?: { name: string } }[];
  _embedded?: { venues?: { name: string }[] };
}

interface TicketmasterResponse {
  _embedded?: { events: TicketmasterEvent[] };
}

function mapTicketmasterEvent(event: TicketmasterEvent): Place {
  const venue = event._embedded?.venues?.[0]?.name ?? "a local venue";
  const genre = event.classifications?.[0]?.genre?.name;
  const segment = event.classifications?.[0]?.segment?.name;
  const kind = genre && genre !== "Undefined" ? genre : (segment ?? "Live event");
  const priceRange = event.priceRanges?.[0];
  const price = priceRange
    ? `${Math.round(priceRange.min)}-${Math.round(priceRange.max)} ${priceRange.currency}`
    : "See listing";

  return {
    id: crypto.randomUUID(),
    name: event.name,
    category: "event",
    rating: 4.5, // Ticketmaster doesn't provide a rating; a reasonable stand-in.
    duration: "2 hrs", // Not provided by the API; a reasonable stand-in.
    price,
    description: `${kind} at ${venue}.`,
    whySuggested: "Live and actually happening on the date you're asking about.",
    // "save" rather than "getyourguide": this is a real Ticketmaster listing,
    // not a GetYourGuide one, and we don't have a Ticketmaster checkout flow
    // wired up — booking modals stay GetYourGuide/Airbnb/Booking.com only.
    bookingAction: "save",
    timeSlot: event.dates.start.localTime?.slice(0, 5) ?? "Evening",
  };
}

async function liveTicketmasterEvents(destinationName: string, date: string, apiKey: string): Promise<Place[] | null> {
  const city = destinationName.split(",")[0].trim();
  const params = new URLSearchParams({
    apikey: apiKey,
    city,
    startDateTime: `${date}T00:00:00Z`,
    endDateTime: `${date}T23:59:59Z`,
    sort: "relevance,desc",
    size: "5",
  });

  const response = await fetch(`https://app.ticketmaster.com/discovery/v2/events.json?${params.toString()}`);
  if (!response.ok) {
    console.error(`[eventsService] Ticketmaster responded ${response.status} for "${city}"`);
    return null;
  }

  const data = (await response.json()) as TicketmasterResponse;
  const events = data._embedded?.events ?? [];
  return events.slice(0, 3).map(mapTicketmasterEvent);
}

export async function getLiveEvents(
  destinationId: string,
  destinationName: string,
  date: string,
  hour = new Date().getHours(),
): Promise<LiveEventsResult> {
  const apiKey = process.env.EVENTS_API_KEY;

  if (apiKey) {
    try {
      const live = await liveTicketmasterEvents(destinationName, date, apiKey);
      if (live && live.length > 0) return { events: live, source: "live" };
    } catch (error) {
      console.error("[eventsService] live lookup failed, falling back to mock:", error);
    }
  }

  const destination = findDestinationById(destinationId);
  const trip = destination.buildTrip();

  const candidates: Place[] = [
    ...trip.days.flatMap((day) => day.places).filter((place) => place.category === "event" || place.category === "activity"),
    destination.followups.eveningEvent,
  ];

  const events = candidates
    .filter((place) => hourInRange(hour, place.openHours))
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 3);

  return { events, source: "mock" };
}
