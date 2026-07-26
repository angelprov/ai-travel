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
        <div className="flex h-8 min-w-8 items-center justify-center rounded-full bg-ink px-2.5 text-xs font-semibold text-white">
          Day {day.dayNumber}
        </div>
        <div>
          <div className="font-display text-lg leading-tight text-ink">{day.label}</div>
          <div className="text-xs text-ink/50">{day.date}</div>
        </div>
      </div>

      <div>
        {day.places.map((place, index) => (
          <div key={place.id} className="flex gap-3">
            <div className="flex w-5 shrink-0 flex-col items-center">
              <span className="mt-4 h-2.5 w-2.5 shrink-0 rounded-full bg-accent" />
              {index < day.places.length - 1 && <span className="mt-1 w-px flex-1 bg-line" />}
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
