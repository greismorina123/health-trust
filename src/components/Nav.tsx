import { Link } from "react-router-dom";
import { MapPin, Moon, Sun, User, Stethoscope, Building2 } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { useRole, type Role } from "@/context/RoleContext";
import { useBackendStatus } from "@/hooks/useBackendStatus";
import { cn } from "@/lib/utils";

const BackendStatusDot = () => {
  const status = useBackendStatus();
  const tone =
    status === "online"
      ? "bg-trust-high"
      : status === "offline"
        ? "bg-trust-low"
        : "bg-muted-foreground";
  const label =
    status === "online"
      ? "Backend connected"
      : status === "offline"
        ? "Backend unavailable · using fallback data"
        : "Checking backend…";
  return (
    <span
      title={label}
      aria-label={label}
      className="hidden sm:inline-flex items-center gap-1.5 h-7 px-2 rounded-full bg-panel-elevated border border-border-subtle text-[10px] text-muted-foreground"
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", tone, status === "checking" && "animate-pulse")} />
      <span>{status === "online" ? "API" : status === "offline" ? "Fallback" : "…"}</span>
    </span>
  );
};

interface Props {
  variant?: "landing" | "app";
}

const ThemeToggle = () => {
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      aria-label="Toggle theme"
      className="h-7 w-7 rounded-full bg-panel-elevated border border-border-subtle flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
    >
      {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
    </button>
  );
};

const roleMeta: Record<Role, { label: string; icon: typeof User }> = {
  user: { label: "User", icon: User },
  doctor: { label: "Doctor", icon: Stethoscope },
  ngo: { label: "NGO", icon: Building2 },
};

const RoleBadge = () => {
  const { role } = useRole();
  const Icon = roleMeta[role].icon;
  return (
    <span
      title={`Signed in as ${roleMeta[role].label}`}
      className="h-7 pl-2 pr-2.5 inline-flex items-center gap-1.5 rounded-full bg-panel-elevated border border-border-subtle text-xs text-foreground"
    >
      <Icon className="h-3 w-3 text-muted-foreground" />
      <span className="font-medium">{roleMeta[role].label}</span>
    </span>
  );
};

export const Nav = ({ variant = "app" }: Props) => {
  return (
    <header className="fixed top-0 left-0 right-0 h-12 z-50 bg-background/80 backdrop-blur-sm border-b border-border-subtle">
      <div className="h-full px-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">CareMap India</span>
        </Link>

        {variant === "landing" ? (
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              to="/signup"
              className="h-9 px-4 inline-flex items-center rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Get Started
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <BackendStatusDot />
            <RoleSwitcher />
            <ThemeToggle />
          </div>
        )}
      </div>
    </header>
  );
};
