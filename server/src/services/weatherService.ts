import type { WeatherSnapshot } from "../types.js";

// ---------------------------------------------------------------------------
// Weather provider. Deterministic mock by default (same destination+date
// always returns the same forecast, so the UI feels stable across a
// session) behind the same async contract a real provider uses.
//
// With WEATHER_API_KEY set, calls OpenWeatherMap's 5-day/3-hour forecast
// endpoint and maps the closest bucket to `date` into a WeatherSnapshot.
// ---------------------------------------------------------------------------

const CONDITIONS: WeatherSnapshot["condition"][] = ["sunny", "partly-cloudy", "cloudy", "rainy", "stormy"];

function hashSeed(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function mockForecast(destination: string, date: string): WeatherSnapshot {
  const seed = hashSeed(`${destination}:${date}`);
  const condition = CONDITIONS[seed % CONDITIONS.length];
  const baseTemp = 14 + (seed % 16); // 14-29 C

  return {
    date,
    condition,
    tempHighC: baseTemp + 4,
    tempLowC: baseTemp - 4,
    source: "mock",
  };
}

function mapOpenWeatherIcon(iconCode: string): WeatherSnapshot["condition"] {
  const group = iconCode.slice(0, 2);
  switch (group) {
    case "01":
      return "sunny";
    case "02":
    case "03":
      return "partly-cloudy";
    case "04":
      return "cloudy";
    case "09":
    case "10":
      return "rainy";
    case "11":
      return "stormy";
    case "13": // snow — closest available condition
      return "cloudy";
    default:
      return "partly-cloudy";
  }
}

interface OpenWeatherForecastEntry {
  dt_txt: string;
  main: { temp: number };
  weather: { icon: string }[];
}

interface OpenWeatherForecastResponse {
  list: OpenWeatherForecastEntry[];
}

async function liveForecast(destination: string, date: string, apiKey: string): Promise<WeatherSnapshot | null> {
  const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(destination)}&appid=${apiKey}&units=metric`;
  const response = await fetch(url);
  if (!response.ok) {
    console.error(`[weatherService] OpenWeatherMap responded ${response.status} for "${destination}"`);
    return null;
  }

  const data = (await response.json()) as OpenWeatherForecastResponse;
  const entriesForDate = data.list.filter((entry) => entry.dt_txt.startsWith(date));
  if (entriesForDate.length === 0) return null; // date is outside the 5-day forecast window

  const temps = entriesForDate.map((entry) => entry.main.temp);
  const middayEntry = entriesForDate.find((entry) => entry.dt_txt.includes("12:00:00")) ?? entriesForDate[0];

  return {
    date,
    condition: mapOpenWeatherIcon(middayEntry.weather[0]?.icon ?? "02d"),
    tempHighC: Math.round(Math.max(...temps)),
    tempLowC: Math.round(Math.min(...temps)),
    source: "live",
  };
}

export async function getForecast(destination: string, date: string): Promise<WeatherSnapshot> {
  const apiKey = process.env.WEATHER_API_KEY;

  if (apiKey) {
    try {
      const live = await liveForecast(destination, date, apiKey);
      if (live) return live;
    } catch (error) {
      console.error("[weatherService] live forecast failed, falling back to mock:", error);
    }
  }

  return mockForecast(destination, date);
}
