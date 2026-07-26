import type { Trip, TripSummary } from "../types";
import { API_URL } from "./apiClient";

// ---------------------------------------------------------------------------
// Trip CRUD against the Waypoint backend's /api/trips (server/src/routes/trips.ts).
// A user can have many trips now — this is the seam for listing/creating/
// fetching/deleting them; chat-turn calls for a specific trip live in
// chatService.ts alongside the rest of that concern.
// ---------------------------------------------------------------------------

async function parseJsonOrThrow<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message = data && typeof data.error === "string" ? data.error : "Something went wrong.";
    throw new Error(message);
  }
  return data as T;
}

export async function listTrips(): Promise<TripSummary[]> {
  const response = await fetch(`${API_URL}/api/trips`, { credentials: "include" });
  const data = await parseJsonOrThrow<{ trips: TripSummary[] }>(response);
  return data.trips;
}

export interface NewTripInput {
  destination?: string;
  destinationId?: string;
  startDate?: string;
  endDate?: string;
  travelerCount?: number;
}

/** Creates an empty draft trip — the "New Trip" action. Real content lands via the first chat turn. */
export async function createTrip(input: NewTripInput = {}): Promise<TripSummary> {
  const response = await fetch(`${API_URL}/api/trips`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  });
  const data = await parseJsonOrThrow<{ trip: TripSummary }>(response);
  return data.trip;
}

export async function fetchTrip(tripId: string): Promise<Trip> {
  const response = await fetch(`${API_URL}/api/trips/${tripId}`, { credentials: "include" });
  const data = await parseJsonOrThrow<{ trip: Trip }>(response);
  return data.trip;
}

export async function deleteTrip(tripId: string): Promise<void> {
  await fetch(`${API_URL}/api/trips/${tripId}`, { method: "DELETE", credentials: "include" });
}
