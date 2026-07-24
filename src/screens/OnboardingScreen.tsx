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
  const setName = useProfileStore((state) => state.setName);
  const setInterests = useProfileStore((state) => state.setInterests);
  const setPace = useProfileStore((state) => state.setPace);
  const setBudget = useProfileStore((state) => state.setBudget);
  const setDietary = useProfileStore((state) => state.setDietary);

  const [stepIndex, setStepIndex] = useState(0);
  const [name, setNameDraft] = useState("");
  const [interests, setInterestsDraft] = useState<TravelInterest[]>([]);
  const [pace, setPaceDraft] = useState<TravelPace>("balanced");
  const [budget, setBudgetDraft] = useState<TravelBudget>("mid-range");
  const [dietary, setDietaryDraft] = useState<string[]>([]);

  const step = steps[stepIndex];
  const goNext = () => setStepIndex((index) => Math.min(index + 1, steps.length - 1));
  const goBack = () => setStepIndex((index) => Math.max(index - 1, 0));

  const progress = { total: trackedSteps.length, current: trackedSteps.indexOf(step) };

  const handlePlanSelected = (subscribed: boolean) => {
    setName(name);
    setInterests(interests);
    setPace(pace);
    setBudget(budget);
    setDietary(dietary);
    completeOnboarding(subscribed);
    navigate("/", { replace: true });
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
      return <PaywallStep onSelectPlan={handlePlanSelected} />;
    default:
      return null;
  }
}
