import type { CapacitorConfig } from "@capacitor/cli";

// For local development against the Vite dev server (so the simulator behaves
// exactly like your browser tab, with hot reload), set CAP_SERVER_URL to your
// Mac's LAN IP + Vite's port before syncing, e.g.:
//   CAP_SERVER_URL=http://192.168.1.23:5173 npx cap sync ios
// Omit it for a normal production build, which bundles dist/ into the app.
const devServerUrl = process.env.CAP_SERVER_URL;

const config: CapacitorConfig = {
  appId: "com.waypoint.app",
  appName: "Waypoint",
  webDir: "dist",
  ...(devServerUrl
    ? {
        server: {
          url: devServerUrl,
          cleartext: true,
        },
      }
    : {}),
};

export default config;
