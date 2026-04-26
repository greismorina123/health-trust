import { useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Nav } from "@/components/Nav";
import { dashboardPathFor, useRole, type Role } from "@/context/RoleContext";

const Login = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const role = params.get("role");
  const { setRole, role: currentRole } = useRole();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const next: Role =
      role === "ngo" || role === "government" ? "ngo" : currentRole;
    setRole(next);
    navigate(dashboardPathFor(next));
  };

  const roleLabel =
    role === "ngo" || role === "government"
      ? { label: "NGO Dashboard", color: "text-trust-mid" }
      : null;

  return (
    <div className="min-h-screen bg-background">
      <Nav variant="landing" />
      <main className="px-6 pt-24">
        <div className="max-w-sm mx-auto fade-up">
          <h1 className="text-xl font-semibold text-foreground">Sign in to CareMap</h1>
          {roleLabel && (
            <p className={`mt-1 text-sm font-medium ${roleLabel.color}`}>{roleLabel.label}</p>
          )}

          <form onSubmit={submit} className="mt-6 space-y-3">
            <div>
              <label className="text-xs text-muted-foreground block mb-1.5">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-panel border border-border-subtle text-sm text-foreground outline-none focus:border-primary/50 transition-colors"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1.5">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-panel border border-border-subtle text-sm text-foreground outline-none focus:border-primary/50 transition-colors"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              className="w-full h-10 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Sign In
            </button>
          </form>

          <p className="mt-4 text-xs text-muted-foreground/70 text-center">
            Demo only — no credentials required.
          </p>
        </div>
      </main>
    </div>
  );
};

export default Login;
