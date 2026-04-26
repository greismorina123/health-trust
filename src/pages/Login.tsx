import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { User, Building2 } from "lucide-react";
import { Nav } from "@/components/Nav";
import { dashboardPathFor, useRole, type Role } from "@/context/RoleContext";
import { cn } from "@/lib/utils";

const Login = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const queryRole = params.get("role");
  const { setRole, role: currentRole } = useRole();

  // Initial role: ?role=ngo from URL wins, otherwise the last-used role.
  const initialRole: Role =
    queryRole === "ngo" || queryRole === "government" ? "ngo" : currentRole;
  const [selectedRole, setSelectedRole] = useState<Role>(initialRole);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setRole(selectedRole);
    navigate(dashboardPathFor(selectedRole));
  };

  const roleOptions: { value: Role; label: string; desc: string; icon: typeof User }[] = [
    { value: "user", label: "User", desc: "Search trusted facilities", icon: User },
    { value: "ngo", label: "NGO", desc: "Identify care deserts", icon: Building2 },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Nav variant="landing" />
      <main className="px-6 pt-24">
        <div className="max-w-sm mx-auto fade-up">
          <h1 className="text-xl font-semibold text-foreground">Sign in to Health Trust</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose how you want to use Health Trust.
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">Sign in as</p>
              <div className="grid grid-cols-2 gap-2">
                {roleOptions.map(({ value, label, desc, icon: Icon }) => {
                  const active = selectedRole === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setSelectedRole(value)}
                      className={cn(
                        "rounded-lg border p-3 text-left transition-colors",
                        active
                          ? "border-primary bg-primary/5"
                          : "border-border-subtle bg-panel hover:border-primary/40",
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-4 w-4 mb-1.5",
                          active ? "text-primary" : "text-muted-foreground",
                        )}
                      />
                      <p className="text-sm font-medium text-foreground">{label}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                        {desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

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
              Sign In as {selectedRole === "ngo" ? "NGO" : "User"}
            </button>
          </form>

          <p className="mt-4 text-sm text-muted-foreground text-center">
            Don't have an account?{" "}
            <Link
              to={`/signup?role=${selectedRole}`}
              className="text-primary font-medium hover:underline"
            >
              Sign up
            </Link>
          </p>

          <p className="mt-2 text-xs text-muted-foreground/70 text-center">
            Demo only — no credentials required.
          </p>
        </div>
      </main>
    </div>
  );
};

export default Login;
