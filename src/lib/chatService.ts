import type { AssistantMessage, ChatMessage, UserProfile } from "../types";
import { API_URL } from "./apiClient";

// ---------------------------------------------------------------------------
// Chat-turn calls for a single trip's thread. Every trip has its own scoped
// chat now (POST/GET /api/trips/:tripId/chat, server/src/routes/trips.ts),
// which is server-authoritative: it loads the signed-in user's profile,
// that specific trip, and its conversation history from the database (never
// trusting anything the client sends beyond the new message text), then
// answers with either a real model via OpenRouter (tool-use, see
// server/src/services/aiService.ts) or its mock intent engine, depending on
// whether OPENROUTER_API_KEY is configured there.
//
// Because everything now lives behind a real account, there's no meaningful
// "offline" mode to fall back to — a network failure here surfaces as a
// normal inline error message in the thread instead.
// ---------------------------------------------------------------------------

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

export async function fetchTripMessages(tripId: string): Promise<ChatMessage[]> {
  const response = await fetch(`${API_URL}/api/trips/${tripId}/chat`, { credentials: "include" });
  if (!response.ok) throw new Error(`Backend responded with ${response.status}`);
  const data = (await response.json()) as { messages: ChatMessage[] };
  return data.messages;
}

export async function sendChatMessage(tripId: string, userMessage: string): Promise<AssistantMessage> {
  try {
    const response = await fetch(`${API_URL}/api/trips/${tripId}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ message: userMessage }),
    });

    if (!response.ok) throw new Error(`Backend responded with ${response.status}`);

    return (await response.json()) as AssistantMessage;
  } catch (error) {
    console.error("[chatService] request failed:", error);
    return {
      text: "Sorry, I couldn't reach the server. Check your connection and try again.",
      isError: true,
    };
  }
}
