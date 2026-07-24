import { Play, Expand } from "lucide-react";
import type { Place } from "../types";
import { categoryIcon, categoryLabel, getPlaceGradient, hasVideoPreview } from "../lib/placeVisuals";

interface PlaceMediaProps {
  place: Place;
  onExpand: () => void;
  height?: string;
}

export function PlaceMedia({ place, onExpand, height = "h-28" }: PlaceMediaProps) {
  const Icon = categoryIcon[place.category];
  const isVideo = hasVideoPreview(place.category);
  const gradient = getPlaceGradient(place.id);

  return (
    <div className={`relative ${height} w-full overflow-hidden`} style={{ backgroundImage: gradient }}>
      <Icon className="pointer-events-none absolute -bottom-4 -right-4 h-24 w-24 text-white/15" strokeWidth={1.5} />

      <span className="absolute left-2 top-2 rounded-full bg-ink/50 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-white">
        {categoryLabel[place.category]}
      </span>

      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onExpand();
        }}
        aria-label={isVideo ? `Preview ${place.name}` : `View photo of ${place.name}`}
        className="absolute inset-0 flex items-center justify-center"
      >
        {isVideo ? (
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-ink shadow-md transition-transform hover:scale-105">
            <Play className="h-4 w-4 translate-x-0.5 fill-ink" />
          </span>
        ) : (
          <span className="absolute bottom-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-ink/50 text-white">
            <Expand className="h-3.5 w-3.5" />
          </span>
        )}
      </button>
    </div>
  );
}
