import type { WeatherSnapshot } from "../types";
import { API_URL } from "./apiClient";

/** Fetches a forecast for a destination (human-readable name, e.g. "Porto, Portugal") + date. Returns null on any failure so callers can hide the weather chip instead of erroring. */
export async function fetchForecast(destination: string, date: string): Promise<WeatherSnapshot | null> {
  try {
    const response = await fetch(
      `${API_URL}/api/weather?destination=${encodeURIComponent(destination)}&date=${encodeURIComponent(date)}`,
    );
    if (!response.ok) return null;
    return (await response.json()) as WeatherSnapshot;
  } catch {
    return null;
  }
}
