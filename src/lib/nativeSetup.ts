import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";

/**
 * No-op in the browser. On iOS/Android, sets dark status bar icons for our
 * light parchment theme. The WebView stays edge-to-edge (overlaying the
 * status bar / home indicator area) — our header and composer bars are
 * deliberately full-bleed to those edges, with `env(safe-area-inset-*)`
 * padding (see index.css, ChatScreen/OnboardingLayout) keeping content
 * clear of the notch and home indicator.
 */
export async function configureNativeChrome(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  try {
    await StatusBar.setStyle({ style: Style.Dark });
  } catch (error) {
    console.warn("[nativeSetup] failed to configure status bar:", error);
  }
}
