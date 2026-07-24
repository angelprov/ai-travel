import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Compass } from "lucide-react";
import { useProfileStore } from "../store/profileStore";
import { useChatStore } from "../store/chatStore";
import { ChatThread } from "../components/ChatThread";
import { Composer } from "../components/Composer";
import { QuickPrompts } from "../components/QuickPrompts";
import { PlaceDetailSheet } from "../components/PlaceDetailSheet";
import { BookingModal } from "../components/BookingModal";
import type { BookingTarget, Place, Stay } from "../types";

export function ChatScreen() {
  const navigate = useNavigate();
  const profile = useProfileStore((state) => state.profile);

  const messages = useChatStore((state) => state.messages);
  const trip = useChatStore((state) => state.trip);
  const isThinking = useChatStore((state) => state.isThinking);
  const initialize = useChatStore((state) => state.initialize);
  const sendMessage = useChatStore((state) => state.sendMessage);

  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [bookingTarget, setBookingTarget] = useState<BookingTarget | null>(null);

  useEffect(() => {
    if (profile) initialize(profile);
  }, [profile, initialize]);

  useEffect(() => {
    if (trip) navigate(`/trip/${trip.id}`, { replace: true });
  }, [trip, navigate]);

  if (!profile) return null;

  const handleBookPlace = (place: Place) => {
    setSelectedPlace(null);
    setBookingTarget({ source: "getyourguide", name: place.name, price: place.price });
  };

  const handleBookStay = (stay: Stay) => {
    setBookingTarget({ source: stay.source, name: stay.name, price: stay.totalPrice });
  };

  return (
    <div className="flex h-dvh flex-col bg-parchment">
      <header className="flex shrink-0 items-center gap-2 border-b border-hairline bg-parchment/95 px-4 py-3 backdrop-blur">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-brass">
          <Compass className="h-4 w-4" />
        </div>
        <div>
          <div className="font-display text-lg leading-tight text-ink">Waypoint</div>
          {trip && (
            <div className="font-mono text-[11px] uppercase tracking-wide text-ink/50">
              {trip.destination}
            </div>
          )}
        </div>
      </header>

      <ChatThread
        messages={messages}
        isThinking={isThinking}
        onSelectPlace={setSelectedPlace}
        onBookStay={handleBookStay}
      />

      <div className="shrink-0 border-t border-hairline bg-parchment">
        {trip && <QuickPrompts onSelect={sendMessage} disabled={isThinking} />}
        <Composer onSend={sendMessage} isThinking={isThinking} hasTrip={Boolean(trip)} />
      </div>

      {selectedPlace && (
        <PlaceDetailSheet
          place={selectedPlace}
          onClose={() => setSelectedPlace(null)}
          onBook={handleBookPlace}
        />
      )}

      {bookingTarget && (
        <BookingModal target={bookingTarget} onClose={() => setBookingTarget(null)} />
      )}
    </div>
  );
}
