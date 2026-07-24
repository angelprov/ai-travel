import { useEffect, useState } from "react";
import { X, Lock, ExternalLink } from "lucide-react";
import type { BookingTarget } from "../types";
import { getBookingUrl, getSourceDomain, getSourceLabel } from "../lib/bookingService";

interface BookingModalProps {
  target: BookingTarget;
  onClose: () => void;
}

export function BookingModal({ target, onClose }: BookingModalProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const domain = getSourceDomain(target.source);
  const url = getBookingUrl(target.source, target.name);
  const isEmbeddable = target.source === "getyourguide" || target.source === "booking";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className={`absolute inset-0 bg-ink/50 transition-opacity ${visible ? "opacity-100" : "opacity-0"}`}
      />

      <div
        className={`relative z-10 w-full max-w-md overflow-hidden rounded-t-3xl border border-hairline bg-card shadow-xl transition-transform duration-200 sm:rounded-3xl ${
          visible ? "translate-y-0" : "translate-y-8"
        }`}
      >
        {isEmbeddable ? (
          <>
            {/* Mock "embedded widget" frame: real integration would load the
                partner's official widget script here using a partner/affiliate
                ID, no private API access needed. */}
            <div className="flex items-center gap-2 border-b border-hairline bg-parchment px-4 py-2.5">
              <div className="flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-hairline" />
                <span className="h-2.5 w-2.5 rounded-full bg-hairline" />
                <span className="h-2.5 w-2.5 rounded-full bg-hairline" />
              </div>
              <div className="flex flex-1 items-center justify-center gap-1.5 font-mono text-xs text-ink/60">
                <Lock className="h-3 w-3" />
                {domain}
              </div>
              <button type="button" onClick={onClose} aria-label="Close" className="text-ink/50 hover:text-ink">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5">
              <div className="font-mono text-[11px] uppercase tracking-widest text-teal">
                {getSourceLabel(target.source)} widget
              </div>
              <h2 className="mt-1 font-display text-xl text-ink">{target.name}</h2>

              <div className="mt-4 rounded-xl border border-dashed border-hairline bg-parchment px-4 py-6 text-center">
                <p className="font-mono text-xs text-ink/50">Live availability & price would load here</p>
                <p className="mt-2 font-mono text-lg font-semibold text-ink">{target.price}</p>
              </div>

              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-teal py-3 text-sm font-semibold text-white transition-colors hover:bg-teal-dark"
              >
                Continue to checkout
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </>
        ) : (
          <div className="p-6">
            <div className="flex items-start justify-between">
              <div className="font-mono text-[11px] uppercase tracking-widest text-teal">
                Airbnb hand-off
              </div>
              <button type="button" onClick={onClose} aria-label="Close" className="text-ink/50 hover:text-ink">
                <X className="h-4 w-4" />
              </button>
            </div>

            <h2 className="mt-1 font-display text-xl text-ink">{target.name}</h2>
            <p className="mt-1 font-mono text-lg font-semibold text-ink">{target.price}</p>

            <p className="mt-4 text-sm text-ink/70">
              Airbnb doesn't offer an embeddable booking widget for partners, so this one hands
              off to their site to complete — everything else stays in this conversation.
            </p>

            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-ink py-3 text-sm font-semibold text-parchment transition-colors hover:bg-ink/90"
            >
              Continue on airbnb.com
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
