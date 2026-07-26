import { useState } from "react";
import type { FormEvent } from "react";
import { ArrowUp } from "lucide-react";

interface ComposerProps {
  onSend: (text: string) => void;
  isThinking: boolean;
  hasTrip: boolean;
}

export function Composer({ onSend, isThinking, hasTrip }: ComposerProps) {
  const [value, setValue] = useState("");

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setValue("");
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2 px-4 pb-4 pt-1">
      {/* text-base (16px), not text-sm: iOS Safari/WKWebView auto-zooms on
          focus for any input under 16px, and can get stuck zoomed in. */}
      <input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={hasTrip ? "Ask a follow-up..." : "Where do you want to go?"}
        aria-label="Message"
        className="flex-1 rounded-full border border-line bg-card px-4 py-3 text-base text-ink outline-none placeholder:text-ink/40 focus:border-accent"
      />
      <button
        type="submit"
        disabled={isThinking || !value.trim()}
        aria-label="Send message"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent text-white transition-colors hover:bg-accent-dark disabled:cursor-not-allowed disabled:bg-accent/40"
      >
        <ArrowUp className="h-5 w-5" />
      </button>
    </form>
  );
}
