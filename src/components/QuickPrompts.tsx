const PROMPTS = [
  "Find vegan food nearby",
  "Anything fun tonight?",
  "Swap the Vatican for something quieter",
  "Show me the stay",
];

interface QuickPromptsProps {
  onSelect: (prompt: string) => void;
  disabled?: boolean;
}

export function QuickPrompts({ onSelect, disabled }: QuickPromptsProps) {
  return (
    <div className="scrollbar-thin flex gap-2 overflow-x-auto px-4 pb-2 pt-3">
      {PROMPTS.map((prompt) => (
        <button
          key={prompt}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(prompt)}
          className="shrink-0 whitespace-nowrap rounded-full border border-line bg-card px-3.5 py-1.5 text-xs font-medium text-ink/80 transition-colors hover:border-accent/60 disabled:opacity-50"
        >
          {prompt}
        </button>
      ))}
    </div>
  );
}
