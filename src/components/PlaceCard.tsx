import { useState } from "react";
import { Star, Clock, RefreshCw, X } from "lucide-react";
import type { Place } from "../types";
import { categoryLabel } from "../lib/placeVisuals";
import { PlaceMedia } from "./PlaceMedia";
import { MediaLightbox } from "./MediaLightbox";

interface PlaceCardProps {
  place: Place;
  onSelect: (place: Place) => void;
  /** When provided, renders an inline "swap" action — used by the always-visible itinerary panel. */
  onSwap?: (place: Place) => void;
  /** When provided, renders an inline "remove" action — used by the always-visible itinerary panel. */
  onRemove?: (place: Place) => void;
}

export function PlaceCard({ place, onSelect, onSwap, onRemove }: PlaceCardProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const hasActions = Boolean(onSwap || onRemove);

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-hairline bg-card shadow-sm transition-transform hover:-translate-y-0.5">
      <PlaceMedia place={place} onExpand={() => setLightboxOpen(true)} />

      <div
        role="button"
        tabIndex={0}
        onClick={() => onSelect(place)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onSelect(place);
          }
        }}
        className="ticket-edge cursor-pointer px-4 pb-4 pt-3.5 text-left"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="font-display text-base leading-snug text-ink">{place.name}</div>
            <div className="mt-0.5 font-mono text-[11px] uppercase tracking-wide text-ink/50">
              {categoryLabel[place.category]}
              {place.timeSlot ? ` · ${place.timeSlot}` : ""}
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
      </div>

      {hasActions && (
        <div className="flex items-center gap-2 px-4 pb-3 pt-2">
          {onSwap && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onSwap(place);
              }}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-hairline bg-parchment py-1.5 font-mono text-[11px] font-medium uppercase tracking-wide text-ink/70 transition-colors hover:border-brass/60"
            >
              <RefreshCw className="h-3 w-3" />
              Swap
            </button>
          )}
          {onRemove && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onRemove(place);
              }}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-hairline bg-parchment py-1.5 font-mono text-[11px] font-medium uppercase tracking-wide text-ink/70 transition-colors hover:border-red-400/60 hover:text-red-500"
            >
              <X className="h-3 w-3" />
              Remove
            </button>
          )}
        </div>
      )}

      {lightboxOpen && <MediaLightbox place={place} onClose={() => setLightboxOpen(false)} />}
    </div>
  );
}
