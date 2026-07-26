import { prisma } from "../db/client.js";
import type { Place, Stay, StaySummary, Trip, TripStatus, TripSummary } from "../types.js";

interface PlaceRow {
  id: string;
  name: string;
  category: string;
  rating: number;
  duration: string;
  price: string;
  description: string;
  whySuggested: string;
  bookingAction: string;
  date: string | null;
  timeSlot: string | null;
  openHoursStart: string | null;
  openHoursEnd: string | null;
}

interface StayRow {
  id: string;
  name: string;
  source: string;
  neighborhood: string;
  pricePerNight: string;
  rating: number;
  nights: number;
  totalPrice: string;
  imageDescription: string;
}

function toPlace(row: PlaceRow): Place {
  return {
    id: row.id,
    name: row.name,
    category: row.category as Place["category"],
    rating: row.rating,
    duration: row.duration,
    price: row.price,
    description: row.description,
    whySuggested: row.whySuggested,
    bookingAction: row.bookingAction as Place["bookingAction"],
    date: row.date ?? undefined,
    timeSlot: row.timeSlot ?? undefined,
    openHours:
      row.openHoursStart && row.openHoursEnd ? { start: row.openHoursStart, end: row.openHoursEnd } : undefined,
  };
}

function toStay(row: StayRow): Stay {
  return {
    id: row.id,
    name: row.name,
    source: row.source as Stay["source"],
    neighborhood: row.neighborhood,
    pricePerNight: row.pricePerNight,
    rating: row.rating,
    nights: row.nights,
    totalPrice: row.totalPrice,
    imageDescription: row.imageDescription,
  };
}

function toStaySummary(row: StayRow): StaySummary {
  return {
    id: row.id,
    name: row.name,
    source: row.source as StaySummary["source"],
    neighborhood: row.neighborhood,
    pricePerNight: row.pricePerNight,
    rating: row.rating,
    imageDescription: row.imageDescription,
  };
}

/** Lightweight list for Trips/Stays/Home — no days/places, just enough to render a row. */
export async function listTrips(userId: string): Promise<TripSummary[]> {
  const rows = await prisma.trip.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: { stay: true },
  });

  return rows.map((row) => ({
    id: row.id,
    destinationId: row.destinationId,
    destination: row.destination,
    startDate: row.startDate,
    endDate: row.endDate,
    travelerCount: row.travelerCount,
    status: row.status as TripStatus,
    createdAt: row.createdAt.getTime(),
    updatedAt: row.updatedAt.getTime(),
    stay: row.stay ? toStaySummary(row.stay) : null,
  }));
}

/** The most recently touched trip, for Home's "continue planning" card. Null if the user has none yet. */
export async function getMostRecentTrip(userId: string): Promise<TripSummary | null> {
  const trips = await listTrips(userId);
  return trips[0] ?? null;
}

/**
 * Full trip detail, scoped to its owner — the `userId` filter is the
 * authorization check, not just a lookup key, so a foreign tripId 404s the
 * same way a nonexistent one does rather than leaking existence.
 */
export async function getTripById(userId: string, tripId: string): Promise<Trip | null> {
  const row = await prisma.trip.findUnique({
    where: { id: tripId, userId },
    include: {
      stay: true,
      days: { orderBy: { dayNumber: "asc" }, include: { places: { orderBy: { sortOrder: "asc" } } } },
    },
  });

  if (!row) return null;

  return {
    id: row.id,
    destinationId: row.destinationId,
    destination: row.destination,
    startDate: row.startDate,
    endDate: row.endDate,
    travelerCount: row.travelerCount,
    status: row.status as TripStatus,
    days: row.days.map((day) => ({
      id: day.id,
      dayNumber: day.dayNumber,
      date: day.date,
      label: day.label,
      places: day.places.map(toPlace),
    })),
    stay: row.stay ? toStay(row.stay) : null,
  };
}

export interface CreateTripInput {
  destination?: string;
  destinationId?: string;
  startDate?: string;
  endDate?: string;
  travelerCount?: number;
}

/** Creates an empty draft trip (no days/stay yet) — the "New Trip" action. Real content lands via the first generate_trip chat turn. */
export async function createTrip(userId: string, input: CreateTripInput): Promise<TripSummary> {
  const row = await prisma.trip.create({
    data: {
      userId,
      destination: input.destination ?? "New trip",
      destinationId: input.destinationId ?? "",
      startDate: input.startDate ?? "",
      endDate: input.endDate ?? "",
      travelerCount: input.travelerCount ?? 2,
      status: "draft",
    },
  });

  return {
    id: row.id,
    destinationId: row.destinationId,
    destination: row.destination,
    startDate: row.startDate,
    endDate: row.endDate,
    travelerCount: row.travelerCount,
    status: row.status as TripStatus,
    createdAt: row.createdAt.getTime(),
    updatedAt: row.updatedAt.getTime(),
    stay: null,
  };
}

export async function deleteTrip(userId: string, tripId: string): Promise<void> {
  await prisma.trip.deleteMany({ where: { id: tripId, userId } });
}

/**
 * Replace strategy: this trip's days/places/stay are swapped out whole on
 * every mutation, but — unlike the old single-trip version — the `Trip` row
 * itself is updated in place, never deleted and recreated. That matters now
 * that `ChatMessage.tripId` cascades off `Trip`: deleting the trip row would
 * silently wipe its entire chat history on every single itinerary edit.
 * Everything is scoped to this one trip's id, so every *other* trip the
 * user owns is untouched.
 */
export async function saveTrip(userId: string, tripId: string, trip: Trip): Promise<Trip> {
  const owned = await prisma.trip.findUnique({ where: { id: tripId, userId }, select: { id: true } });
  if (!owned) throw new Error("Trip not found");

  await prisma.$transaction([
    prisma.trip.update({
      where: { id: tripId },
      data: {
        destinationId: trip.destinationId,
        destination: trip.destination,
        startDate: trip.startDate,
        endDate: trip.endDate,
        travelerCount: trip.travelerCount,
        status: "active",
      },
    }),
    prisma.day.deleteMany({ where: { tripId } }),
    prisma.stay.deleteMany({ where: { tripId } }),
    ...(trip.stay
      ? [
          prisma.stay.create({
            data: {
              tripId,
              name: trip.stay.name,
              source: trip.stay.source,
              neighborhood: trip.stay.neighborhood,
              pricePerNight: trip.stay.pricePerNight,
              rating: trip.stay.rating,
              nights: trip.stay.nights,
              totalPrice: trip.stay.totalPrice,
              imageDescription: trip.stay.imageDescription,
            },
          }),
        ]
      : []),
    ...trip.days.map((day) =>
      prisma.day.create({
        data: {
          tripId,
          dayNumber: day.dayNumber,
          date: day.date,
          label: day.label,
          places: {
            create: day.places.map((place, index) => ({
              sortOrder: index,
              name: place.name,
              category: place.category,
              rating: place.rating,
              duration: place.duration,
              price: place.price,
              description: place.description,
              whySuggested: place.whySuggested,
              bookingAction: place.bookingAction,
              date: place.date ?? null,
              timeSlot: place.timeSlot ?? null,
              openHoursStart: place.openHours?.start ?? null,
              openHoursEnd: place.openHours?.end ?? null,
            })),
          },
        },
      }),
    ),
  ]);

  // Re-fetch so returned ids/ordering reflect what's actually persisted.
  const saved = await getTripById(userId, tripId);
  if (!saved) throw new Error("Failed to persist trip");
  return saved;
}
