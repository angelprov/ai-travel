import { create } from "zustand";
import type { TravelBudget, TravelInterest, TravelPace, UserProfile } from "../types";
import { saveProfile } from "../lib/profileService";

export interface OnboardingDraft {
  name: string;
  interests: TravelInterest[];
  pace: TravelPace;
  budget: TravelBudget;
  dietary: string[];
}

interface ProfileState {
  profile: UserProfile | null;
  onboardingComplete: boolean;
  /** Populated from the server (signup/login/me response) — never from localStorage. */
  hydrate: (profile: UserProfile, onboardingComplete: boolean) => void;
  completeOnboarding: (draft: OnboardingDraft, subscribed: boolean) => Promise<void>;
  /** Re-editing profile fields after onboarding, from the Profile screen's settings form. */
  updateProfile: (draft: OnboardingDraft) => Promise<void>;
  reset: () => void;
}

export const useProfileStore = create<ProfileState>()((set, get) => ({
  profile: null,
  onboardingComplete: false,

  hydrate: (profile, onboardingComplete) => set({ profile, onboardingComplete }),

  completeOnboarding: async (draft, subscribed) => {
    const result = await saveProfile({ ...draft, subscribed, onboardingComplete: true });
    set({ profile: result.profile, onboardingComplete: result.onboardingComplete });
  },

  updateProfile: async (draft) => {
    const subscribed = get().profile?.subscribed ?? false;
    const result = await saveProfile({ ...draft, subscribed, onboardingComplete: true });
    set({ profile: result.profile, onboardingComplete: result.onboardingComplete });
  },

  reset: () => set({ profile: null, onboardingComplete: false }),
}));
