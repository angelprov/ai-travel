import { Compass, House, Luggage, BedDouble, User } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";

const navItems = [
  { to: "/home", label: "Home", icon: House },
  { to: "/trips", label: "Trips", icon: Luggage },
  { to: "/stays", label: "Stays", icon: BedDouble },
  { to: "/profile", label: "Profile", icon: User },
];

function navLinkClass(isActive: boolean) {
  return `flex flex-col items-center justify-center gap-1 rounded-xl px-3 py-1.5 text-[11px] font-medium transition-colors md:flex-row md:justify-start md:gap-3 md:px-3 md:py-2.5 md:text-sm ${
    isActive ? "text-ink md:bg-ink/5" : "text-ink/40 hover:text-ink/70"
  }`;
}

export function AppShell() {
  return (
    <div className="flex h-dvh flex-col bg-surface md:flex-row">
      {/* Desktop sidebar */}
      <aside className="hidden w-56 shrink-0 flex-col border-r border-line bg-surface md:flex">
        <div className="flex items-center gap-2 px-5 py-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-white">
            <Compass className="h-4 w-4" />
          </div>
          <div className="font-display text-lg leading-tight text-ink">Waypoint</div>
        </div>
        <nav className="flex flex-col gap-1 px-3">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => navLinkClass(isActive)}>
              <Icon className="h-4.5 w-4.5" />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex min-h-0 flex-1 flex-col">
        <main className="min-h-0 flex-1 overflow-hidden">
          <Outlet />
        </main>

        {/* Mobile bottom tab bar */}
        <nav
          className="flex shrink-0 items-stretch justify-around border-t border-line bg-surface/95 backdrop-blur md:hidden"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `${navLinkClass(isActive)} flex-1 py-2`}>
              <Icon className="h-5 w-5" />
              {label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
