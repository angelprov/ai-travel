import { useState } from "react";
import { OnboardingLayout } from "../OnboardingLayout";
import { OptionCard } from "../OptionCard";
import { Button } from "../../Button";
import { budgetOptions } from "../../../lib/onboardingOptions";
import type { TravelBudget } from "../../../types";

interface BudgetStepProps {
  value: TravelBudget;
  onChange: (budget: TravelBudget) => void;
  onNext: () => void;
  onBack: () => void;
  progress: { total: number; current: number };
}

export function BudgetStep({ value, onChange, onNext, onBack, progress }: BudgetStepProps) {
  const [selected, setSelected] = useState<TravelBudget>(value);

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
      <h2 className="font-display text-3xl text-ink">What's your typical budget?</h2>
      <p className="mt-2 text-ink/70">This shapes the stays and activities we suggest.</p>
      <div className="mt-8 space-y-3">
        {budgetOptions.map((option) => (
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
