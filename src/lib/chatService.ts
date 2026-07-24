import type { AssistantMessage, ChatMessage, UserProfile } from "../types";
import { API_URL } from "./apiClient";

// ---------------------------------------------------------------------------
// getAssistantReply() is the single seam this whole app talks through to get
// an assistant response. It calls the Waypoint backend's POST /api/chat
// (server/), which is server-authoritative: it loads the signed-in user's
// profile, trip, and conversation history from the database (never trusting
// anything the client sends beyond the new message text), then answers with
// either real Claude (tool-use, see server/src/services/claudeService.ts) or
// its mock intent engine, depending on whether ANTHROPIC_API_KEY is
// configured there.
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

export async function getAssistantReply(userMessage: string): Promise<AssistantMessage> {
  try {
    const response = await fetch(`${API_URL}/api/chat`, {
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
