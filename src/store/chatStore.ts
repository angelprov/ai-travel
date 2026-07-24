import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ChatMessage, Trip, UserProfile } from "../types";
import { createWelcomeMessage, getAssistantReply } from "../lib/chatService";

interface ChatState {
  messages: ChatMessage[];
  trip: Trip | null;
  isThinking: boolean;
  initialize: (profile: UserProfile) => void;
  sendMessage: (text: string) => Promise<void>;
  reset: () => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      messages: [],
      trip: null,
      isThinking: false,

      initialize: (profile) => {
        if (get().messages.length > 0) return;
        set({ messages: [createWelcomeMessage(profile)] });
      },

      sendMessage: async (text) => {
        const trimmed = text.trim();
        if (!trimmed) return;

        const userMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: "user",
          text: trimmed,
          createdAt: Date.now(),
          status: "sent",
        };

        set((state) => ({ messages: [...state.messages, userMessage], isThinking: true }));

        const history = get().messages;
        const trip = get().trip;

        try {
          const reply = await getAssistantReply(trimmed, trip, history);

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

      reset: () => set({ messages: [], trip: null, isThinking: false }),
    }),
    { name: "waypoint-chat" },
  ),
);
