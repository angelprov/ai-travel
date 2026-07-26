import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Star, BedDouble, ArrowRight } from "lucide-react";
import { useTripsStore } from "../store/tripsStore";
import { getSourceLabel } from "../lib/bookingService";
import { getPlaceGradient } from "../lib/placeVisuals";

export function StaysScreen() {
  const navigate = useNavigate();
  const trips = useTripsStore((state) => state.trips);
  const hasLoaded = useTripsStore((state) => state.hasLoaded);
  const fetchTrips = useTripsStore((state) => state.fetchTrips);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  const stays = trips.filter((trip) => trip.stay);

  return (
    <div className="scrollbar-thin h-full overflow-y-auto px-5 py-6" style={{ paddingTop: "calc(1.5rem + env(safe-area-inset-top))" }}>
      <h1 className="mb-5 font-display text-2xl text-ink">Stays</h1>

      {hasLoaded && stays.length === 0 && (
        <p className="text-sm text-ink/50">
          Once a trip has an itinerary, its accommodation will show up here.
        </p>
      )}

      <div className="space-y-3">
        {stays.map((trip) => {
          const stay = trip.stay!;
          return (
            <button
              key={trip.id}
              type="button"
              onClick={() => navigate(`/trips/${trip.id}`)}
              className="w-full overflow-hidden rounded-2xl border border-hairline bg-card text-left shadow-sm transition-colors hover:border-brass/50"
            >
              <div className="relative h-20 w-full" style={{ backgroundImage: getPlaceGradient(stay.id) }}>
                <BedDouble className="pointer-events-none absolute -bottom-2 -right-2 h-16 w-16 text-white/15" strokeWidth={1.5} />
                <span className="absolute left-2 top-2 rounded-full bg-ink/50 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-white">
                  {trip.destination}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-ink">{stay.name}</div>
                  <div className="mt-0.5 flex items-center gap-2 font-mono text-[11px] text-ink/50">
                    <span>{stay.neighborhood}</span>
                    <span className="flex items-center gap-0.5">
                      <Star className="h-3 w-3 fill-brass text-brass" />
                      {stay.rating.toFixed(1)}
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="font-mono text-xs text-ink/50">{getSourceLabel(stay.source)}</span>
                  <ArrowRight className="h-4 w-4 text-ink/30" />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
