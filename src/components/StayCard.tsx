import { Star, BedDouble } from "lucide-react";
import type { Stay } from "../types";
import { getSourceLabel } from "../lib/bookingService";
import { getPlaceGradient } from "../lib/placeVisuals";

interface StayCardProps {
  stay: Stay;
  onBook: (stay: Stay) => void;
}

export function StayCard({ stay, onBook }: StayCardProps) {
  return (
    <div className="w-full overflow-hidden rounded-2xl border border-hairline bg-card shadow-sm">
      <div className="relative h-24 w-full" style={{ backgroundImage: getPlaceGradient(stay.id) }}>
        <BedDouble className="pointer-events-none absolute -bottom-3 -right-3 h-20 w-20 text-white/15" strokeWidth={1.5} />
        <span className="absolute left-2 top-2 rounded-full bg-ink/50 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-white">
          Stay
        </span>
      </div>

      <div className="ticket-edge px-4 pb-4 pt-3.5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="font-display text-base leading-snug text-ink">{stay.name}</div>
            <div className="mt-0.5 font-mono text-[11px] uppercase tracking-wide text-ink/50">
              {stay.neighborhood}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1 font-mono text-xs text-ink/70">
            <Star className="h-3.5 w-3.5 fill-brass text-brass" />
            {stay.rating.toFixed(1)}
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between pt-3">
          <div className="font-mono text-xs text-ink/60">
            {stay.pricePerNight} / night · {stay.nights} nights
          </div>
          <div className="font-mono text-sm font-semibold text-ink">{stay.totalPrice}</div>
        </div>
      </div>

      <div className="px-4 pb-4">
        <button
          type="button"
          onClick={() => onBook(stay)}
          className="w-full rounded-full bg-teal py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-dark"
        >
          View on {getSourceLabel(stay.source)}
        </button>
      </div>
    </div>
  );
}
