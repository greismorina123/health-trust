import { Link } from "react-router-dom";
import { MapPin, Moon, Sun, User } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

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

export const Nav = ({ variant = "app" }: Props) => {
  return (
    <header className="fixed top-0 left-0 right-0 h-12 z-50 bg-background/80 backdrop-blur-sm border-b border-border-subtle">
      <div className="h-full px-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">TrustMap India</span>
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
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              to="/signup"
              title="Sign In"
              className="h-7 w-7 rounded-full bg-panel-elevated border border-border-subtle flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <User className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};
