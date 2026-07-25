import { Check, Sparkles } from "lucide-react";
import { Button } from "../../Button";
import { plusFeatures } from "../../../lib/onboardingOptions";

interface PaywallStepProps {
  onSelectPlan: (subscribed: boolean) => void;
  saving?: boolean;
  error?: string | null;
}

export function PaywallStep({ onSelectPlan, saving, error }: PaywallStepProps) {
  return (
    <div
      className="flex min-h-screen flex-col bg-parchment px-6 py-10"
      style={{
        paddingTop: "calc(2.5rem + env(safe-area-inset-top))",
        paddingBottom: "calc(2.5rem + env(safe-area-inset-bottom))",
      }}
    >
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
        <div className="rounded-3xl border border-hairline bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2 text-brass-dark">
            <Sparkles className="h-5 w-5" />
            <span className="font-mono text-xs font-semibold uppercase tracking-widest">
              Waypoint Plus
            </span>
          </div>

          <div className="mt-3 flex items-baseline gap-1">
            <span className="font-display text-4xl text-ink">€12.99</span>
            <span className="text-ink/60">/ month</span>
          </div>
          <p className="mt-1 font-mono text-xs text-teal">7-day free trial, cancel anytime</p>

          <ul className="mt-6 space-y-3">
            {plusFeatures.map((feature) => (
              <li key={feature} className="flex items-start gap-2 text-sm text-ink/80">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-teal" />
                {feature}
              </li>
            ))}
          </ul>

          <Button onClick={() => onSelectPlan(true)} disabled={saving} className="mt-7 w-full">
            {saving ? "Setting things up..." : "Start free trial"}
          </Button>
        </div>

        <button
          type="button"
          onClick={() => onSelectPlan(false)}
          disabled={saving}
          className="mt-6 text-center text-sm font-medium text-ink/60 underline-offset-4 hover:underline disabled:opacity-50"
        >
          Continue with Free plan
        </button>

        {error && <p className="mt-4 text-center text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}
