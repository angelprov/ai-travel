import type { Day, Place, Stay, Trip } from "../types";

// ---------------------------------------------------------------------------
// Mock data layer. No real GetYourGuide/Airbnb/Booking.com/LLM calls happen
// here — this is realistic sample data for 3 destinations that chatService
// and bookingService pull from to simulate a working product.
// ---------------------------------------------------------------------------

export interface Destination {
  id: string;
  name: string;
  country: string;
  /** Keywords a user's opening message might contain to match this destination. */
  keywords: string[];
  buildTrip: () => Trip;
  /** Canned follow-up suggestions the mock chat service pulls from, keyed by intent. */
  followups: {
    veganRestaurant: Place;
    eveningEvent: Place;
    alternativeSight: Place;
  };
}

let placeCounter = 0;
const placeId = (destinationId: string) => `${destinationId}-place-${++placeCounter}`;

// --- Rome -------------------------------------------------------------

const romeStay: Stay = {
  id: "rome-stay-1",
  name: "Trastevere Vine Terrace",
  source: "airbnb",
  neighborhood: "Trastevere, Rome",
  pricePerNight: "€145",
  rating: 4.9,
  nights: 3,
  totalPrice: "€435",
  imageDescription: "Ivy-covered courtyard apartment with a private terrace",
};

const buildRomeDays = (): Day[] => [
  {
    id: "rome-day-1",
    dayNumber: 1,
    date: "2026-09-14",
    label: "Ancient Rome",
    places: [
      {
        id: placeId("rome"),
        name: "Colosseum & Roman Forum",
        category: "activity",
        rating: 4.8,
        duration: "3 hrs",
        price: "€28",
        description: "Skip-the-line guided walk through the arena floor and the Forum's ruins.",
        whySuggested: "Matches your interest in history with a balanced pace to start the trip.",
        bookingAction: "getyourguide",
        date: "2026-09-14",
        timeSlot: "Morning",
      },
      {
        id: placeId("rome"),
        name: "Trattoria da Enzo al 29",
        category: "restaurant",
        rating: 4.7,
        duration: "1 hr",
        price: "€22 avg",
        description: "Family-run trattoria in Trastevere known for cacio e pepe.",
        whySuggested: "A classic Roman lunch stop close to your ancient-Rome morning route.",
        bookingAction: "save",
        date: "2026-09-14",
        timeSlot: "13:00",
      },
      {
        id: placeId("rome"),
        name: "Trastevere Evening Stroll",
        category: "sight",
        rating: 4.6,
        duration: "1.5 hrs",
        price: "Free",
        description: "Cobblestone lanes, hidden piazzas, and golden-hour light over the Tiber.",
        whySuggested: "A relaxed close to day one, in keeping with your balanced pace.",
        bookingAction: "save",
        date: "2026-09-14",
        timeSlot: "Evening",
      },
    ],
  },
  {
    id: "rome-day-2",
    dayNumber: 2,
    date: "2026-09-15",
    label: "Vatican City",
    places: [
      {
        id: placeId("rome"),
        name: "Vatican Museums & Sistine Chapel",
        category: "activity",
        rating: 4.9,
        duration: "3.5 hrs",
        price: "€35",
        description: "Timed-entry tour through Raphael's Rooms into the Sistine Chapel.",
        whySuggested: "One of Rome's essential art stops, given your interest in art and history.",
        bookingAction: "getyourguide",
        date: "2026-09-15",
        timeSlot: "Morning",
      },
      {
        id: placeId("rome"),
        name: "Pizzeria da Baffetto",
        category: "restaurant",
        rating: 4.5,
        duration: "1 hr",
        price: "€15 avg",
        description: "No-frills, thin-crust Roman pizza institution since 1961.",
        whySuggested: "A quick, well-loved lunch that fits between your Vatican morning and free afternoon.",
        bookingAction: "save",
        date: "2026-09-15",
        timeSlot: "13:30",
      },
    ],
  },
  {
    id: "rome-day-3",
    dayNumber: 3,
    date: "2026-09-16",
    label: "Villa Borghese & Piazza Navona",
    places: [
      {
        id: placeId("rome"),
        name: "Borghese Gallery",
        category: "activity",
        rating: 4.8,
        duration: "2 hrs",
        price: "€26",
        description: "Bernini sculptures and Caravaggio paintings inside a cardinal's villa.",
        whySuggested: "Continues the art thread from your Vatican visit, at a lighter pace.",
        bookingAction: "getyourguide",
        date: "2026-09-16",
        timeSlot: "Morning",
      },
      {
        id: placeId("rome"),
        name: "Piazza Navona Night Market",
        category: "event",
        rating: 4.4,
        duration: "2 hrs",
        price: "Free entry",
        description: "Seasonal evening market with street performers and local artisans, running Sep 14-16.",
        whySuggested: "Runs only during your stay — a fitting last night in Rome.",
        bookingAction: "save",
        date: "2026-09-16",
        timeSlot: "Evening",
      },
    ],
  },
];

const romeFollowups = {
  veganRestaurant: {
    id: placeId("rome"),
    name: "Ops! Trattoria Vegana",
    category: "restaurant" as const,
    rating: 4.6,
    duration: "1 hr",
    price: "€18 avg",
    description: "Inventive plant-based takes on Roman classics, tucked off Via Giulia.",
    whySuggested: "You asked for vegan options near your itinerary in Rome's centro storico.",
    bookingAction: "save" as const,
  },
  eveningEvent: {
    id: placeId("rome"),
    name: "Rooftop Jazz at Terrazza Borromini",
    category: "event" as const,
    rating: 4.7,
    duration: "2.5 hrs",
    price: "€20",
    description: "Live jazz trio with a view over Piazza Navona's rooftops.",
    whySuggested: "You asked what's fun tonight — this runs late and fits a balanced pace.",
    bookingAction: "getyourguide" as const,
  },
  alternativeSight: {
    id: placeId("rome"),
    name: "Aventine Keyhole & Orange Garden",
    category: "sight" as const,
    rating: 4.5,
    duration: "45 min",
    price: "Free",
    description: "A famously quiet framed view of St. Peter's dome through a garden keyhole.",
    whySuggested: "A quieter, free alternative to a crowded ticketed sight, since you asked to swap.",
    bookingAction: "save" as const,
  },
};

// --- Lisbon -------------------------------------------------------------

const lisbonStay: Stay = {
  id: "lisbon-stay-1",
  name: "Alfama Riverview Loft",
  source: "booking",
  neighborhood: "Alfama, Lisbon",
  pricePerNight: "€118",
  rating: 4.8,
  nights: 3,
  totalPrice: "€354",
  imageDescription: "Tiled loft with a balcony overlooking the Tagus river",
};

const buildLisbonDays = (): Day[] => [
  {
    id: "lisbon-day-1",
    dayNumber: 1,
    date: "2026-10-02",
    label: "Alfama & Baixa",
    places: [
      {
        id: placeId("lisbon"),
        name: "Alfama Tuk-Tuk Heritage Tour",
        category: "activity",
        rating: 4.7,
        duration: "2 hrs",
        price: "€30",
        description: "Wind through Lisbon's oldest quarter on a guided tuk-tuk route.",
        whySuggested: "An easy-paced way to see the hills of Alfama on your first day.",
        bookingAction: "getyourguide",
        date: "2026-10-02",
        timeSlot: "Morning",
      },
      {
        id: placeId("lisbon"),
        name: "Time Out Market",
        category: "restaurant",
        rating: 4.5,
        duration: "1 hr",
        price: "€16 avg",
        description: "Food hall with stalls from some of Lisbon's best-known chefs.",
        whySuggested: "Lots of variety in one stop, good for a group with different tastes.",
        bookingAction: "save",
        date: "2026-10-02",
        timeSlot: "13:00",
      },
      {
        id: placeId("lisbon"),
        name: "Miradouro da Senhora do Monte",
        category: "sight",
        rating: 4.8,
        duration: "45 min",
        price: "Free",
        description: "Lisbon's highest viewpoint, best at sunset over the rooftops.",
        whySuggested: "A relaxed sunset stop that matches your preferred pace.",
        bookingAction: "save",
        date: "2026-10-02",
        timeSlot: "Evening",
      },
    ],
  },
  {
    id: "lisbon-day-2",
    dayNumber: 2,
    date: "2026-10-03",
    label: "Belém",
    places: [
      {
        id: placeId("lisbon"),
        name: "Jerónimos Monastery",
        category: "activity",
        rating: 4.8,
        duration: "1.5 hrs",
        price: "€12",
        description: "Manueline-style monastery and UNESCO World Heritage site.",
        whySuggested: "One of Lisbon's landmark sights, fitting your interest in history.",
        bookingAction: "getyourguide",
        date: "2026-10-03",
        timeSlot: "Morning",
      },
      {
        id: placeId("lisbon"),
        name: "Pastéis de Belém",
        category: "restaurant",
        rating: 4.6,
        duration: "30 min",
        price: "€6 avg",
        description: "The original custard tart bakery, in business since 1837.",
        whySuggested: "A short, iconic stop right after the monastery.",
        bookingAction: "save",
        date: "2026-10-03",
        timeSlot: "12:30",
      },
    ],
  },
  {
    id: "lisbon-day-3",
    dayNumber: 3,
    date: "2026-10-04",
    label: "Bairro Alto & LX Factory",
    places: [
      {
        id: placeId("lisbon"),
        name: "LX Factory Creative Quarter",
        category: "sight",
        rating: 4.6,
        duration: "2 hrs",
        price: "Free",
        description: "Converted industrial complex with studios, bookshops, and murals.",
        whySuggested: "A creative, low-key afternoon that suits your interests.",
        bookingAction: "save",
        date: "2026-10-04",
        timeSlot: "Afternoon",
      },
      {
        id: placeId("lisbon"),
        name: "Fado Night at Tasca do Chico",
        category: "event",
        rating: 4.7,
        duration: "2 hrs",
        price: "€10 cover",
        description: "Intimate, unamplified Fado singing in a Bairro Alto tavern, Fri-Sat only.",
        whySuggested: "Timed to your last night, which falls on a weekend showing.",
        bookingAction: "getyourguide",
        date: "2026-10-04",
        timeSlot: "21:00",
      },
    ],
  },
];

const lisbonFollowups = {
  veganRestaurant: {
    id: placeId("lisbon"),
    name: "Ao 26 - Vegan Food Project",
    category: "restaurant" as const,
    rating: 4.6,
    duration: "1 hr",
    price: "€17 avg",
    description: "All-vegan Portuguese comfort food near Príncipe Real.",
    whySuggested: "You asked for vegan food nearby your Lisbon route.",
    bookingAction: "save" as const,
  },
  eveningEvent: {
    id: placeId("lisbon"),
    name: "Miradouro Sunset DJ Set",
    category: "event" as const,
    rating: 4.5,
    duration: "3 hrs",
    price: "Free",
    description: "Open-air rooftop sessions with local DJs overlooking the Tagus.",
    whySuggested: "You asked what's fun tonight — casual, and easy to drop into.",
    bookingAction: "save" as const,
  },
  alternativeSight: {
    id: placeId("lisbon"),
    name: "Jardim da Estrela",
    category: "sight" as const,
    rating: 4.6,
    duration: "1 hr",
    price: "Free",
    description: "A quiet 19th-century garden with a duck pond, far from the crowds.",
    whySuggested: "A quieter swap for a busier landmark, as requested.",
    bookingAction: "save" as const,
  },
};

// --- Kyoto -------------------------------------------------------------

const kyotoStay: Stay = {
  id: "kyoto-stay-1",
  name: "Gion Machiya Townhouse",
  source: "airbnb",
  neighborhood: "Gion, Kyoto",
  pricePerNight: "€132",
  rating: 4.9,
  nights: 3,
  totalPrice: "€396",
  imageDescription: "Restored wooden machiya with a private inner courtyard garden",
};

const buildKyotoDays = (): Day[] => [
  {
    id: "kyoto-day-1",
    dayNumber: 1,
    date: "2026-11-05",
    label: "Higashiyama District",
    places: [
      {
        id: placeId("kyoto"),
        name: "Kiyomizu-dera Temple",
        category: "activity",
        rating: 4.9,
        duration: "1.5 hrs",
        price: "€5",
        description: "Wooden temple stage with sweeping views over Kyoto's forested hills.",
        whySuggested: "A calm, scenic start that matches your relaxed-to-balanced pace.",
        bookingAction: "getyourguide",
        date: "2026-11-05",
        timeSlot: "Morning",
      },
      {
        id: placeId("kyoto"),
        name: "Omen Nishiki",
        category: "restaurant",
        rating: 4.6,
        duration: "1 hr",
        price: "€14 avg",
        description: "Udon specialist with a simple, seasonal set menu.",
        whySuggested: "Close to Higashiyama and light enough for a walking day.",
        bookingAction: "save",
        date: "2026-11-05",
        timeSlot: "13:00",
      },
      {
        id: placeId("kyoto"),
        name: "Ninenzaka & Sannenzaka Lanes",
        category: "sight",
        rating: 4.7,
        duration: "1 hr",
        price: "Free",
        description: "Preserved stone-paved streets lined with traditional shops.",
        whySuggested: "An easy, photogenic wind-down after the temple.",
        bookingAction: "save",
        date: "2026-11-05",
        timeSlot: "Afternoon",
      },
    ],
  },
  {
    id: "kyoto-day-2",
    dayNumber: 2,
    date: "2026-11-06",
    label: "Arashiyama",
    places: [
      {
        id: placeId("kyoto"),
        name: "Arashiyama Bamboo Grove",
        category: "sight",
        rating: 4.8,
        duration: "45 min",
        price: "Free",
        description: "Towering bamboo stalks along a quiet, filtered-light path.",
        whySuggested: "One of Kyoto's signature nature stops, best visited early.",
        bookingAction: "save",
        date: "2026-11-06",
        timeSlot: "Morning",
      },
      {
        id: placeId("kyoto"),
        name: "Tenryu-ji Temple Garden",
        category: "activity",
        rating: 4.8,
        duration: "1 hr",
        price: "€6",
        description: "A UNESCO Zen garden designed around a central pond.",
        whySuggested: "Pairs naturally with the bamboo grove and your interest in nature.",
        bookingAction: "getyourguide",
        date: "2026-11-06",
        timeSlot: "Morning",
      },
      {
        id: placeId("kyoto"),
        name: "Yudofu Sagano",
        category: "restaurant",
        rating: 4.5,
        duration: "1 hr",
        price: "€24 avg",
        description: "Traditional tofu kaiseki in a garden-view dining room.",
        whySuggested: "A seasonal, calm lunch to match the morning's temple visits.",
        bookingAction: "save",
        date: "2026-11-06",
        timeSlot: "13:00",
      },
    ],
  },
  {
    id: "kyoto-day-3",
    dayNumber: 3,
    date: "2026-11-07",
    label: "Gion & Fushimi",
    places: [
      {
        id: placeId("kyoto"),
        name: "Fushimi Inari Torii Gates",
        category: "activity",
        rating: 4.9,
        duration: "2 hrs",
        price: "Free",
        description: "Thousands of vermillion torii gates climbing the mountainside.",
        whySuggested: "A must-see for your final full day, best done as a moderate hike.",
        bookingAction: "getyourguide",
        date: "2026-11-07",
        timeSlot: "Morning",
      },
      {
        id: placeId("kyoto"),
        name: "Gion Lantern Festival",
        category: "event",
        rating: 4.7,
        duration: "2 hrs",
        price: "Free entry",
        description: "Seasonal lantern-lit evening walk through Gion's teahouse streets, Nov 5-7 only.",
        whySuggested: "Runs only on the dates you're in town — a fitting send-off.",
        bookingAction: "save",
        date: "2026-11-07",
        timeSlot: "Evening",
      },
    ],
  },
];

const kyotoFollowups = {
  veganRestaurant: {
    id: placeId("kyoto"),
    name: "Shigetsu Vegan Shojin Ryori",
    category: "restaurant" as const,
    rating: 4.7,
    duration: "1.5 hrs",
    price: "€30 avg",
    description: "Buddhist temple cuisine, entirely plant-based, inside Tenryu-ji.",
    whySuggested: "You asked for vegan food — this is steps from your Arashiyama day.",
    bookingAction: "save" as const,
  },
  eveningEvent: {
    id: placeId("kyoto"),
    name: "Pontocho Alley Izakaya Crawl",
    category: "event" as const,
    rating: 4.6,
    duration: "2.5 hrs",
    price: "€35",
    description: "Guided hop between three narrow-alley izakayas along the Kamo river.",
    whySuggested: "You asked what's fun tonight — a lively, guided way to eat and drink locally.",
    bookingAction: "getyourguide" as const,
  },
  alternativeSight: {
    id: placeId("kyoto"),
    name: "Philosopher's Path",
    category: "sight" as const,
    rating: 4.7,
    duration: "1 hr",
    price: "Free",
    description: "A quiet canal-side walking path linking a string of small temples.",
    whySuggested: "A quieter, less crowded alternative, since you asked to swap.",
    bookingAction: "save" as const,
  },
};

// -------------------------------------------------------------------------

let tripCounter = 0;

export const destinations: Destination[] = [
  {
    id: "rome",
    name: "Rome",
    country: "Italy",
    keywords: ["rome", "roma", "italy"],
    buildTrip: () => ({
      id: `trip-${++tripCounter}`,
      destinationId: "rome",
      destination: "Rome, Italy",
      startDate: "2026-09-14",
      endDate: "2026-09-16",
      travelerCount: 2,
      days: buildRomeDays(),
      stay: romeStay,
    }),
    followups: romeFollowups,
  },
  {
    id: "lisbon",
    name: "Lisbon",
    country: "Portugal",
    keywords: ["lisbon", "lisboa", "portugal"],
    buildTrip: () => ({
      id: `trip-${++tripCounter}`,
      destinationId: "lisbon",
      destination: "Lisbon, Portugal",
      startDate: "2026-10-02",
      endDate: "2026-10-04",
      travelerCount: 2,
      days: buildLisbonDays(),
      stay: lisbonStay,
    }),
    followups: lisbonFollowups,
  },
  {
    id: "kyoto",
    name: "Kyoto",
    country: "Japan",
    keywords: ["kyoto", "japan"],
    buildTrip: () => ({
      id: `trip-${++tripCounter}`,
      destinationId: "kyoto",
      destination: "Kyoto, Japan",
      startDate: "2026-11-05",
      endDate: "2026-11-07",
      travelerCount: 2,
      days: buildKyotoDays(),
      stay: kyotoStay,
    }),
    followups: kyotoFollowups,
  },
];

export const defaultDestination = destinations[0];

export function findDestinationByMessage(message: string): Destination {
  const lower = message.toLowerCase();
  const match = destinations.find((destination) =>
    destination.keywords.some((keyword) => lower.includes(keyword)),
  );
  return match ?? defaultDestination;
}
