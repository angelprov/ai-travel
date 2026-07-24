import type { HydrateResponse } from "../types";
import { API_URL } from "./apiClient";

async function parseJsonOrThrow<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message = data && typeof data.error === "string" ? data.error : "Something went wrong.";
    throw new Error(message);
  }
  return data as T;
}

export async function signup(email: string, password: string): Promise<HydrateResponse> {
  const response = await fetch(`${API_URL}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });
  return parseJsonOrThrow<HydrateResponse>(response);
}

export async function login(email: string, password: string): Promise<HydrateResponse> {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });
  return parseJsonOrThrow<HydrateResponse>(response);
}

export async function logout(): Promise<void> {
  await fetch(`${API_URL}/api/auth/logout`, { method: "POST", credentials: "include" });
}

/** Returns null when there is no valid session (not logged in) rather than throwing. */
export async function fetchCurrentSession(): Promise<HydrateResponse | null> {
  const response = await fetch(`${API_URL}/api/auth/me`, { credentials: "include" });
  if (response.status === 401) return null;
  return parseJsonOrThrow<HydrateResponse>(response);
}
