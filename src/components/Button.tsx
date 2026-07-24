import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "teal";
  children: ReactNode;
}

const variantClasses: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "bg-brass text-ink hover:bg-brass-dark disabled:bg-brass/50",
  secondary: "bg-ink text-parchment hover:bg-ink/90 disabled:bg-ink/40",
  teal: "bg-teal text-white hover:bg-teal-dark disabled:bg-teal/50",
  ghost: "bg-transparent text-ink hover:bg-ink/5 disabled:text-ink/40",
};

export function Button({ variant = "primary", className = "", children, ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-colors disabled:cursor-not-allowed ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
