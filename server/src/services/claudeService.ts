import Anthropic from "@anthropic-ai/sdk";
import type { AssistantMessage, ChatMessage, Trip, UserProfile } from "../types.js";
import { runIntentEngine } from "../lib/intentEngine.js";
import { generateTrip, swapPlace, removePlace, addExtraDay } from "../lib/tripMutations.js";
import { findDestinationById } from "../mocks/destinations.js";

// ---------------------------------------------------------------------------
// Real AI chatbot integration. When ANTHROPIC_API_KEY is set, every chat
// turn is sent to Claude with the full conversation history + current trip
// state (the Messages API is stateless — nothing is remembered between
// calls, so the whole context is resent every time). Claude is forced to
// call the `respond_to_traveler` tool so its reply always comes back as
// structured { reply, action, target } rather than free text we'd have to
// parse — that structured action is then applied through the exact same
// tripMutations helpers the mock intent engine uses, so both paths produce
// identically-shaped itinerary edits.
//
// With no key set, this transparently falls back to the mock intent engine.
// ---------------------------------------------------------------------------

const MODEL = "claude-sonnet-5";

let client: Anthropic | null = null;

function getClient(): Anthropic | null {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  if (!client) client = new Anthropic({ apiKey });
  return client;
}

const respondToTravelerTool = {
  name: "respond_to_traveler",
  description:
    "Reply to the traveler in the Waypoint trip-planning chat and optionally take one itinerary action.",
  input_schema: {
    type: "object" as const,
    properties: {
      reply: {
        type: "string",
        description: "Short, friendly reply (1-3 sentences) shown as the chat message.",
      },
      action: {
        type: "string",
        enum: [
          "none",
          "generate_trip",
          "swap_place",
          "remove_place",
          "add_day",
          "show_stay",
          "suggest_food",
          "suggest_event",
        ],
        description: "Which itinerary action this turn should take, if any.",
      },
      target: {
        type: "string",
        description:
          "For swap_place/remove_place: the name of the existing itinerary place being referred to, as close to verbatim as possible.",
      },
    },
    required: ["reply", "action"],
  },
};

function buildSystemPrompt(trip: Trip | null, profile: UserProfile): string {
  const tripContext = trip
    ? `They currently have a trip planned to ${trip.destination} (${trip.startDate} to ${trip.endDate}) with ${trip.days.length} day(s) already itemized:\n${trip.days
        .map((day) => `Day ${day.dayNumber} (${day.date}): ${day.places.map((p) => p.name).join(", ")}`)
        .join("\n")}\nRefer to specific place names from this itinerary when relevant.`
    : "They have not planned a trip yet — their next message is likely a trip brief (destination + rough dates).";

  return [
    "You are Waypoint's trip-planning assistant, replying inside a persistent chat thread that doubles as an editable itinerary.",
    `Traveler profile: name=${profile.name || "unknown"}, interests=${profile.interests.join(", ") || "none given"}, pace=${profile.pace}, budget=${profile.budget}, dietary=${profile.dietary.join(", ") || "none"}.`,
    tripContext,
    'Always call the respond_to_traveler tool exactly once, never reply in plain text.',
    'Choose "generate_trip" only when there is no trip yet. Choose "swap_place" or "remove_place" only when the traveler clearly names or strongly implies an existing itinerary item. Choose "add_day" when they ask for another day or more time. Choose "show_stay" for accommodation questions. Choose "suggest_food" / "suggest_event" for food or evening-plan requests. Otherwise choose "none".',
  ].join("\n\n");
}

function toClaudeHistory(history: ChatMessage[], userMessage: string) {
  const turns = history
    .filter((message) => message.status !== "error")
    .map((message) => ({ role: message.role, content: message.text }));
  turns.push({ role: "user" as const, content: userMessage });
  return turns;
}

async function applyAction(
  action: string,
  target: string | undefined,
  trip: Trip | null,
  reply: string,
): Promise<AssistantMessage> {
  switch (action) {
    case "generate_trip": {
      const newTrip = generateTrip(target || reply);
      return { text: reply, attachments: { stay: newTrip.stay, days: newTrip.days }, trip: newTrip };
    }
    case "swap_place": {
      if (!trip) return { text: reply };
      const result = swapPlace(trip, target ?? reply);
      return result.matchedExisting
        ? { text: reply, attachments: { place: result.added }, trip: result.trip }
        : { text: reply, attachments: { place: result.added } };
    }
    case "remove_place": {
      if (!trip) return { text: reply };
      const result = removePlace(trip, target ?? reply);
      return result.removed ? { text: reply, trip: result.trip } : { text: reply };
    }
    case "add_day": {
      if (!trip) return { text: reply };
      const result = addExtraDay(trip);
      return { text: reply, attachments: { days: [result.day] }, trip: result.trip };
    }
    case "show_stay": {
      if (!trip) return { text: reply };
      return { text: reply, attachments: { stay: trip.stay } };
    }
    case "suggest_food": {
      if (!trip) return { text: reply };
      const destination = findDestinationById(trip.destinationId);
      return { text: reply, attachments: { place: destination.followups.veganRestaurant } };
    }
    case "suggest_event": {
      if (!trip) return { text: reply };
      const destination = findDestinationById(trip.destinationId);
      return { text: reply, attachments: { place: destination.followups.eveningEvent } };
    }
    default:
      return { text: reply };
  }
}

export async function getClaudeReply(
  userMessage: string,
  trip: Trip | null,
  history: ChatMessage[],
  profile: UserProfile,
): Promise<AssistantMessage> {
  const anthropic = getClient();
  if (!anthropic) {
    return runIntentEngine(userMessage, trip, profile);
  }

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 600,
      system: buildSystemPrompt(trip, profile),
      messages: toClaudeHistory(history, userMessage),
      tools: [respondToTravelerTool],
      tool_choice: { type: "tool", name: "respond_to_traveler" },
    });

    const toolUse = response.content.find((block) => block.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") {
      return { text: "Sorry, I hit a snag putting that together. Could you try again?", isError: true };
    }

    const input = toolUse.input as { reply: string; action: string; target?: string };
    return await applyAction(input.action, input.target, trip, input.reply);
  } catch (error) {
    console.error("[claudeService] Anthropic call failed, falling back to mock engine:", error);
    return runIntentEngine(userMessage, trip, profile);
  }
}
