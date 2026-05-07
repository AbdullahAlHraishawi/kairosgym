import { Link, useLocation } from "@tanstack/react-router";
import { Home, Dumbbell, BarChart3, Trophy, User } from "lucide-react";

const tabs = [
  { to: "/", label: "Home", icon: Home, exact: true },
  { to: "/workout", label: "Workout", icon: Dumbbell, exact: false },
  { to: "/progress", label: "Progress", icon: BarChart3, exact: true },
  { to: "/leaderboard", label: "Ranks", icon: Trophy, exact: true },
  { to: "/profile", label: "You", icon: User, exact: true },
] as const;

export function BottomNav() {
  const { pathname } = useLocation();
  return (
    <nav className="fixed bottom-0 left-1/2 z-40 w-full max-w-md -translate-x-1/2 border-t border-border/50 bg-background/40 backdrop-blur-xl backdrop-saturate-150">
      <ul className="flex items-center justify-around px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2">
        {tabs.map((t) => {
          const active = t.exact ? pathname === t.to : pathname.startsWith(t.to);
          const Icon = t.icon;
          return (
            <li key={t.to} className="flex-1">
              <Link
                to={t.to}
                className="press flex flex-col items-center gap-0.5 rounded-lg py-1.5 text-[10px] font-medium"
              >
                <Icon
                  className={`h-5 w-5 transition-colors ${active ? "text-primary" : "text-muted-foreground"}`}
                  strokeWidth={active ? 2.5 : 2}
                />
                <span className={active ? "text-foreground" : "text-muted-foreground"}>
                  {t.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
