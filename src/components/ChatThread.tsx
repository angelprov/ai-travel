import { useEffect, useRef } from "react";
import type { ChatMessage, Place, Stay } from "../types";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";

interface ChatThreadProps {
  messages: ChatMessage[];
  isThinking: boolean;
  onSelectPlace: (place: Place) => void;
  onBookStay: (stay: Stay) => void;
}

export function ChatThread({ messages, isThinking, onSelectPlace, onBookStay }: ChatThreadProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length, isThinking]);

  return (
    <div className="scrollbar-thin flex-1 overflow-y-auto px-4 py-6">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            onSelectPlace={onSelectPlace}
            onBookStay={onBookStay}
          />
        ))}
        {isThinking && <TypingIndicator />}
        <div ref={endRef} />
      </div>
    </div>
  );
}
