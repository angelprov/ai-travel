import { prisma } from "../db/client.js";
import type { UserProfile } from "../types.js";

interface ProfileRow {
  name: string;
  interests: string;
  pace: string;
  budget: string;
  dietary: string;
  subscribed: boolean;
  onboardingComplete: boolean;
}

function toProfile(row: ProfileRow): UserProfile {
  return {
    name: row.name,
    interests: JSON.parse(row.interests),
    pace: row.pace as UserProfile["pace"],
    budget: row.budget as UserProfile["budget"],
    dietary: JSON.parse(row.dietary),
    subscribed: row.subscribed,
  };
}

export interface ProfileResult {
  profile: UserProfile;
  onboardingComplete: boolean;
}

/** Every user gets a default Profile row at signup, so this always finds one. */
export async function getProfile(userId: string): Promise<ProfileResult> {
  const row = await prisma.profile.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });
  return { profile: toProfile(row), onboardingComplete: row.onboardingComplete };
}

export interface ProfileUpdateInput extends UserProfile {
  onboardingComplete: boolean;
}

export async function saveProfile(userId: string, input: ProfileUpdateInput): Promise<ProfileResult> {
  const data = {
    name: input.name,
    interests: JSON.stringify(input.interests),
    pace: input.pace,
    budget: input.budget,
    dietary: JSON.stringify(input.dietary),
    subscribed: input.subscribed,
    onboardingComplete: input.onboardingComplete,
  };

  const row = await prisma.profile.upsert({
    where: { userId },
    update: data,
    create: { userId, ...data },
  });

  return { profile: toProfile(row), onboardingComplete: row.onboardingComplete };
}
