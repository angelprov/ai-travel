import { create } from "zustand";
import type { AuthUser, HydrateResponse, TripSummary } from "../types";
import { fetchCurrentSession, login as loginRequest, logout as logoutRequest, signup as signupRequest } from "../lib/authService";
import { useProfileStore } from "./profileStore";
import { useChatStore } from "./chatStore";
import { useTripsStore } from "./tripsStore";

type AuthStatus = "idle" | "loading" | "authenticated" | "unauthenticated";

interface AuthState {
  status: AuthStatus;
  user: AuthUser | null;
  /** The user's most recently touched trip, if any — just enough for Home's "continue planning" card. Full trip detail/chat history are fetched on demand by whichever screen needs them, not eagerly loaded here. */
  activeTripSummary: TripSummary | null;
  error: string | null;
  /** Checks for an existing session cookie on app load. */
  hydrate: () => Promise<void>;
  signup: (email: string, password: string) => Promise<boolean>;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
}

function applySession(session: HydrateResponse) {
  useProfileStore.getState().hydrate(session.profile, session.onboardingComplete);
}

export const useAuthStore = create<AuthState>()((set) => ({
  status: "idle",
  user: null,
  activeTripSummary: null,
  error: null,

  hydrate: async () => {
    set({ status: "loading" });
    try {
      const session = await fetchCurrentSession();
      if (!session) {
        set({ status: "unauthenticated", user: null });
        return;
      }
      applySession(session);
      set({ status: "authenticated", user: session.user, activeTripSummary: session.activeTripSummary });
    } catch {
      set({ status: "unauthenticated", user: null });
    }
  },

  signup: async (email, password) => {
    set({ error: null });
    try {
      const session = await signupRequest(email, password);
      applySession(session);
      set({ status: "authenticated", user: session.user, activeTripSummary: session.activeTripSummary });
      return true;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Something went wrong." });
      return false;
    }
  },

  login: async (email, password) => {
    set({ error: null });
    try {
      const session = await loginRequest(email, password);
      applySession(session);
      set({ status: "authenticated", user: session.user, activeTripSummary: session.activeTripSummary });
      return true;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Something went wrong." });
      return false;
    }
  },

  logout: async () => {
    await logoutRequest();
    useProfileStore.getState().reset();
    useChatStore.getState().reset();
    useTripsStore.getState().reset();
    set({ status: "unauthenticated", user: null, activeTripSummary: null, error: null });
  },

  clearError: () => set({ error: null }),
}));
