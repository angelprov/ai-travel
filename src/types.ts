// Core domain models for Waypoint. Kept dependency-free so both the UI and
// the mock data/service layer can share a single source of truth.

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
  /** Set from the onboarding paywall step. No real billing yet. */
  subscribed: boolean;
}

export type PlaceCategory = "sight" | "restaurant" | "event" | "activity";

/**
 * How a place can be actioned from its detail sheet.
 * - "getyourguide": bookable activities/tours/events -> opens the GetYourGuide booking modal
 * - "save": restaurants and free sights -> saved to itinerary, no external booking
 */
export type PlaceBookingAction = "getyourguide" | "save";

export interface Place {
  id: string;
  name: string;
  category: PlaceCategory;
  rating: number;
  /** Human-readable duration, e.g. "1.5 hrs" */
  duration: string;
  /** Human-readable price, e.g. "€24" or "Free" */
  price: string;
  description: string;
  /** One-line "why this was suggested" note, tied to the conversation. */
  whySuggested: string;
  bookingAction: PlaceBookingAction;
  /** ISO date this place is scheduled for, if part of an itinerary day. */
  date?: string;
  /** Suggested time slot label, e.g. "Morning", "19:30" */
  timeSlot?: string;
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

export interface Trip {
  id: string;
  /** Id of the mock destination this trip was generated from, e.g. "rome". */
  destinationId: string;
  destination: string;
  startDate: string;
  endDate: string;
  travelerCount: number;
  days: Day[];
  stay: Stay;
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
  /** "error" renders a failed-generation state inline, not a full-screen error. */
  status?: "sent" | "thinking" | "error";
}

/**
 * Shape returned by chatService.getAssistantReply. A real backend would
 * return this same shape (short text + optional itinerary patch) from a
 * structured Claude response.
 */
export interface AssistantMessage {
  text: string;
  attachments?: AssistantAttachments;
  isError?: boolean;
  /**
   * Present only when this reply establishes/replaces the active trip
   * (e.g. the initial itinerary). Separate from `attachments`, which is
   * purely what renders inline in the message bubble.
   */
  trip?: Trip;
}

export type BookingSource = "getyourguide" | "airbnb" | "booking";

export interface BookingTarget {
  source: BookingSource;
  name: string;
  price: string;
}
