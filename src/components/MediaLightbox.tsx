import { useState } from "react";
import { createPortal } from "react-dom";
import { Play, Pause, X } from "lucide-react";
import type { Place } from "../types";
import { categoryIcon, categoryLabel, getPlaceGradient, hasVideoPreview } from "../lib/placeVisuals";
import { useEscapeKey } from "../lib/useEscapeKey";

interface MediaLightboxProps {
  place: Place;
  onClose: () => void;
}

export function MediaLightbox({ place, onClose }: MediaLightboxProps) {
  const [playing, setPlaying] = useState(false);
  const Icon = categoryIcon[place.category];
  const isVideo = hasVideoPreview(place.category);
  const gradient = getPlaceGradient(place.id);

  useEscapeKey(onClose);

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-ink/70" />

      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl bg-card shadow-xl">
        <div className="relative h-56 w-full sm:h-64" style={{ backgroundImage: gradient }}>
          <Icon className="pointer-events-none absolute -bottom-6 -right-6 h-32 w-32 text-white/10" strokeWidth={1} />

          {isVideo && (
            <button
              type="button"
              onClick={() => setPlaying((prev) => !prev)}
              aria-label={playing ? "Pause preview" : "Play preview"}
              className="absolute inset-0 flex items-center justify-center"
            >
              <span
                className={`flex h-16 w-16 items-center justify-center rounded-full bg-white/90 text-ink shadow-lg transition-transform ${playing ? "scale-90" : "hover:scale-105"}`}
              >
                {playing ? <Pause className="h-7 w-7 fill-ink" /> : <Play className="h-7 w-7 translate-x-0.5 fill-ink" />}
              </span>
            </button>
          )}

          {isVideo && playing && (
            <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-ink/60 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
              Playing preview
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-ink/50 text-white hover:bg-ink/70"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-teal">
            {isVideo ? "Preview" : "Photo"} · {categoryLabel[place.category]}
          </div>
          <h3 className="mt-1 font-display text-xl text-ink">{place.name}</h3>
          <p className="mt-2 text-sm text-ink/70">{place.description}</p>
        </div>
      </div>
    </div>,
    document.body,
  );
}
