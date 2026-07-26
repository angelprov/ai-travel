import { Compass } from "lucide-react";
import { Button } from "../../Button";

interface WelcomeStepProps {
  onNext: () => void;
}

export function WelcomeStep({ onNext }: WelcomeStepProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-6 pt-safe pb-safe text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-ink text-white">
        <Compass className="h-8 w-8" />
      </div>
      <h1 className="mt-6 font-display text-4xl text-ink">Waypoint</h1>
      <p className="mt-3 max-w-xs text-ink/70">
        Tell us how you like to travel, then talk to your planner like you would a well-traveled
        friend.
      </p>
      <Button onClick={onNext} className="mt-10 w-full max-w-xs">
        Get started
      </Button>
    </div>
  );
}
