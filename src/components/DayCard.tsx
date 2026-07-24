import type { Day, Place } from "../types";
import { PlaceCard } from "./PlaceCard";

interface DayCardProps {
  day: Day;
  onSelectPlace: (place: Place) => void;
}

export function DayCard({ day, onSelectPlace }: DayCardProps) {
  return (
    <div className="w-full">
      <div className="mb-3 flex items-center gap-3">
        <div className="-rotate-2 rounded border-2 border-ink px-2 py-1 font-mono text-xs font-bold tracking-widest text-ink">
          DAY {String(day.dayNumber).padStart(2, "0")}
        </div>
        <div>
          <div className="font-display text-lg leading-tight text-ink">{day.label}</div>
          <div className="font-mono text-xs text-ink/50">{day.date}</div>
        </div>
      </div>

      <div>
        {day.places.map((place, index) => (
          <div key={place.id} className="flex gap-3">
            <div className="flex w-5 shrink-0 flex-col items-center">
              <span className="mt-4 h-2.5 w-2.5 shrink-0 rounded-full bg-brass" />
              {index < day.places.length - 1 && <span className="route-line mt-1 flex-1" />}
            </div>
            <div className="flex-1 pb-4">
              <PlaceCard place={place} onSelect={onSelectPlace} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
