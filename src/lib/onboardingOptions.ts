import {
  Utensils,
  Landmark,
  Trees,
  Palette,
  Music,
  ShoppingBag,
  Waves,
  Mountain,
  type LucideIcon,
} from "lucide-react";
import type { TravelBudget, TravelInterest, TravelPace } from "../types";

export const interestOptions: { value: TravelInterest; label: string; icon: LucideIcon }[] = [
  { value: "food", label: "Food & drink", icon: Utensils },
  { value: "history", label: "History", icon: Landmark },
  { value: "nature", label: "Nature", icon: Trees },
  { value: "art", label: "Art & culture", icon: Palette },
  { value: "nightlife", label: "Nightlife", icon: Music },
  { value: "shopping", label: "Shopping", icon: ShoppingBag },
  { value: "relaxation", label: "Relaxation", icon: Waves },
  { value: "adventure", label: "Adventure", icon: Mountain },
];

export const paceOptions: { value: TravelPace; label: string; description: string }[] = [
  { value: "relaxed", label: "Relaxed", description: "A couple of things a day, plenty of downtime." },
  { value: "balanced", label: "Balanced", description: "A full day, with room to wander." },
  { value: "packed", label: "Packed", description: "See and do as much as possible." },
];

export const budgetOptions: { value: TravelBudget; label: string; description: string }[] = [
  { value: "budget", label: "Budget", description: "Hostels, street food, free sights." },
  { value: "mid-range", label: "Mid-range", description: "3-star stays, mix of casual and sit-down." },
  { value: "luxury", label: "Luxury", description: "Top-tier stays and dining, private guides." },
];

export const dietaryOptions: string[] = [
  "Vegetarian",
  "Vegan",
  "Gluten-free",
  "Halal",
  "Kosher",
  "Dairy-free",
];

export const plusFeatures: string[] = [
  "Unlimited itinerary swaps",
  "Priority event & price alerts",
  "Offline export",
  "Group trip collaboration",
];
