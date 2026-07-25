import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Compass } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { Button } from "../components/Button";

type Mode = "login" | "signup";

export function AuthScreen() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const signup = useAuthStore((state) => state.signup);
  const error = useAuthStore((state) => state.error);
  const clearError = useAuthStore((state) => state.clearError);

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    const action = mode === "login" ? login : signup;
    const ok = await action(email, password);
    setSubmitting(false);
    if (ok) navigate("/", { replace: true });
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    clearError();
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-parchment px-6 pt-safe pb-safe">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-ink text-brass">
        <Compass className="h-7 w-7" />
      </div>
      <h1 className="mt-4 font-display text-3xl text-ink">Waypoint</h1>
      <p className="mt-1 text-sm text-ink/60">
        {mode === "login" ? "Welcome back." : "Create your account to start planning."}
      </p>

      <form onSubmit={handleSubmit} className="mt-8 w-full max-w-sm space-y-4">
        <div>
          <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-ink/60">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-xl border border-hairline bg-card px-4 py-3 text-ink outline-none focus:border-brass"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1.5 block text-xs font-medium text-ink/60">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            required
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-xl border border-hairline bg-card px-4 py-3 text-ink outline-none focus:border-brass"
            placeholder="At least 8 characters"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? "Please wait..." : mode === "login" ? "Log in" : "Sign up"}
        </Button>
      </form>

      <p className="mt-6 text-sm text-ink/60">
        {mode === "login" ? "New to Waypoint?" : "Already have an account?"}{" "}
        <button
          type="button"
          onClick={() => switchMode(mode === "login" ? "signup" : "login")}
          className="font-medium text-ink underline-offset-4 hover:underline"
        >
          {mode === "login" ? "Sign up" : "Log in"}
        </button>
      </p>
    </div>
  );
}
