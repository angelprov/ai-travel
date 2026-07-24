import { prisma } from "../db/client.js";
import type { Place, Stay, Trip } from "../types.js";

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

export async function getTrip(userId: string): Promise<Trip | null> {
  const row = await prisma.trip.findUnique({
    where: { userId },
    include: {
      stay: true,
      days: { orderBy: { dayNumber: "asc" }, include: { places: { orderBy: { sortOrder: "asc" } } } },
    },
  });

  if (!row || !row.stay) return null;

  return {
    id: row.id,
    destinationId: row.destinationId,
    destination: row.destination,
    startDate: row.startDate,
    endDate: row.endDate,
    travelerCount: row.travelerCount,
    days: row.days.map((day) => ({
      id: day.id,
      dayNumber: day.dayNumber,
      date: day.date,
      label: day.label,
      places: day.places.map(toPlace),
    })),
    stay: toStay(row.stay),
  };
}

/** Replace strategy: the whole trip is swapped out on every mutation (cascades delete old days/places/stay). */
export async function saveTrip(userId: string, trip: Trip): Promise<Trip> {
  await prisma.trip.deleteMany({ where: { userId } });

  await prisma.trip.create({
    data: {
      userId,
      destinationId: trip.destinationId,
      destination: trip.destination,
      startDate: trip.startDate,
      endDate: trip.endDate,
      travelerCount: trip.travelerCount,
      stay: {
        create: {
          name: trip.stay.name,
          source: trip.stay.source,
          neighborhood: trip.stay.neighborhood,
          pricePerNight: trip.stay.pricePerNight,
          rating: trip.stay.rating,
          nights: trip.stay.nights,
          totalPrice: trip.stay.totalPrice,
          imageDescription: trip.stay.imageDescription,
        },
      },
      days: {
        create: trip.days.map((day) => ({
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
        })),
      },
    },
  });

  // Re-fetch so returned ids/ordering reflect what's actually persisted.
  const saved = await getTrip(userId);
  if (!saved) throw new Error("Failed to persist trip");
  return saved;
}
