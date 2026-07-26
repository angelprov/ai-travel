import type { ReactNode } from "react";
import { Check } from "lucide-react";

interface ChipProps {
  label: string;
  selected: boolean;
  onClick: () => void;
  icon?: ReactNode;
}

export function Chip({ label, selected, onClick, icon }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`flex items-center gap-2 rounded-2xl border px-4 py-3 text-left text-sm font-medium transition-colors ${
        selected
          ? "border-accent bg-accent/15 text-ink"
          : "border-line bg-card text-ink/80 hover:border-accent/60"
      }`}
    >
      {icon}
      <span className="flex-1">{label}</span>
      {selected && <Check className="h-4 w-4 shrink-0 text-accent-dark" />}
    </button>
  );
}
