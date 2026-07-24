import type { AssistantMessage, ChatMessage, Trip, UserProfile } from "../types";
import { destinations, defaultDestination, findDestinationByMessage } from "../mocks/destinations";

// ---------------------------------------------------------------------------
// Mock conversation layer.
//
// getAssistantReply() is the single seam this whole app talks through to get
// an assistant response. Everything below it is simple keyword matching over
// canned mock data, clearly marked so it's a drop-in replacement point.
//
// TODO (real integration): replace the body of getAssistantReply with a call
// to the Claude API, e.g.:
//
//   const response = await anthropic.messages.create({
//     model: "claude-sonnet-5",
//     system: buildSystemPrompt(tripState),
//     messages: toClaudeMessages(history.concat(userTurn)),
//   });
//
// The Messages API is stateless: it has no memory of previous calls, so the
// *full* chat history plus the current trip state must be sent on every
// single turn (not just the latest user message). The response would need
// to come back as a structured payload (short reply text + an optional
// itinerary "patch": a new/updated stay, days, or suggested place) so the UI
// layer here doesn't have to change at all when this seam is swapped out.
// ---------------------------------------------------------------------------

const MOCK_REPLY_DELAY_MS = 1100;

/** Small, deliberate failure rate so the inline error state is reachable in the mock. */
const SIMULATE_ERROR_RATE = 0.08;

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

export async function getAssistantReply(
  userMessage: string,
  tripState: Trip | null,
  _history: ChatMessage[],
): Promise<AssistantMessage> {
  await delay(MOCK_REPLY_DELAY_MS + Math.random() * 400);

  if (Math.random() < SIMULATE_ERROR_RATE) {
    return {
      text: "Sorry, I hit a snag putting that together. Could you try again?",
      isError: true,
    };
  }

  if (!tripState) {
    return buildInitialTripReply(userMessage);
  }

  return buildFollowUpReply(userMessage, tripState);
}
