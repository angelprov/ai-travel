import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { ProgressDots } from "./ProgressDots";

interface OnboardingLayoutProps {
  children: ReactNode;
  onBack?: () => void;
  progress?: { total: number; current: number };
  footer?: ReactNode;
}

export function OnboardingLayout({ children, onBack, progress, footer }: OnboardingLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-parchment">
      <header className="flex h-16 shrink-0 items-center justify-between px-4">
        <div className="w-10">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              aria-label="Back"
              className="flex h-10 w-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-ink/5"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
        </div>
        {progress && <ProgressDots total={progress.total} current={progress.current} />}
        <div className="w-10" />
      </header>

      <main className="flex flex-1 flex-col justify-center px-6 pb-8">
        <div className="mx-auto w-full max-w-md">{children}</div>
      </main>

      {footer && <footer className="mx-auto w-full max-w-md shrink-0 px-6 pb-10">{footer}</footer>}
    </div>
  );
}
