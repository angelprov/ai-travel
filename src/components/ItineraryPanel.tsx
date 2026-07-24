import { useEffect, useState } from "react";
import { Compass, Sun, CloudSun, Cloud, CloudRain, CloudLightning, Radio } from "lucide-react";
import type { Day, Place, Stay, Trip, WeatherSnapshot } from "../types";
import { StayCard } from "./StayCard";
import { PlaceCard } from "./PlaceCard";
import { fetchForecast } from "../lib/weatherService";
import { fetchLiveEvents } from "../lib/eventsService";

interface ItineraryPanelProps {
  trip: Trip | null;
  onSelectPlace: (place: Place) => void;
  onBookStay: (stay: Stay) => void;
  onSwapPlace: (place: Place) => void;
  onRemovePlace: (place: Place) => void;
}

const conditionIcon: Record<WeatherSnapshot["condition"], typeof Sun> = {
  sunny: Sun,
  "partly-cloudy": CloudSun,
  cloudy: Cloud,
  rainy: CloudRain,
  stormy: CloudLightning,
};

function WeatherChip({ forecast }: { forecast?: WeatherSnapshot }) {
  if (!forecast) return null;
  const Icon = conditionIcon[forecast.condition];
  return (
    <div className="flex items-center gap-1 rounded-full border border-hairline bg-card px-2 py-1 font-mono text-[11px] text-ink/70">
      <Icon className="h-3.5 w-3.5 text-teal" />
      {forecast.tempHighC}°/{forecast.tempLowC}°C
    </div>
  );
}

function LocalPulse({ trip }: { trip: Trip }) {
  const [pulse, setPulse] = useState<Place | null>(null);

  useEffect(() => {
    let cancelled = false;
    const referenceDate = trip.days[trip.days.length - 1]?.date ?? trip.startDate;

    fetchLiveEvents(trip.destinationId, referenceDate).then((response) => {
      if (!cancelled && response && response.events.length > 0) {
        setPulse(response.events[0]);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [trip.destinationId, trip.days, trip.startDate]);

  if (!pulse) return null;

  return (
    <div className="mb-5 flex items-center gap-2 rounded-xl border border-hairline bg-card px-3 py-2.5">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal/10 text-teal">
        <Radio className="h-3.5 w-3.5 animate-pulse" />
      </span>
      <div className="min-w-0">
        <div className="font-mono text-[10px] uppercase tracking-widest text-teal">Live in {trip.destination.split(",")[0]}</div>
        <div className="truncate text-sm text-ink">{pulse.name}</div>
      </div>
    </div>
  );
}

function DayWeatherSection({
  day,
  destinationId,
  onSelectPlace,
  onSwapPlace,
  onRemovePlace,
}: {
  day: Day;
  destinationId: string;
  onSelectPlace: (place: Place) => void;
  onSwapPlace: (place: Place) => void;
  onRemovePlace: (place: Place) => void;
}) {
  const [forecast, setForecast] = useState<WeatherSnapshot | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    fetchForecast(destinationId, day.date).then((result) => {
      if (!cancelled && result) setForecast(result);
    });
    return () => {
      cancelled = true;
    };
  }, [destinationId, day.date]);

  return (
    <div className="mb-6">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="-rotate-2 rounded border-2 border-ink px-2 py-1 font-mono text-xs font-bold tracking-widest text-ink">
            DAY {String(day.dayNumber).padStart(2, "0")}
          </div>
          <div>
            <div className="font-display text-lg leading-tight text-ink">{day.label}</div>
            <div className="font-mono text-xs text-ink/50">{day.date}</div>
          </div>
        </div>
        <WeatherChip forecast={forecast} />
      </div>

      <div className="space-y-3">
        {day.places.map((place) => (
          <PlaceCard
            key={place.id}
            place={place}
            onSelect={onSelectPlace}
            onSwap={onSwapPlace}
            onRemove={onRemovePlace}
          />
        ))}
      </div>
    </div>
  );
}

export function ItineraryPanel({ trip, onSelectPlace, onBookStay, onSwapPlace, onRemovePlace }: ItineraryPanelProps) {
  if (!trip) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-ink/5 text-ink/30">
          <Compass className="h-6 w-6" />
        </div>
        <p className="max-w-[220px] text-sm text-ink/50">
          Your itinerary will appear here, live, once we plan your trip — editable with every message you send.
        </p>
      </div>
    );
  }

  return (
    <div className="scrollbar-thin h-full overflow-y-auto px-4 py-5">
      <div className="mb-5">
        <div className="font-mono text-[11px] uppercase tracking-widest text-ink/50">Itinerary</div>
        <h2 className="font-display text-xl text-ink">{trip.destination}</h2>
        <div className="font-mono text-xs text-ink/50">
          {trip.startDate} – {trip.endDate}
        </div>
      </div>

      <LocalPulse trip={trip} />

      <div className="mb-6">
        <StayCard stay={trip.stay} onBook={onBookStay} />
      </div>

      {trip.days.map((day) => (
        <DayWeatherSection
          key={day.id}
          day={day}
          destinationId={trip.destinationId}
          onSelectPlace={onSelectPlace}
          onSwapPlace={onSwapPlace}
          onRemovePlace={onRemovePlace}
        />
      ))}
    </div>
  );
}
