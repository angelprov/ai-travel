import { useState } from "react";
import { OnboardingLayout } from "../OnboardingLayout";
import { Chip } from "../Chip";
import { Button } from "../../Button";
import { dietaryOptions } from "../../../lib/onboardingOptions";

interface DietaryStepProps {
  value: string[];
  onChange: (dietary: string[]) => void;
  onNext: () => void;
  onBack: () => void;
  progress: { total: number; current: number };
}

export function DietaryStep({ value, onChange, onNext, onBack, progress }: DietaryStepProps) {
  const [selected, setSelected] = useState<string[]>(value);

  const toggle = (option: string) => {
    setSelected((prev) =>
      prev.includes(option) ? prev.filter((item) => item !== option) : [...prev, option],
    );
  };

  const handleSubmit = () => {
    onChange(selected);
    onNext();
  };

  return (
    <OnboardingLayout
      onBack={onBack}
      progress={progress}
      footer={
        <div className="flex flex-col items-center gap-3">
          <Button onClick={handleSubmit} className="w-full">
            Continue
          </Button>
          <button
            type="button"
            onClick={() => {
              onChange([]);
              onNext();
            }}
            className="text-sm font-medium text-ink/60 underline-offset-4 hover:underline"
          >
            Skip this step
          </button>
        </div>
      }
    >
      <h2 className="font-display text-3xl text-ink">Any dietary needs?</h2>
      <p className="mt-2 text-ink/70">Optional — helps us pick restaurants that work for you.</p>
      <div className="mt-8 grid grid-cols-2 gap-3">
        {dietaryOptions.map((option) => (
          <Chip
            key={option}
            label={option}
            selected={selected.includes(option)}
            onClick={() => toggle(option)}
          />
        ))}
      </div>
    </OnboardingLayout>
  );
}
