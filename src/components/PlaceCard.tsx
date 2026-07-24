import { Star, Clock, MapPin, UtensilsCrossed, PartyPopper, Ticket } from "lucide-react";
import type { Place } from "../types";

const categoryIcon: Record<Place["category"], typeof MapPin> = {
  sight: MapPin,
  restaurant: UtensilsCrossed,
  event: PartyPopper,
  activity: Ticket,
};

const categoryLabel: Record<Place["category"], string> = {
  sight: "Sight",
  restaurant: "Restaurant",
  event: "Event",
  activity: "Activity",
};

interface PlaceCardProps {
  place: Place;
  onSelect: (place: Place) => void;
}

export function PlaceCard({ place, onSelect }: PlaceCardProps) {
  const Icon = categoryIcon[place.category];

  return (
    <button
      type="button"
      onClick={() => onSelect(place)}
      className="ticket-edge w-full rounded-2xl border border-hairline bg-card px-4 pb-4 pt-3.5 text-left shadow-sm transition-transform hover:-translate-y-0.5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <Icon className="mt-0.5 h-4 w-4 shrink-0 text-teal" />
          <div>
            <div className="font-display text-base leading-snug text-ink">{place.name}</div>
            <div className="mt-0.5 font-mono text-[11px] uppercase tracking-wide text-ink/50">
              {categoryLabel[place.category]}
              {place.timeSlot ? ` · ${place.timeSlot}` : ""}
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1 font-mono text-xs text-ink/70">
          <Star className="h-3.5 w-3.5 fill-brass text-brass" />
          {place.rating.toFixed(1)}
        </div>
      </div>

      <p className="mt-2 text-sm text-ink/70">{place.description}</p>

      <div className="mt-4 flex items-center justify-between pt-3">
        <div className="flex items-center gap-1 font-mono text-xs text-ink/60">
          <Clock className="h-3.5 w-3.5" />
          {place.duration}
        </div>
        <div className="font-mono text-sm font-semibold text-ink">{place.price}</div>
      </div>
    </button>
  );
}
