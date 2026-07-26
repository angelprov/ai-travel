import { useState } from "react";
import { OnboardingLayout } from "../OnboardingLayout";
import { Chip } from "../Chip";
import { Button } from "../../Button";
import { interestOptions } from "../../../lib/onboardingOptions";
import type { TravelInterest } from "../../../types";

interface InterestsStepProps {
  value: TravelInterest[];
  onChange: (interests: TravelInterest[]) => void;
  onNext: () => void;
  onBack: () => void;
  progress: { total: number; current: number };
}

export function InterestsStep({ value, onChange, onNext, onBack, progress }: InterestsStepProps) {
  const [selected, setSelected] = useState<TravelInterest[]>(value);

  const toggle = (interest: TravelInterest) => {
    setSelected((prev) =>
      prev.includes(interest) ? prev.filter((item) => item !== interest) : [...prev, interest],
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
        <Button onClick={handleSubmit} disabled={selected.length === 0} className="w-full">
          Continue
        </Button>
      }
    >
      <h2 className="font-display text-3xl text-ink">What draws you in?</h2>
      <p className="mt-2 text-ink/70">Pick as many as you like.</p>
      <div className="mt-8 grid grid-cols-2 gap-3">
        {interestOptions.map(({ value: interest, label, icon: Icon }) => (
          <Chip
            key={interest}
            label={label}
            selected={selected.includes(interest)}
            onClick={() => toggle(interest)}
            icon={<Icon className="h-4 w-4 shrink-0 text-ink/60" />}
          />
        ))}
      </div>
    </OnboardingLayout>
  );
}
