import { create } from "zustand";
import type { TripSummary } from "../types";
import { createTrip as createTripRequest, deleteTrip as deleteTripRequest, listTrips } from "../lib/tripsService";
import type { NewTripInput } from "../lib/tripsService";

interface TripsState {
  trips: TripSummary[];
  isLoading: boolean;
  hasLoaded: boolean;
  fetchTrips: () => Promise<void>;
  createTrip: (input?: NewTripInput) => Promise<TripSummary>;
  deleteTrip: (tripId: string) => Promise<void>;
  reset: () => void;
}

export const useTripsStore = create<TripsState>()((set, get) => ({
  trips: [],
  isLoading: false,
  hasLoaded: false,

  fetchTrips: async () => {
    set({ isLoading: true });
    try {
      const trips = await listTrips();
      set({ trips, isLoading: false, hasLoaded: true });
    } catch (error) {
      console.error("[tripsStore] failed to load trips:", error);
      set({ isLoading: false });
    }
  },

  createTrip: async (input) => {
    const trip = await createTripRequest(input);
    set({ trips: [trip, ...get().trips] });
    return trip;
  },

  deleteTrip: async (tripId) => {
    await deleteTripRequest(tripId);
    set({ trips: get().trips.filter((trip) => trip.id !== tripId) });
  },

  reset: () => set({ trips: [], isLoading: false, hasLoaded: false }),
}));
