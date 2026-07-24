import type { ReactElement } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useProfileStore } from "./store/profileStore";
import { OnboardingScreen } from "./screens/OnboardingScreen";
import { ChatScreen } from "./screens/ChatScreen";

function RequireOnboarding({ children }: { children: ReactElement }) {
  const onboardingComplete = useProfileStore((state) => state.onboardingComplete);
  return onboardingComplete ? children : <Navigate to="/welcome" replace />;
}

function RedirectIfOnboarded({ children }: { children: ReactElement }) {
  const onboardingComplete = useProfileStore((state) => state.onboardingComplete);
  return onboardingComplete ? <Navigate to="/" replace /> : children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/welcome"
          element={
            <RedirectIfOnboarded>
              <OnboardingScreen />
            </RedirectIfOnboarded>
          }
        />
        <Route
          path="/"
          element={
            <RequireOnboarding>
              <ChatScreen />
            </RequireOnboarding>
          }
        />
        <Route
          path="/trip/:tripId"
          element={
            <RequireOnboarding>
              <ChatScreen />
            </RequireOnboarding>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
