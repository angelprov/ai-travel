import type { BookingSource } from "../types";

// ---------------------------------------------------------------------------
// Mock booking layer. Returns plausible, non-functional deep links so the
// booking modal has something real-looking to point "Continue to checkout" /
// "Continue on airbnb.com" at.
//
// TODO: replace with real partner widget embed / API call.
// GetYourGuide and Booking.com both offer official embeddable widgets
// through their partner/affiliate dashboards (partner ID + widget script,
// no private API access needed). Airbnb has no partner widget, so it will
// always remain a hand-off link rather than embedded content.
// ---------------------------------------------------------------------------

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function getBookingUrl(source: BookingSource, name: string): string {
  const slug = slugify(name);

  switch (source) {
    case "getyourguide":
      return `https://www.getyourguide.com/s/?q=${slug}`;
    case "airbnb":
      return `https://www.airbnb.com/s/homes?query=${slug}`;
    case "booking":
      return `https://www.booking.com/searchresults.html?ss=${slug}`;
    default: {
      const exhaustiveCheck: never = source;
      return exhaustiveCheck;
    }
  }
}

export function getSourceDomain(source: BookingSource): string {
  switch (source) {
    case "getyourguide":
      return "getyourguide.com";
    case "airbnb":
      return "airbnb.com";
    case "booking":
      return "booking.com";
    default: {
      const exhaustiveCheck: never = source;
      return exhaustiveCheck;
    }
  }
}

export function getSourceLabel(source: BookingSource): string {
  switch (source) {
    case "getyourguide":
      return "GetYourGuide";
    case "airbnb":
      return "Airbnb";
    case "booking":
      return "Booking.com";
    default: {
      const exhaustiveCheck: never = source;
      return exhaustiveCheck;
    }
  }
}
