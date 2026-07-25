import OpenAI from "openai";
import type { ChatCompletionTool } from "openai/resources/chat/completions";
import type { AssistantMessage, ChatMessage, Day, Place, Stay, Trip, UserProfile } from "../types.js";
import { runIntentEngine, handleWeatherQuery } from "../lib/intentEngine.js";
import { findPlaceByQuery, replacePlaceAt, appendDay, removePlace } from "../lib/tripMutations.js";
import { getLiveEvents } from "./eventsService.js";

// ---------------------------------------------------------------------------
// Real AI chatbot integration, via OpenRouter (an OpenAI-compatible gateway
// in front of many models, including Claude) rather than calling a single
// provider's SDK directly. Every chat turn is sent with the full
// conversation history + current trip state (the underlying APIs are
// stateless, so everything is resent each call).
//
// Unlike the earlier direct-Anthropic version, itinerary generation here is
// NOT bound to a fixed set of mock destinations — the model is asked to
// invent a full, real-sounding itinerary (day-by-day places + a stay) for
// whatever destination the traveler names, via structured tool calls. Swap
// and add-day work the same way: the model generates new place/day content
// on the fly instead of pulling from static mock followups.
//
// With no OPENROUTER_API_KEY set, this transparently falls back to the
// keyword-based mock intent engine (which still only knows Rome/Lisbon/Kyoto).
// ---------------------------------------------------------------------------

const DEFAULT_MODEL = "anthropic/claude-sonnet-4.5";

let client: OpenAI | null = null;

function getClient(): OpenAI | null {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return null;
  if (!client) {
    client = new OpenAI({
      apiKey,
      baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: {
        "HTTP-Referer": process.env.CLIENT_URL ?? "http://localhost:5173",
        "X-Title": "Waypoint",
      },
    });
  }
  return client;
}

// --- Tool schemas -----------------------------------------------------

const placeProperties = {
  name: { type: "string" },
  category: { type: "string", enum: ["sight", "restaurant", "event", "activity"] },
  rating: { type: "number", description: "1-5 with one decimal, realistic (mostly 4.0-4.9)." },
  duration: { type: "string", description: "e.g. '2 hrs', '45 min'." },
  price: { type: "string", description: "e.g. '€24', 'Free', '$15 avg'." },
  description: { type: "string", description: "One vivid, specific sentence." },
  whySuggested: {
    type: "string",
    description: "One sentence tying this to the traveler's stated interests, pace, or the conversation so far.",
  },
  bookingAction: {
    type: "string",
    enum: ["getyourguide", "save"],
    description: "'getyourguide' for paid activities/tours/ticketed events; 'save' for restaurants and free sights.",
  },
  timeSlot: { type: "string", description: "e.g. 'Morning', '19:00'." },
  openHoursStart: { type: "string", description: "24h HH:MM the place/event opens." },
  openHoursEnd: { type: "string", description: "24h HH:MM the place/event closes." },
} as const;
const placeRequired = ["name", "category", "rating", "duration", "price", "description", "whySuggested", "bookingAction"];

const placeSchema = { type: "object", properties: placeProperties, required: placeRequired };

const daySchema = {
  type: "object",
  properties: {
    dayNumber: { type: "integer" },
    date: { type: "string", description: "YYYY-MM-DD" },
    label: { type: "string", description: "Short theme for the day, e.g. 'Old Town & Harbor'." },
    places: { type: "array", items: placeSchema, minItems: 2, maxItems: 4 },
  },
  required: ["dayNumber", "date", "label", "places"],
};

const staySchema = {
  type: "object",
  properties: {
    name: { type: "string" },
    source: { type: "string", enum: ["airbnb", "booking"] },
    neighborhood: { type: "string" },
    pricePerNight: { type: "string" },
    rating: { type: "number" },
    nights: { type: "integer" },
    totalPrice: { type: "string" },
    imageDescription: { type: "string", description: "One-sentence visual description of the stay." },
  },
  required: ["name", "source", "neighborhood", "pricePerNight", "rating", "nights", "totalPrice", "imageDescription"],
};

function tool(name: string, description: string, properties: Record<string, unknown>, required: string[]): ChatCompletionTool {
  return {
    type: "function",
    function: { name, description, parameters: { type: "object", properties, required } },
  };
}

const tools: ChatCompletionTool[] = [
  tool(
    "reply_only",
    "Just reply with text — no itinerary change. Use for greetings, small talk, or anything not covered by the other tools.",
    { reply: { type: "string", description: "1-3 sentence reply." } },
    ["reply"],
  ),
  tool(
    "generate_trip",
    "Generate a brand-new multi-day itinerary. Only call this when the traveler has no trip yet and has given (or implied) a destination.",
    {
      reply: { type: "string", description: "1-2 sentence reply introducing the itinerary." },
      destination: { type: "string", description: "e.g. 'Porto, Portugal'" },
      startDate: { type: "string", description: "YYYY-MM-DD" },
      endDate: { type: "string", description: "YYYY-MM-DD" },
      travelerCount: { type: "integer" },
      days: { type: "array", items: daySchema, minItems: 1 },
      stay: staySchema,
    },
    ["reply", "destination", "startDate", "endDate", "days", "stay"],
  ),
  tool(
    "swap_place",
    "Replace one existing itinerary place with a different one. Only call this when the traveler clearly names or strongly implies an existing itinerary item to swap out.",
    {
      reply: { type: "string" },
      targetPlaceName: { type: "string", description: "Name of the existing itinerary place being replaced, as close to verbatim as possible." },
      newPlace: placeSchema,
    },
    ["reply", "targetPlaceName", "newPlace"],
  ),
  tool(
    "remove_place",
    "Remove an existing itinerary place entirely, with nothing replacing it.",
    { reply: { type: "string" }, targetPlaceName: { type: "string" } },
    ["reply", "targetPlaceName"],
  ),
  tool(
    "add_day",
    "Add one new day to the end of the itinerary.",
    { reply: { type: "string" }, day: daySchema },
    ["reply", "day"],
  ),
  tool(
    "show_stay",
    "Resurface the traveler's existing stay/accommodation. Use for accommodation questions.",
    { reply: { type: "string" } },
    ["reply"],
  ),
  tool(
    "suggest_food",
    "Suggest one restaurant, not yet part of the itinerary, in response to a food/dietary request.",
    { reply: { type: "string" }, place: placeSchema },
    ["reply", "place"],
  ),
  tool(
    "suggest_event",
    "Suggest one event or evening activity, not yet part of the itinerary, in response to an 'anything fun tonight' style request.",
    { reply: { type: "string" }, place: placeSchema },
    ["reply", "place"],
  ),
  tool(
    "check_weather",
    "Look up the weather for the trip. Call this for any weather/forecast/temperature question — never guess the weather yourself.",
    {},
    [],
  ),
];

// --- Prompt building ----------------------------------------------------

function buildSystemPrompt(trip: Trip | null, profile: UserProfile): string {
  const today = new Date().toISOString().slice(0, 10);

  const tripContext = trip
    ? `They currently have a trip planned to ${trip.destination} (${trip.startDate} to ${trip.endDate}) with ${trip.days.length} day(s) already itemized:\n${trip.days
        .map((day) => `Day ${day.dayNumber} (${day.date}): ${day.places.map((p) => `${p.name} [${p.category}]`).join(", ")}`)
        .join("\n")}\nRefer to specific place names from this itinerary when relevant.`
    : "They have not planned a trip yet — their next message is likely a trip brief.";

  return [
    `Today's date is ${today}. You are Waypoint's trip-planning assistant, replying inside a persistent chat thread that doubles as an editable itinerary.`,
    `Traveler profile: name=${profile.name || "unknown"}, interests=${profile.interests.join(", ") || "none given"}, pace=${profile.pace}, budget=${profile.budget}, dietary=${profile.dietary.join(", ") || "none"}.`,
    tripContext,
    "Always call exactly one tool — never reply in plain text.",
    "When generating a trip: infer the length from the traveler's message (e.g. '3 days'), defaulting to 3 days if unspecified. Pick real, well-known, specific places for the destination — actual named sights, restaurants, and neighborhoods, not generic placeholders. Vary categories across each day (mix sights/activities with a restaurant, and an event where it fits). Ground dates on or after today's date. Match pace (relaxed=2 stops/day, balanced=3, packed=4) and budget in your price/venue choices, and respect dietary needs in restaurant picks.",
    "For swap_place/add_day, generate content that fits the destination and the traveler's stated interests — don't repeat anything already in the itinerary.",
  ].join("\n\n");
}

function toHistory(history: ChatMessage[], userMessage: string) {
  const turns = history
    .filter((message) => message.status !== "error")
    .map((message) => ({ role: message.role, content: message.text }) as const);
  turns.push({ role: "user" as const, content: userMessage });
  return turns;
}

// --- Mapping model output -> domain types --------------------------------

interface RawPlace {
  name: string;
  category: Place["category"];
  rating: number;
  duration: string;
  price: string;
  description: string;
  whySuggested: string;
  bookingAction: Place["bookingAction"];
  timeSlot?: string;
  openHoursStart?: string;
  openHoursEnd?: string;
}

interface RawDay {
  dayNumber: number;
  date: string;
  label: string;
  places: RawPlace[];
}

interface RawStay {
  name: string;
  source: Stay["source"];
  neighborhood: string;
  pricePerNight: string;
  rating: number;
  nights: number;
  totalPrice: string;
  imageDescription: string;
}

function toPlaceInput(raw: RawPlace): Omit<Place, "id"> {
  return {
    name: raw.name,
    category: raw.category,
    rating: raw.rating,
    duration: raw.duration,
    price: raw.price,
    description: raw.description,
    whySuggested: raw.whySuggested,
    bookingAction: raw.bookingAction,
    timeSlot: raw.timeSlot,
    openHours: raw.openHoursStart && raw.openHoursEnd ? { start: raw.openHoursStart, end: raw.openHoursEnd } : undefined,
  };
}

function slugify(value: string): string {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "trip";
}

function buildGeneratedTrip(args: {
  destination: string;
  startDate: string;
  endDate: string;
  travelerCount?: number;
  days: RawDay[];
  stay: RawStay;
}): Trip {
  const tripId = crypto.randomUUID();

  const days: Day[] = args.days.map((day) => ({
    id: `${tripId}-day-${day.dayNumber}`,
    dayNumber: day.dayNumber,
    date: day.date,
    label: day.label,
    places: day.places.map((place, index) => ({
      ...toPlaceInput(place),
      id: `${tripId}-place-${day.dayNumber}-${index}`,
      date: day.date,
    })),
  }));

  const stay: Stay = { id: `${tripId}-stay`, ...args.stay };

  return {
    id: tripId,
    destinationId: slugify(args.destination),
    destination: args.destination,
    startDate: args.startDate,
    endDate: args.endDate,
    travelerCount: args.travelerCount ?? 2,
    days,
    stay,
  };
}

// --- Applying the model's chosen tool call --------------------------------

async function applyToolCall(name: string, args: Record<string, unknown>, trip: Trip | null): Promise<AssistantMessage> {
  const reply = typeof args.reply === "string" ? args.reply : "";

  switch (name) {
    case "generate_trip": {
      const newTrip = buildGeneratedTrip(args as Parameters<typeof buildGeneratedTrip>[0]);
      return { text: reply, attachments: { stay: newTrip.stay, days: newTrip.days }, trip: newTrip };
    }
    case "swap_place": {
      if (!trip) return { text: reply };
      const targetPlaceName = String(args.targetPlaceName ?? "");
      const newPlace = toPlaceInput(args.newPlace as RawPlace);
      const match = findPlaceByQuery(trip, targetPlaceName);
      if (!match) {
        return { text: reply, attachments: { place: { ...newPlace, id: crypto.randomUUID() } } };
      }
      const result = replacePlaceAt(trip, match.day.id, match.place.id, newPlace);
      return { text: reply, attachments: { place: result.added }, trip: result.trip };
    }
    case "remove_place": {
      if (!trip) return { text: reply };
      const result = removePlace(trip, String(args.targetPlaceName ?? ""));
      return result.removed ? { text: reply, trip: result.trip } : { text: reply };
    }
    case "add_day": {
      if (!trip) return { text: reply };
      const day = args.day as RawDay;
      const result = appendDay(trip, { label: day.label, date: day.date, places: day.places.map(toPlaceInput) });
      return { text: reply, attachments: { days: [result.day] }, trip: result.trip };
    }
    case "show_stay": {
      if (!trip) return { text: reply };
      return { text: reply, attachments: { stay: trip.stay } };
    }
    case "suggest_food": {
      const place = toPlaceInput(args.place as RawPlace);
      return { text: reply, attachments: { place: { ...place, id: crypto.randomUUID() } } };
    }
    case "suggest_event": {
      const modelPlace = toPlaceInput(args.place as RawPlace);
      const fallback: AssistantMessage = { text: reply, attachments: { place: { ...modelPlace, id: crypto.randomUUID() } } };
      if (!trip) return fallback;

      // Prefer a real, dated event listing over the model's invented one —
      // this is the one place in the app where live data beats an LLM's
      // static knowledge, since it can't know what's actually on tonight.
      try {
        const referenceDate = trip.days[trip.days.length - 1]?.date ?? trip.startDate;
        const result = await getLiveEvents(trip.destinationId, trip.destination, referenceDate, 20);
        if (result.source === "live" && result.events[0]) {
          return { text: reply, attachments: { place: result.events[0] } };
        }
      } catch (error) {
        console.error("[aiService] live event lookup failed, using the model's suggestion:", error);
      }
      return fallback;
    }
    case "check_weather": {
      if (!trip) return { text: "I don't have a trip planned yet to check the weather for." };
      return handleWeatherQuery(trip);
    }
    case "reply_only":
    default:
      return { text: reply || "Got it." };
  }
}

// --- Entry point -----------------------------------------------------------

export async function getAiReply(
  userMessage: string,
  trip: Trip | null,
  history: ChatMessage[],
  profile: UserProfile,
): Promise<AssistantMessage> {
  const openai = getClient();
  if (!openai) {
    return runIntentEngine(userMessage, trip, profile);
  }

  try {
    const response = await openai.chat.completions.create({
      model: process.env.OPENROUTER_MODEL || DEFAULT_MODEL,
      max_tokens: 2000,
      messages: [{ role: "system", content: buildSystemPrompt(trip, profile) }, ...toHistory(history, userMessage)],
      tools,
      tool_choice: "required",
    });

    const toolCall = response.choices[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.type !== "function") {
      return { text: "Sorry, I hit a snag putting that together. Could you try again?", isError: true };
    }

    const args = JSON.parse(toolCall.function.arguments) as Record<string, unknown>;
    return await applyToolCall(toolCall.function.name, args, trip);
  } catch (error) {
    console.error("[aiService] OpenRouter call failed, falling back to mock engine:", error);
    return runIntentEngine(userMessage, trip, profile);
  }
}
