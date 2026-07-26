import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, ArrowRight, MapPin, Trash2 } from "lucide-react";
import { useTripsStore } from "../store/tripsStore";
import { Button } from "../components/Button";
import type { TripSummary } from "../types";

function isPast(trip: TripSummary): boolean {
  if (!trip.endDate) return false;
  return trip.endDate < new Date().toISOString().slice(0, 10);
}

function TripRow({ trip, onOpen, onDelete }: { trip: TripSummary; onOpen: () => void; onDelete: () => void }) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onOpen}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-line bg-card px-4 py-3.5 text-left transition-colors hover:border-accent/50"
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
      <button
        type="button"
        onClick={onDelete}
        aria-label={`Delete trip to ${trip.destination}`}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-ink/30 transition-colors hover:bg-danger/10 hover:text-danger"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

export function TripsScreen() {
  const navigate = useNavigate();
  const trips = useTripsStore((state) => state.trips);
  const hasLoaded = useTripsStore((state) => state.hasLoaded);
  const fetchTrips = useTripsStore((state) => state.fetchTrips);
  const createTrip = useTripsStore((state) => state.createTrip);
  const deleteTrip = useTripsStore((state) => state.deleteTrip);
  const [creating, setCreating] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<TripSummary | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await deleteTrip(pendingDelete.id);
      setPendingDelete(null);
    } finally {
      setDeleting(false);
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
            <TripRow key={trip.id} trip={trip} onOpen={() => navigate(`/trips/${trip.id}`)} onDelete={() => setPendingDelete(trip)} />
          ))}
        </div>
      )}

      {past.length > 0 && (
        <div className="space-y-2">
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink/50">Past</div>
          {past.map((trip) => (
            <TripRow key={trip.id} trip={trip} onOpen={() => navigate(`/trips/${trip.id}`)} onDelete={() => setPendingDelete(trip)} />
          ))}
        </div>
      )}

      {pendingDelete && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 sm:items-center" onClick={() => setPendingDelete(null)}>
          <div
            className="w-full max-w-sm rounded-t-3xl border border-line bg-card p-6 shadow-xl sm:rounded-3xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className="font-display text-lg text-ink">Delete trip to {pendingDelete.destination}?</h2>
            <p className="mt-1.5 text-sm text-ink/70">
              This permanently deletes the itinerary and chat history for this trip. This can't be undone.
            </p>
            <div className="mt-5 flex gap-2">
              <Button variant="ghost" onClick={() => setPendingDelete(null)} disabled={deleting} className="flex-1 border border-line">
                Cancel
              </Button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
                className="flex-1 rounded-full bg-danger py-3 text-sm font-semibold text-white transition-colors hover:bg-danger/90 disabled:bg-danger/50"
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
