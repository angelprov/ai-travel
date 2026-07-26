import { create } from "zustand";
import type { ChatMessage, Trip, UserProfile } from "../types";
import { createWelcomeMessage, fetchTripMessages, sendChatMessage } from "../lib/chatService";
import { fetchTrip } from "../lib/tripsService";

interface ChatState {
  tripId: string | null;
  trip: Trip | null;
  messages: ChatMessage[];
  isThinking: boolean;
  isLoading: boolean;
  /** Fetches one trip's detail + chat history on demand — only one trip's chat is ever open at a time, so this re-fetches rather than caching every trip a user has. */
  loadTrip: (tripId: string, profile?: UserProfile) => Promise<void>;
  sendMessage: (text: string) => Promise<void>;
  reset: () => void;
}

export const useChatStore = create<ChatState>()((set, get) => ({
  tripId: null,
  trip: null,
  messages: [],
  isThinking: false,
  isLoading: false,

  loadTrip: async (tripId, profile) => {
    set({ isLoading: true, tripId, trip: null, messages: [] });
    try {
      const [trip, messages] = await Promise.all([fetchTrip(tripId), fetchTripMessages(tripId)]);
      if (get().tripId !== tripId) return; // a newer loadTrip call superseded this one
      set({
        trip,
        messages: messages.length > 0 || !profile ? messages : [createWelcomeMessage(profile)],
        isLoading: false,
      });
    } catch (error) {
      console.error("[chatStore] failed to load trip:", error);
      set({ isLoading: false });
    }
  },

  sendMessage: async (text) => {
    const trimmed = text.trim();
    const tripId = get().tripId;
    if (!trimmed || !tripId) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      text: trimmed,
      createdAt: Date.now(),
      status: "sent",
    };

    set((state) => ({ messages: [...state.messages, userMessage], isThinking: true }));

    try {
      const reply = await sendChatMessage(tripId, trimmed);

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        text: reply.text,
        createdAt: Date.now(),
        status: reply.isError ? "error" : "sent",
        attachments: reply.attachments,
      };

      set((state) => ({
        messages: [...state.messages, assistantMessage],
        trip: reply.trip ?? state.trip,
        isThinking: false,
      }));
    } catch {
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        text: "Something went wrong on my end. Please try again.",
        createdAt: Date.now(),
        status: "error",
      };
      set((state) => ({ messages: [...state.messages, errorMessage], isThinking: false }));
    }
  },

  reset: () => set({ tripId: null, trip: null, messages: [], isThinking: false, isLoading: false }),
}));
