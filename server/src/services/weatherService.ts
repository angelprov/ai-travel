import type { WeatherSnapshot } from "../types.js";

// ---------------------------------------------------------------------------
// Weather provider. Deterministic mock today (same destination+date always
// returns the same forecast, so the UI feels stable across a session)
// behind the same async contract a real provider would use.
// ---------------------------------------------------------------------------

const CONDITIONS: WeatherSnapshot["condition"][] = ["sunny", "partly-cloudy", "cloudy", "rainy", "stormy"];

function hashSeed(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function mockForecast(destinationId: string, date: string): WeatherSnapshot {
  const seed = hashSeed(`${destinationId}:${date}`);
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

export async function getForecast(destinationId: string, date: string): Promise<WeatherSnapshot> {
  const apiKey = process.env.WEATHER_API_KEY;

  if (apiKey) {
    // TODO: replace with a real call once WEATHER_API_KEY is set, e.g.
    // OpenWeatherMap's forecast endpoint:
    //   GET https://api.openweathermap.org/data/2.5/forecast
    //       ?q={destination}&appid={apiKey}&units=metric
    // Map the closest 3-hour bucket for `date` into a WeatherSnapshot with
    // source: "live". Falling back to the mock until that mapping is wired.
  }

  return mockForecast(destinationId, date);
}
