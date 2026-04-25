import { NavLink, Link } from "react-router-dom";
import { MapPin, HelpCircle, Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { cn } from "@/lib/utils";

const tabs = [
  { to: "/", label: "Search", end: true },
  { to: "/deserts", label: "Desert Map" },
  { to: "/about", label: "About" },
];

export const Navbar = () => {
  const { theme, toggle } = useTheme();

  return (
    <header className="fixed top-0 inset-x-0 z-40 h-16 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="h-full max-w-[1400px] mx-auto px-4 sm:px-6 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <span className="grid place-items-center w-7 h-7 rounded-md bg-primary/15 text-primary">
            <MapPin className="w-4 h-4" />
          </span>
          <span className="font-bold text-lg tracking-tight text-foreground">CareMap</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1 bg-surface-muted/50 rounded-full p-1 border border-border">
          {tabs.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              end={t.end}
              className={({ isActive }) =>
                cn(
                  "px-4 py-1.5 rounded-full text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )
              }
            >
              {t.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={toggle}
            aria-label="Toggle theme"
            className="grid place-items-center w-9 h-9 rounded-full border border-border text-muted-foreground hover:text-foreground hover:bg-surface-muted transition-colors"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <Link
            to="/about"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 h-9 rounded-full border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
            How It Works
          </Link>
        </div>
      </div>

      {/* Mobile tabs */}
      <nav className="md:hidden flex items-center justify-center gap-1 px-2 pb-2">
        {tabs.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.end}
            className={({ isActive }) =>
              cn(
                "px-3 py-1 rounded-full text-xs font-medium transition-colors",
                isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              )
            }
          >
            {t.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
};
