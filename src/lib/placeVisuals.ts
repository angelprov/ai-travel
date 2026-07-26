import { MapPin, UtensilsCrossed, PartyPopper, Ticket, type LucideIcon } from "lucide-react";
import type { PlaceCategory } from "../types";

// ---------------------------------------------------------------------------
// Deterministic, on-brand "photo" placeholders for place/event cards — no
// external image/video APIs. Same place id always renders the same gradient
// + icon, so cards feel stable across a session instead of flickering.
// ---------------------------------------------------------------------------

export const categoryIcon: Record<PlaceCategory, LucideIcon> = {
  sight: MapPin,
  restaurant: UtensilsCrossed,
  event: PartyPopper,
  activity: Ticket,
};

export const categoryLabel: Record<PlaceCategory, string> = {
  sight: "Sight",
  restaurant: "Restaurant",
  event: "Event",
  activity: "Activity",
};

/** Categories that get a "video preview" treatment instead of a plain photo. */
export function hasVideoPreview(category: PlaceCategory): boolean {
  return category === "activity" || category === "event";
}

const GRADIENTS = [
  "linear-gradient(135deg, #14243D 0%, #2F6E62 100%)",
  "linear-gradient(135deg, #C9972B 0%, #14243D 100%)",
  "linear-gradient(135deg, #2F6E62 0%, #C9972B 100%)",
  "linear-gradient(135deg, #14243D 0%, #A97E22 100%)",
  "linear-gradient(135deg, #23554B 0%, #2F6E62 100%)",
  "linear-gradient(135deg, #A97E22 0%, #23554B 100%)",
];

function hashSeed(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function getPlaceGradient(placeId: string): string {
  const seed = hashSeed(placeId);
  return GRADIENTS[seed % GRADIENTS.length];
}
