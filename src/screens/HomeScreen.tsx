import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Compass, Plus, ArrowRight } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { useProfileStore } from "../store/profileStore";
import { useTripsStore } from "../store/tripsStore";
import { Button } from "../components/Button";

export function HomeScreen() {
  const navigate = useNavigate();
  const profile = useProfileStore((state) => state.profile);
  const activeTripSummary = useAuthStore((state) => state.activeTripSummary);
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

  // Paint the "continue" card instantly from the session hydrate's
  // lightweight summary while the full trips list is still loading, then
  // hand off to the live list once it lands (same trip, same order).
  const recent = hasLoaded ? trips.slice(0, 3) : activeTripSummary ? [activeTripSummary] : [];

  return (
    <div className="scrollbar-thin h-full overflow-y-auto px-5 py-6" style={{ paddingTop: "calc(1.5rem + env(safe-area-inset-top))" }}>
      <div className="mb-6 flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-white">
          <Compass className="h-4.5 w-4.5" />
        </div>
        <div>
          <div className="font-display text-xl leading-tight text-ink">Waypoint</div>
          <div className="text-sm text-ink/50">Hi {profile?.name || "there"}, where to next?</div>
        </div>
      </div>

      {recent.length > 0 && (
        <button
          type="button"
          onClick={() => navigate(`/trips/${recent[0].id}`)}
          className="mb-4 w-full rounded-2xl border border-line bg-card p-4 text-left shadow-sm transition-colors hover:border-accent/50"
        >
          <div className="text-[11px] font-semibold uppercase tracking-wide text-teal">Continue planning</div>
          <div className="mt-1 flex items-center justify-between gap-3">
            <div>
              <div className="font-display text-lg text-ink">{recent[0].destination}</div>
              {recent[0].startDate && (
                <div className="text-xs text-ink/50">
                  {recent[0].startDate} – {recent[0].endDate}
                </div>
              )}
            </div>
            <ArrowRight className="h-5 w-5 shrink-0 text-ink/30" />
          </div>
        </button>
      )}

      <Button variant="primary" onClick={handleNewTrip} disabled={creating} className="mb-6 w-full">
        <Plus className="h-4 w-4" />
        {creating ? "Creating…" : "New trip"}
      </Button>

      {hasLoaded && recent.length === 0 && (
        <p className="mb-6 text-sm text-ink/50">
          You haven't planned a trip yet — tap "New trip" and tell me where you want to go.
        </p>
      )}

      {recent.length > 1 && (
        <div>
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink/50">Recent trips</div>
          <div className="space-y-2">
            {recent.slice(1).map((trip) => (
              <button
                key={trip.id}
                type="button"
                onClick={() => navigate(`/trips/${trip.id}`)}
                className="flex w-full items-center justify-between rounded-xl border border-line bg-card px-4 py-3 text-left transition-colors hover:border-accent/50"
              >
                <div>
                  <div className="text-sm font-medium text-ink">{trip.destination}</div>
                  <div className="text-xs text-ink/50">{trip.startDate || "Draft"}</div>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-ink/30" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
