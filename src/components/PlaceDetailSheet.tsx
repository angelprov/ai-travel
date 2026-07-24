import { useEffect, useState } from "react";
import { X, Star, Clock, Check } from "lucide-react";
import type { Place } from "../types";

interface PlaceDetailSheetProps {
  place: Place;
  onClose: () => void;
  onBook: (place: Place) => void;
}

export function PlaceDetailSheet({ place, onClose, onBook }: PlaceDetailSheetProps) {
  const [visible, setVisible] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    setSaved(false);
  }, [place.id]);

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className={`absolute inset-0 bg-ink/40 transition-opacity ${visible ? "opacity-100" : "opacity-0"}`}
      />

      <div
        className={`relative z-10 w-full max-w-lg rounded-t-3xl border border-hairline bg-parchment p-6 shadow-xl transition-transform duration-200 sm:rounded-3xl ${
          visible ? "translate-y-0" : "translate-y-8"
        }`}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-card text-ink/60 hover:text-ink"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="font-mono text-[11px] uppercase tracking-widest text-teal">
          {place.category}
        </div>
        <h2 className="mt-1 font-display text-2xl text-ink">{place.name}</h2>

        <div className="mt-3 flex items-center gap-4 font-mono text-sm text-ink/70">
          <span className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-brass text-brass" />
            {place.rating.toFixed(1)}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {place.duration}
          </span>
          <span className="font-semibold text-ink">{place.price}</span>
        </div>

        <p className="mt-4 text-sm text-ink/80">{place.description}</p>

        <div className="mt-4 rounded-xl border border-hairline bg-card px-4 py-3">
          <div className="font-mono text-[11px] uppercase tracking-wide text-brass-dark">
            Why this was suggested
          </div>
          <p className="mt-1 text-sm text-ink/80">{place.whySuggested}</p>
        </div>

        {place.bookingAction === "getyourguide" ? (
          <button
            type="button"
            onClick={() => onBook(place)}
            className="mt-6 w-full rounded-full bg-teal py-3 text-sm font-semibold text-white transition-colors hover:bg-teal-dark"
          >
            Reserve on GetYourGuide
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setSaved(true)}
            disabled={saved}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-brass py-3 text-sm font-semibold text-ink transition-colors hover:bg-brass-dark disabled:bg-teal disabled:text-white"
          >
            {saved ? (
              <>
                <Check className="h-4 w-4" /> Saved to itinerary
              </>
            ) : (
              "Save to itinerary"
            )}
          </button>
        )}
      </div>
    </div>
  );
}
