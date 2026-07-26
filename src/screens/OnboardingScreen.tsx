import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { WelcomeStep } from "../components/onboarding/steps/WelcomeStep";
import { NameStep } from "../components/onboarding/steps/NameStep";
import { InterestsStep } from "../components/onboarding/steps/InterestsStep";
import { PaceStep } from "../components/onboarding/steps/PaceStep";
import { BudgetStep } from "../components/onboarding/steps/BudgetStep";
import { DietaryStep } from "../components/onboarding/steps/DietaryStep";
import { PaywallStep } from "../components/onboarding/steps/PaywallStep";
import { useProfileStore } from "../store/profileStore";
import type { TravelBudget, TravelInterest, TravelPace } from "../types";

type Step = "welcome" | "name" | "interests" | "pace" | "budget" | "dietary" | "paywall";

const steps: Step[] = ["welcome", "name", "interests", "pace", "budget", "dietary", "paywall"];

/** Steps that show the progress dots + back button. */
const trackedSteps: Step[] = ["name", "interests", "pace", "budget", "dietary"];

export function OnboardingScreen() {
  const navigate = useNavigate();
  const completeOnboarding = useProfileStore((state) => state.completeOnboarding);

  const [stepIndex, setStepIndex] = useState(0);
  const [name, setNameDraft] = useState("");
  const [interests, setInterestsDraft] = useState<TravelInterest[]>([]);
  const [pace, setPaceDraft] = useState<TravelPace>("balanced");
  const [budget, setBudgetDraft] = useState<TravelBudget>("mid-range");
  const [dietary, setDietaryDraft] = useState<string[]>([]);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const step = steps[stepIndex];
  const goNext = () => setStepIndex((index) => Math.min(index + 1, steps.length - 1));
  const goBack = () => setStepIndex((index) => Math.max(index - 1, 0));

  const progress = { total: trackedSteps.length, current: trackedSteps.indexOf(step) };

  const handlePlanSelected = async (subscribed: boolean) => {
    setSaving(true);
    setSaveError(null);
    try {
      await completeOnboarding({ name, interests, pace, budget, dietary }, subscribed);
      navigate("/", { replace: true });
    } catch {
      setSaveError("Couldn't save your profile — check your connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  switch (step) {
    case "welcome":
      return <WelcomeStep onNext={goNext} />;
    case "name":
      return (
        <NameStep
          value={name}
          onChange={setNameDraft}
          onNext={goNext}
          onBack={goBack}
          progress={progress}
        />
      );
    case "interests":
      return (
        <InterestsStep
          value={interests}
          onChange={setInterestsDraft}
          onNext={goNext}
          onBack={goBack}
          progress={progress}
        />
      );
    case "pace":
      return (
        <PaceStep
          value={pace}
          onChange={setPaceDraft}
          onNext={goNext}
          onBack={goBack}
          progress={progress}
        />
      );
    case "budget":
      return (
        <BudgetStep
          value={budget}
          onChange={setBudgetDraft}
          onNext={goNext}
          onBack={goBack}
          progress={progress}
        />
      );
    case "dietary":
      return (
        <DietaryStep
          value={dietary}
          onChange={setDietaryDraft}
          onNext={goNext}
          onBack={goBack}
          progress={progress}
        />
      );
    case "paywall":
      return <PaywallStep onSelectPlan={handlePlanSelected} saving={saving} error={saveError} />;
    default:
      return null;
  }
}
