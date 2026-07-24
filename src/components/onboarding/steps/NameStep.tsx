import { useState } from "react";
import { OnboardingLayout } from "../OnboardingLayout";
import { Button } from "../../Button";

interface NameStepProps {
  value: string;
  onChange: (name: string) => void;
  onNext: () => void;
  onBack: () => void;
  progress: { total: number; current: number };
}

export function NameStep({ value, onChange, onNext, onBack, progress }: NameStepProps) {
  const [name, setName] = useState(value);

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onChange(trimmed);
    onNext();
  };

  return (
    <OnboardingLayout
      onBack={onBack}
      progress={progress}
      footer={
        <Button onClick={handleSubmit} disabled={!name.trim()} className="w-full">
          Continue
        </Button>
      }
    >
      <h2 className="font-display text-3xl text-ink">What should we call you?</h2>
      <p className="mt-2 text-ink/70">Your planner will use this to keep things personal.</p>
      <input
        autoFocus
        value={name}
        onChange={(event) => setName(event.target.value)}
        onKeyDown={(event) => event.key === "Enter" && handleSubmit()}
        placeholder="Your name"
        className="mt-8 w-full rounded-xl border border-hairline bg-card px-4 py-3 text-lg text-ink outline-none focus:border-brass"
      />
    </OnboardingLayout>
  );
}
