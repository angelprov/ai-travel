import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Mail, Pencil } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { useProfileStore } from "../store/profileStore";
import type { OnboardingDraft } from "../store/profileStore";
import { Button } from "../components/Button";
import { Chip } from "../components/onboarding/Chip";
import { interestOptions, paceOptions, budgetOptions, dietaryOptions } from "../lib/onboardingOptions";

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-line py-3 last:border-b-0">
      <span className="text-xs font-semibold uppercase tracking-wide text-ink/50">{label}</span>
      <span className="text-sm text-ink">{value}</span>
    </div>
  );
}

function draftFromProfile(profile: OnboardingDraft): OnboardingDraft {
  return {
    name: profile.name,
    interests: [...profile.interests],
    pace: profile.pace,
    budget: profile.budget,
    dietary: [...profile.dietary],
  };
}

export function ProfileScreen() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const profile = useProfileStore((state) => state.profile);
  const updateProfile = useProfileStore((state) => state.updateProfile);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<OnboardingDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const startEditing = () => {
    if (!profile) return;
    setDraft(draftFromProfile(profile));
    setError(null);
    setEditing(true);
  };

  const toggleInterest = (value: OnboardingDraft["interests"][number]) => {
    setDraft((prev) =>
      prev
        ? { ...prev, interests: prev.interests.includes(value) ? prev.interests.filter((i) => i !== value) : [...prev.interests, value] }
        : prev,
    );
  };

  const toggleDietary = (option: string) => {
    setDraft((prev) =>
      prev ? { ...prev, dietary: prev.dietary.includes(option) ? prev.dietary.filter((d) => d !== option) : [...prev.dietary, option] } : prev,
    );
  };

  const handleSave = async () => {
    if (!draft) return;
    setSaving(true);
    setError(null);
    try {
      await updateProfile(draft);
      setEditing(false);
    } catch {
      setError("Couldn't save your changes — check your connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!profile) return null;

  if (editing && draft) {
    return (
      <div className="scrollbar-thin h-full overflow-y-auto px-5 py-6" style={{ paddingTop: "calc(1.5rem + env(safe-area-inset-top))" }}>
        <h1 className="mb-5 font-display text-2xl text-ink">Edit profile</h1>

        <label className="mb-6 block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink/50">Name</span>
          <input
            value={draft.name}
            onChange={(event) => setDraft({ ...draft, name: event.target.value })}
            className="w-full rounded-xl border border-line bg-card px-4 py-3 text-sm text-ink outline-none focus:border-accent"
          />
        </label>

        <div className="mb-6">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-ink/50">Pace</span>
          <div className="flex gap-2">
            {paceOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setDraft({ ...draft, pace: option.value })}
                className={`flex-1 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors ${
                  draft.pace === option.value ? "border-accent bg-accent/15 text-ink" : "border-line bg-card text-ink/70 hover:border-accent/60"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-ink/50">Budget</span>
          <div className="flex gap-2">
            {budgetOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setDraft({ ...draft, budget: option.value })}
                className={`flex-1 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors ${
                  draft.budget === option.value ? "border-accent bg-accent/15 text-ink" : "border-line bg-card text-ink/70 hover:border-accent/60"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-ink/50">Interests</span>
          <div className="grid grid-cols-2 gap-2">
            {interestOptions.map(({ value, label, icon: Icon }) => (
              <Chip
                key={value}
                label={label}
                selected={draft.interests.includes(value)}
                onClick={() => toggleInterest(value)}
                icon={<Icon className="h-4 w-4 shrink-0" />}
              />
            ))}
          </div>
        </div>

        <div className="mb-6">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-ink/50">Dietary</span>
          <div className="grid grid-cols-2 gap-2">
            {dietaryOptions.map((option) => (
              <Chip key={option} label={option} selected={draft.dietary.includes(option)} onClick={() => toggleDietary(option)} />
            ))}
          </div>
        </div>

        {error && <p className="mb-4 text-sm text-danger">{error}</p>}

        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => setEditing(false)} disabled={saving} className="flex-1 border border-line">
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={saving} className="flex-1">
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="scrollbar-thin h-full overflow-y-auto px-5 py-6" style={{ paddingTop: "calc(1.5rem + env(safe-area-inset-top))" }}>
      <div className="mb-5 flex items-center justify-between gap-3">
        <h1 className="font-display text-2xl text-ink">Profile</h1>
        <button
          type="button"
          onClick={startEditing}
          className="flex items-center gap-1.5 rounded-full border border-line bg-card px-3.5 py-1.5 text-sm font-medium text-ink/70 transition-colors hover:border-accent/60"
        >
          <Pencil className="h-3.5 w-3.5" />
          Edit
        </button>
      </div>

      <div className="mb-6 flex items-center gap-3 rounded-2xl border border-line bg-card p-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink text-white font-display text-lg">
          {(profile.name || user?.email || "?").charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-medium text-ink">{profile.name || "Traveler"}</div>
          <div className="flex items-center gap-1 truncate text-xs text-ink/50">
            <Mail className="h-3 w-3 shrink-0" />
            {user?.email}
          </div>
        </div>
      </div>

      <div className="mb-6 rounded-2xl border border-line bg-card px-4">
        <Field label="Pace" value={profile.pace} />
        <Field label="Budget" value={profile.budget} />
        <Field label="Interests" value={profile.interests.length ? profile.interests.join(", ") : "None set"} />
        <Field label="Dietary" value={profile.dietary.length ? profile.dietary.join(", ") : "None set"} />
        <Field label="Waypoint Plus" value={profile.subscribed ? "Subscribed" : "Not subscribed"} />
      </div>

      <button
        type="button"
        onClick={handleLogout}
        className="flex w-full items-center justify-center gap-2 rounded-full border border-line bg-card py-3 text-sm font-semibold text-ink transition-colors hover:bg-ink/5"
      >
        <LogOut className="h-4 w-4" />
        Log out
      </button>
    </div>
  );
}
