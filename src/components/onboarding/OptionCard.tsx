interface OptionCardProps {
  label: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}

export function OptionCard({ label, description, selected, onClick }: OptionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`w-full rounded-2xl border px-5 py-4 text-left transition-colors ${
        selected ? "border-accent bg-accent/15" : "border-line bg-card hover:border-accent/60"
      }`}
    >
      <div className="font-display text-lg text-ink">{label}</div>
      <p className="mt-1 text-sm text-ink/70">{description}</p>
    </button>
  );
}
