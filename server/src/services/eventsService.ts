import type { Place } from "../types.js";
import { findDestinationById } from "../mocks/destinations.js";

// ---------------------------------------------------------------------------
// Live local events/activities provider. Mock today: filters the
// destination's own itinerary places (plus its follow-up pool) down to
// whatever's actually open at the requested hour, so "what's on tonight"
// answers change with the time being asked about.
// ---------------------------------------------------------------------------

function hourInRange(hour: number, openHours?: { start: string; end: string }): boolean {
  if (!openHours) return true;
  const startH = Number(openHours.start.split(":")[0]);
  const endH = Number(openHours.end.split(":")[0]);
  if (endH >= startH) return hour >= startH && hour <= endH;
  return hour >= startH || hour <= endH; // overnight wrap, e.g. 22:00-02:00
}

export async function getLiveEvents(destinationId: string, _date: string, hour = new Date().getHours()): Promise<Place[]> {
  const apiKey = process.env.EVENTS_API_KEY;

  if (apiKey) {
    // TODO: replace with a real events/activities provider once
    // EVENTS_API_KEY is set (e.g. Ticketmaster Discovery API, Eventbrite,
    // or PredictHQ) — query by destination + date + time window and map
    // results into Place[] with category: "event". Falling back to the
    // mock destination data until that mapping is wired up.
  }

  const destination = findDestinationById(destinationId);
  const trip = destination.buildTrip();

  const candidates: Place[] = [
    ...trip.days.flatMap((day) => day.places).filter((place) => place.category === "event" || place.category === "activity"),
    destination.followups.eveningEvent,
  ];

  return candidates
    .filter((place) => hourInRange(hour, place.openHours))
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 3);
}
