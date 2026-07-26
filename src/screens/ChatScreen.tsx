import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MessageCircle, Map } from "lucide-react";
import { useProfileStore } from "../store/profileStore";
import { useChatStore } from "../store/chatStore";
import { ChatThread } from "../components/ChatThread";
import { Composer } from "../components/Composer";
import { QuickPrompts } from "../components/QuickPrompts";
import { PlaceDetailSheet } from "../components/PlaceDetailSheet";
import { BookingModal } from "../components/BookingModal";
import { ItineraryPanel } from "../components/ItineraryPanel";
import type { BookingTarget, Place, Stay } from "../types";

type MobileTab = "chat" | "itinerary";

export function ChatScreen() {
  const navigate = useNavigate();
  const { tripId } = useParams<{ tripId: string }>();
  const profile = useProfileStore((state) => state.profile);

  const messages = useChatStore((state) => state.messages);
  const trip = useChatStore((state) => state.trip);
  const isThinking = useChatStore((state) => state.isThinking);
  const loadTrip = useChatStore((state) => state.loadTrip);
  const sendMessage = useChatStore((state) => state.sendMessage);

  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [bookingTarget, setBookingTarget] = useState<BookingTarget | null>(null);
  const [mobileTab, setMobileTab] = useState<MobileTab>("chat");

  useEffect(() => {
    if (tripId && profile) void loadTrip(tripId, profile);
  }, [tripId, profile, loadTrip]);

  if (!profile || !tripId) return null;

  const hasItinerary = Boolean(trip && trip.days.length > 0);

  const handleBookPlace = (place: Place) => {
    setSelectedPlace(null);
    setBookingTarget({ source: "getyourguide", name: place.name, price: place.price });
  };

  const handleBookStay = (stay: Stay) => {
    setBookingTarget({ source: stay.source, name: stay.name, price: stay.totalPrice });
  };

  const handleSwapPlace = (place: Place) => {
    void sendMessage(`Swap ${place.name} for something else`);
  };

  const handleRemovePlace = (place: Place) => {
    void sendMessage(`Remove ${place.name} from the itinerary`);
  };

  return (
    <div className="flex h-full flex-col bg-parchment">
      <header
        className="flex shrink-0 items-center gap-2 border-b border-hairline bg-parchment/95 px-4 py-3 backdrop-blur"
        style={{ paddingTop: "calc(0.75rem + env(safe-area-inset-top))" }}
      >
        <button
          type="button"
          onClick={() => navigate("/trips")}
          aria-label="Back to trips"
          className="flex h-8 w-8 items-center justify-center rounded-full text-ink/40 transition-colors hover:bg-ink/5 hover:text-ink"
        >
          <Map className="h-4 w-4" />
        </button>
        <div className="min-w-0">
          <div className="truncate font-display text-lg leading-tight text-ink">
            {hasItinerary ? trip!.destination : "New trip"}
          </div>
          {hasItinerary && (
            <div className="font-mono text-[11px] uppercase tracking-wide text-ink/50">
              {trip!.startDate} – {trip!.endDate}
            </div>
          )}
        </div>
      </header>

      <div className="flex shrink-0 border-b border-hairline md:hidden">
        <button
          type="button"
          onClick={() => setMobileTab("chat")}
          className={`flex flex-1 items-center justify-center gap-1.5 py-2.5 font-mono text-xs font-semibold uppercase tracking-wide ${
            mobileTab === "chat" ? "border-b-2 border-brass text-ink" : "text-ink/40"
          }`}
        >
          <MessageCircle className="h-3.5 w-3.5" />
          Chat
        </button>
        <button
          type="button"
          onClick={() => setMobileTab("itinerary")}
          className={`flex flex-1 items-center justify-center gap-1.5 py-2.5 font-mono text-xs font-semibold uppercase tracking-wide ${
            mobileTab === "itinerary" ? "border-b-2 border-brass text-ink" : "text-ink/40"
          }`}
        >
          <Map className="h-3.5 w-3.5" />
          Itinerary
          {hasItinerary && <span className="h-1.5 w-1.5 rounded-full bg-brass" />}
        </button>
      </div>

      <div className="flex min-h-0 flex-1">
        <div className={`min-w-0 flex-1 flex-col ${mobileTab === "chat" ? "flex" : "hidden"} md:flex`}>
          <ChatThread
            messages={messages}
            isThinking={isThinking}
            onSelectPlace={setSelectedPlace}
            onBookStay={handleBookStay}
          />

          <div
            className="shrink-0 border-t border-hairline bg-parchment"
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
          >
            {hasItinerary && <QuickPrompts onSelect={sendMessage} disabled={isThinking} />}
            <Composer onSend={sendMessage} isThinking={isThinking} hasTrip={hasItinerary} />
          </div>
        </div>

        <div
          className={`w-full shrink-0 flex-col border-hairline bg-parchment md:flex md:w-[380px] md:border-l lg:w-[420px] ${
            mobileTab === "itinerary" ? "flex" : "hidden"
          }`}
        >
          <ItineraryPanel
            trip={trip}
            onSelectPlace={setSelectedPlace}
            onBookStay={handleBookStay}
            onSwapPlace={handleSwapPlace}
            onRemovePlace={handleRemovePlace}
          />
        </div>
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
