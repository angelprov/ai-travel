import { AlertTriangle, Compass } from "lucide-react";
import type { ChatMessage, Place, Stay } from "../types";
import { DayCard } from "./DayCard";
import { StayCard } from "./StayCard";
import { PlaceCard } from "./PlaceCard";

interface MessageBubbleProps {
  message: ChatMessage;
  onSelectPlace: (place: Place) => void;
  onBookStay: (stay: Stay) => void;
}

export function MessageBubble({ message, onSelectPlace, onBookStay }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const isError = message.status === "error";

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-ink px-4 py-3 text-sm text-white sm:max-w-[70%]">
          {message.text}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2.5">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink text-white">
        <Compass className="h-4 w-4" />
      </div>
      <div className="flex min-w-0 max-w-[90%] flex-col gap-3 sm:max-w-[75%]">
        <div
          className={`rounded-2xl rounded-tl-sm px-4 py-3 text-sm ${
            isError
              ? "border border-danger/30 bg-danger/5 text-ink"
              : "bg-card text-ink shadow-sm"
          }`}
        >
          {isError && (
            <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-danger">
              <AlertTriangle className="h-3.5 w-3.5" />
              Couldn't generate a reply
            </div>
          )}
          {message.text}
        </div>

        {message.attachments?.stay && (
          <StayCard stay={message.attachments.stay} onBook={onBookStay} />
        )}

        {message.attachments?.days?.map((day) => (
          <DayCard key={day.id} day={day} onSelectPlace={onSelectPlace} />
        ))}

        {message.attachments?.place && (
          <PlaceCard place={message.attachments.place} onSelect={onSelectPlace} />
        )}
      </div>
    </div>
  );
}
