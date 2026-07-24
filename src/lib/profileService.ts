import type { ProfileUpdateResponse, UserProfile } from "../types";
import { API_URL } from "./apiClient";

export interface ProfileUpdateInput extends UserProfile {
  onboardingComplete: boolean;
}

export async function saveProfile(input: ProfileUpdateInput): Promise<ProfileUpdateResponse> {
  const response = await fetch(`${API_URL}/api/profile`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  });

  if (!response.ok) throw new Error("Failed to save your profile. Please try again.");
  return (await response.json()) as ProfileUpdateResponse;
}
