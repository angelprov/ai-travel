// Domain types for the Waypoint backend. Intentionally mirrors the shape of
// src/types.ts on the frontend (the two are kept in sync by hand since the
// two apps are separate npm packages) — anything that crosses the
// client/server boundary as JSON must match field-for-field.

export type TravelInterest =
  | "food"
  | "history"
  | "nature"
  | "art"
  | "nightlife"
  | "shopping"
  | "relaxation"
  | "adventure";

export type TravelPace = "relaxed" | "balanced" | "packed";
export type TravelBudget = "budget" | "mid-range" | "luxury";

export interface UserProfile {
  name: string;
  interests: TravelInterest[];
  pace: TravelPace;
  budget: TravelBudget;
  dietary: string[];
  subscribed: boolean;
}

export type PlaceCategory = "sight" | "restaurant" | "event" | "activity";
export type PlaceBookingAction = "getyourguide" | "save";

export interface OpenHours {
  /** 24h "HH:MM" */
  start: string;
  /** 24h "HH:MM" */
  end: string;
}

export interface Place {
  id: string;
  name: string;
  category: PlaceCategory;
  rating: number;
  duration: string;
  price: string;
  description: string;
  whySuggested: string;
  bookingAction: PlaceBookingAction;
  date?: string;
  timeSlot?: string;
  /** When this place/event is actually open or running, for time-of-day filtering. */
  openHours?: OpenHours;
}

export type StaySource = "airbnb" | "booking";

export interface Stay {
  id: string;
  name: string;
  source: StaySource;
  neighborhood: string;
  pricePerNight: string;
  rating: number;
  nights: number;
  totalPrice: string;
  imageDescription: string;
}

export interface Day {
  id: string;
  dayNumber: number;
  date: string;
  label: string;
  places: Place[];
}

export type TripStatus = "draft" | "active";

export interface Trip {
  id: string;
  destinationId: string;
  destination: string;
  startDate: string;
  endDate: string;
  travelerCount: number;
  status: TripStatus;
  days: Day[];
  /** Null for a freshly created draft trip before the first itinerary is generated. */
  stay: Stay | null;
}

export interface StaySummary {
  id: string;
  name: string;
  source: StaySource;
  neighborhood: string;
  pricePerNight: string;
  rating: number;
  imageDescription: string;
}

/** Lightweight trip shape for list views (Trips, Stays, Home) — no days/places. */
export interface TripSummary {
  id: string;
  destinationId: string;
  destination: string;
  startDate: string;
  endDate: string;
  travelerCount: number;
  status: TripStatus;
  createdAt: number;
  updatedAt: number;
  stay: StaySummary | null;
}

export type ChatRole = "user" | "assistant";

export interface AssistantAttachments {
  stay?: Stay;
  days?: Day[];
  place?: Place;
}

export interface ChatMessage {
  id: string;
  role: ChatRole;
  text: string;
  createdAt: number;
  attachments?: AssistantAttachments;
  status?: "sent" | "thinking" | "error";
}

export interface AssistantMessage {
  text: string;
  attachments?: AssistantAttachments;
  isError?: boolean;
  trip?: Trip;
}

export interface ChatRequestBody {
  message: string;
}

export interface AuthUser {
  id: string;
  email: string;
}

/**
 * Response shape for signup/login/me. Deliberately light — full trip detail
 * and chat history are fetched on demand by whichever screen needs them
 * (GET /api/trips/:tripId, GET /api/trips/:tripId/chat), not eagerly loaded
 * on every login now that a user can have many trips.
 */
export interface HydrateResponse {
  user: AuthUser;
  profile: UserProfile;
  onboardingComplete: boolean;
  activeTripSummary: TripSummary | null;
}

export interface ProfileUpdateResponse {
  profile: UserProfile;
  onboardingComplete: boolean;
}

export interface WeatherSnapshot {
  date: string;
  condition: "sunny" | "partly-cloudy" | "cloudy" | "rainy" | "stormy";
  tempHighC: number;
  tempLowC: number;
  /** True when a real provider was used instead of the deterministic mock. */
  source: "mock" | "live";
}

export interface LiveEventsResponse {
  destinationId: string;
  date: string;
  events: Place[];
  source: "mock" | "live";
}
