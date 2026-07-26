import { useNavigate } from "react-router-dom";
import { LogOut, Mail } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { useProfileStore } from "../store/profileStore";

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-line py-3 last:border-b-0">
      <span className="text-xs font-semibold uppercase tracking-wide text-ink/50">{label}</span>
      <span className="text-sm text-ink">{value}</span>
    </div>
  );
}

export function ProfileScreen() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const profile = useProfileStore((state) => state.profile);

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  if (!profile) return null;

  return (
    <div className="scrollbar-thin h-full overflow-y-auto px-5 py-6" style={{ paddingTop: "calc(1.5rem + env(safe-area-inset-top))" }}>
      <h1 className="mb-5 font-display text-2xl text-ink">Profile</h1>

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
