import { useState } from "react";
import { OnboardingLayout } from "../OnboardingLayout";
import { OptionCard } from "../OptionCard";
import { Button } from "../../Button";
import { paceOptions } from "../../../lib/onboardingOptions";
import type { TravelPace } from "../../../types";

interface PaceStepProps {
  value: TravelPace;
  onChange: (pace: TravelPace) => void;
  onNext: () => void;
  onBack: () => void;
  progress: { total: number; current: number };
}

export function PaceStep({ value, onChange, onNext, onBack, progress }: PaceStepProps) {
  const [selected, setSelected] = useState<TravelPace>(value);

  const handleSubmit = () => {
    onChange(selected);
    onNext();
  };

  return (
    <OnboardingLayout
      onBack={onBack}
      progress={progress}
      footer={
        <Button onClick={handleSubmit} className="w-full">
          Continue
        </Button>
      }
    >
      <h2 className="font-display text-3xl text-ink">What pace fits you best?</h2>
      <p className="mt-2 text-ink/70">You can always adjust this later, day by day.</p>
      <div className="mt-8 space-y-3">
        {paceOptions.map((option) => (
          <OptionCard
            key={option.value}
            label={option.label}
            description={option.description}
            selected={selected === option.value}
            onClick={() => setSelected(option.value)}
          />
        ))}
      </div>
    </OnboardingLayout>
  );
}
