import { useEffect } from "react";
import type { ReactElement } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Compass } from "lucide-react";
import { useAuthStore } from "./store/authStore";
import { useProfileStore } from "./store/profileStore";
import { AuthScreen } from "./screens/AuthScreen";
import { OnboardingScreen } from "./screens/OnboardingScreen";
import { ChatScreen } from "./screens/ChatScreen";
import { HomeScreen } from "./screens/HomeScreen";
import { TripsScreen } from "./screens/TripsScreen";
import { StaysScreen } from "./screens/StaysScreen";
import { ProfileScreen } from "./screens/ProfileScreen";
import { AppShell } from "./components/AppShell";

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface">
      <div className="flex h-12 w-12 animate-pulse items-center justify-center rounded-full bg-ink text-white">
        <Compass className="h-6 w-6" />
      </div>
    </div>
  );
}

/** Home/Trips/Stays/Profile/trip detail: needs a signed-in, onboarded user. */
function RequireAuth({ children }: { children: ReactElement }) {
  const status = useAuthStore((state) => state.status);
  const onboardingComplete = useProfileStore((state) => state.onboardingComplete);

  if (status === "idle" || status === "loading") return <LoadingScreen />;
  if (status === "unauthenticated") return <Navigate to="/login" replace />;
  if (!onboardingComplete) return <Navigate to="/welcome" replace />;
  return children;
}

/** Onboarding wizard: needs a signed-in user who hasn't finished onboarding yet. */
function RequireOnboardingInProgress({ children }: { children: ReactElement }) {
  const status = useAuthStore((state) => state.status);
  const onboardingComplete = useProfileStore((state) => state.onboardingComplete);

  if (status === "idle" || status === "loading") return <LoadingScreen />;
  if (status === "unauthenticated") return <Navigate to="/login" replace />;
  if (onboardingComplete) return <Navigate to="/home" replace />;
  return children;
}

/** Login/signup: only for signed-out visitors. */
function RedirectIfAuthenticated({ children }: { children: ReactElement }) {
  const status = useAuthStore((state) => state.status);
  const onboardingComplete = useProfileStore((state) => state.onboardingComplete);

  if (status === "idle" || status === "loading") return <LoadingScreen />;
  if (status === "authenticated") return <Navigate to={onboardingComplete ? "/home" : "/welcome"} replace />;
  return children;
}

function App() {
  const hydrate = useAuthStore((state) => state.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <RedirectIfAuthenticated>
              <AuthScreen />
            </RedirectIfAuthenticated>
          }
        />
        <Route
          path="/welcome"
          element={
            <RequireOnboardingInProgress>
              <OnboardingScreen />
            </RequireOnboardingInProgress>
          }
        />
        <Route
          element={
            <RequireAuth>
              <AppShell />
            </RequireAuth>
          }
        >
          <Route path="/home" element={<HomeScreen />} />
          <Route path="/trips" element={<TripsScreen />} />
          <Route path="/trips/:tripId" element={<ChatScreen />} />
          <Route path="/stays" element={<StaysScreen />} />
          <Route path="/profile" element={<ProfileScreen />} />
        </Route>
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
