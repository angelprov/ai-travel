import type { LiveEventsResponse } from "../types";
import { API_URL } from "./apiClient";

/** Fetches live/time-filtered events for a destination/date/hour. Returns null on any failure so callers can hide the widget instead of erroring. */
export async function fetchLiveEvents(
  destinationId: string,
  destination: string,
  date: string,
  hour?: number,
): Promise<LiveEventsResponse | null> {
  try {
    const params = new URLSearchParams({ destinationId, destination, date });
    if (hour !== undefined) params.set("hour", String(hour));

    const response = await fetch(`${API_URL}/api/events?${params.toString()}`);
    if (!response.ok) return null;
    return (await response.json()) as LiveEventsResponse;
  } catch {
    return null;
  }
}
