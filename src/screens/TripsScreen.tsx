import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, ArrowRight, MapPin } from "lucide-react";
import { useTripsStore } from "../store/tripsStore";
import { Button } from "../components/Button";
import type { TripSummary } from "../types";

function isPast(trip: TripSummary): boolean {
  if (!trip.endDate) return false;
  return trip.endDate < new Date().toISOString().slice(0, 10);
}

function TripRow({ trip, onOpen }: { trip: TripSummary; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center gap-3 rounded-xl border border-line bg-card px-4 py-3.5 text-left transition-colors hover:border-accent/50"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal/10 text-teal">
        <MapPin className="h-4.5 w-4.5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-ink">{trip.destination}</div>
        <div className="text-xs text-ink/50">
          {trip.status === "draft" ? "Draft — tap to start planning" : `${trip.startDate} – ${trip.endDate}`}
        </div>
      </div>
      <ArrowRight className="h-4 w-4 shrink-0 text-ink/30" />
    </button>
  );
}

export function TripsScreen() {
  const navigate = useNavigate();
  const trips = useTripsStore((state) => state.trips);
  const hasLoaded = useTripsStore((state) => state.hasLoaded);
  const fetchTrips = useTripsStore((state) => state.fetchTrips);
  const createTrip = useTripsStore((state) => state.createTrip);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  const handleNewTrip = async () => {
    setCreating(true);
    try {
      const trip = await createTrip();
      navigate(`/trips/${trip.id}`);
    } finally {
      setCreating(false);
    }
  };

  const upcoming = trips.filter((trip) => !isPast(trip));
  const past = trips.filter(isPast);

  return (
    <div className="scrollbar-thin h-full overflow-y-auto px-5 py-6" style={{ paddingTop: "calc(1.5rem + env(safe-area-inset-top))" }}>
      <div className="mb-5 flex items-center justify-between gap-3">
        <h1 className="font-display text-2xl text-ink">Trips</h1>
        <Button variant="primary" onClick={handleNewTrip} disabled={creating} className="!px-4 !py-2 text-sm">
          <Plus className="h-4 w-4" />
          New
        </Button>
      </div>

      {hasLoaded && trips.length === 0 && (
        <p className="text-sm text-ink/50">No trips yet — tap "New" to start planning one.</p>
      )}

      {upcoming.length > 0 && (
        <div className="mb-6 space-y-2">
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink/50">Upcoming</div>
          {upcoming.map((trip) => (
            <TripRow key={trip.id} trip={trip} onOpen={() => navigate(`/trips/${trip.id}`)} />
          ))}
        </div>
      )}

      {past.length > 0 && (
        <div className="space-y-2">
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink/50">Past</div>
          {past.map((trip) => (
            <TripRow key={trip.id} trip={trip} onOpen={() => navigate(`/trips/${trip.id}`)} />
          ))}
        </div>
      )}
    </div>
  );
}
