import type { AssistantMessage, ChatMessage, Trip, UserProfile } from "../types";
import { destinations, defaultDestination, findDestinationByMessage } from "../mocks/destinations";
import { API_URL } from "./apiClient";

// ---------------------------------------------------------------------------
// getAssistantReply() is the single seam this whole app talks through to get
// an assistant response. It calls the Waypoint backend's POST /api/chat
// (server/) with the full chat history + current trip state on every turn —
// the backend itself decides whether to answer with real Claude (tool-use,
// see server/src/services/claudeService.ts) or its mock intent engine,
// depending on whether ANTHROPIC_API_KEY is configured there.
//
// If the backend can't be reached at all (not running, network error), this
// falls back to the local mock logic below so the app keeps working.
// ---------------------------------------------------------------------------

const MOCK_REPLY_DELAY_MS = 1100;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getDestinationForTrip(trip: Trip) {
  return destinations.find((destination) => destination.id === trip.destinationId) ?? defaultDestination;
}

function paceDescriptor(pace: UserProfile["pace"]): string {
  switch (pace) {
    case "relaxed":
      return "relaxed";
    case "packed":
      return "action-packed";
    default:
      return "balanced";
  }
}

export function createWelcomeMessage(profile: UserProfile): ChatMessage {
  const interestList = profile.interests.length
    ? profile.interests.slice(0, 3).join(", ")
    : "a bit of everything";

  return {
    id: crypto.randomUUID(),
    role: "assistant",
    createdAt: Date.now(),
    status: "sent",
    text: `Hi ${profile.name || "there"} — I'm your Waypoint planner. I've got you down for ${interestList}, at a ${paceDescriptor(
      profile.pace,
    )} pace. Tell me where you're headed and roughly when, and I'll put together a full itinerary.`,
  };
}

// --- Local fallback (used only when the backend is unreachable) -----------

async function buildInitialTripReply(userMessage: string): Promise<AssistantMessage> {
  const destination = findDestinationByMessage(userMessage);
  const trip = destination.buildTrip();

  return {
    text: `Here's a first pass for ${trip.destination}: a ${trip.days.length}-day route with a stay in ${trip.stay.neighborhood}. Tap any card for details, or tell me what to change.`,
    attachments: {
      stay: trip.stay,
      days: trip.days,
    },
    trip,
  };
}

function buildFollowUpReply(userMessage: string, trip: Trip): AssistantMessage {
  const lower = userMessage.toLowerCase();
  const destination = getDestinationForTrip(trip);

  if (/\b(vegan|food|restaurant|hungry|eat)\b/.test(lower)) {
    return {
      text: `Found a great option nearby: ${destination.followups.veganRestaurant.name}.`,
      attachments: { place: destination.followups.veganRestaurant },
    };
  }

  if (/\b(event|tonight|nightlife|fun)\b/.test(lower)) {
    return {
      text: `If you're looking for something tonight, this is a strong pick:`,
      attachments: { place: destination.followups.eveningEvent },
    };
  }

  if (/\b(swap|different|change|instead|alternative)\b/.test(lower)) {
    return {
      text: `Here's a quieter alternative you can swap in:`,
      attachments: { place: destination.followups.alternativeSight },
    };
  }

  if (/\b(stay|hotel|airbnb|book|accommodation)\b/.test(lower)) {
    return {
      text: `Here's where you're staying in ${destination.name}:`,
      attachments: { stay: trip.stay },
    };
  }

  return {
    text: "Got it — noted. Let me know if you'd like me to adjust any part of the itinerary, find food nearby, or suggest something for tonight.",
  };
}

async function getLocalFallbackReply(userMessage: string, tripState: Trip | null): Promise<AssistantMessage> {
  await delay(MOCK_REPLY_DELAY_MS + Math.random() * 400);

  if (!tripState) {
    return buildInitialTripReply(userMessage);
  }

  return buildFollowUpReply(userMessage, tripState);
}

// --- Backend-backed reply ---------------------------------------------------

export async function getAssistantReply(
  userMessage: string,
  tripState: Trip | null,
  history: ChatMessage[],
  profile: UserProfile,
): Promise<AssistantMessage> {
  try {
    const response = await fetch(`${API_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: userMessage, trip: tripState, history, profile }),
    });

    if (!response.ok) throw new Error(`Backend responded with ${response.status}`);

    return (await response.json()) as AssistantMessage;
  } catch (error) {
    console.warn("[chatService] backend unreachable, using local mock:", error);
    return getLocalFallbackReply(userMessage, tripState);
  }
}
