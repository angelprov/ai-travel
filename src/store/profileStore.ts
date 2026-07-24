import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { TravelBudget, TravelPace, TravelInterest, UserProfile } from "../types";

interface ProfileState {
  profile: UserProfile | null;
  onboardingComplete: boolean;
  setName: (name: string) => void;
  setInterests: (interests: TravelInterest[]) => void;
  setPace: (pace: TravelPace) => void;
  setBudget: (budget: TravelBudget) => void;
  setDietary: (dietary: string[]) => void;
  completeOnboarding: (subscribed: boolean) => void;
  resetOnboarding: () => void;
}

const emptyProfile: UserProfile = {
  name: "",
  interests: [],
  pace: "balanced",
  budget: "mid-range",
  dietary: [],
  subscribed: false,
};

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      profile: null,
      onboardingComplete: false,
      setName: (name) =>
        set((state) => ({ profile: { ...(state.profile ?? emptyProfile), name } })),
      setInterests: (interests) =>
        set((state) => ({ profile: { ...(state.profile ?? emptyProfile), interests } })),
      setPace: (pace) =>
        set((state) => ({ profile: { ...(state.profile ?? emptyProfile), pace } })),
      setBudget: (budget) =>
        set((state) => ({ profile: { ...(state.profile ?? emptyProfile), budget } })),
      setDietary: (dietary) =>
        set((state) => ({ profile: { ...(state.profile ?? emptyProfile), dietary } })),
      completeOnboarding: (subscribed) =>
        set((state) => ({
          profile: { ...(state.profile ?? emptyProfile), subscribed },
          onboardingComplete: true,
        })),
      resetOnboarding: () => set({ profile: null, onboardingComplete: false }),
    }),
    { name: "waypoint-profile" },
  ),
);
