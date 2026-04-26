import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Nav } from "@/components/Nav";
import { cn } from "@/lib/utils";
import { dashboardPathFor, useRole, type Role as AppRole } from "@/context/RoleContext";

type Role = "patient" | "government";

const roleToApp: Record<Role, AppRole> = {
  patient: "user",
  government: "ngo",
};

const Signup = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const initialRole = (params.get("role") as Role) || "patient";
  const [role, setRole] = useState<Role>(
    ["patient", "government"].includes(initialRole) ? initialRole : "patient",
  );
  const { setRole: setAppRole } = useRole();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    license: "",
    affiliation: "",
    org: "",
    designation: "",
  });

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const appRole = roleToApp[role];
    setAppRole(appRole);
    navigate(dashboardPathFor(appRole));
  };

  const roles: Array<{ key: Role; label: string }> = [
    { key: "patient", label: "Patient" },
    { key: "government", label: "Government / NGO" },
  ];

  return (
    <div className="min-h-screen bg-background overflow-y-auto">
      <Nav variant="landing" />

      <main className="px-6 pt-24 pb-12">
        <div className="max-w-md mx-auto fade-up">
          <h1 className="text-2xl font-semibold text-foreground">Create your account</h1>
          <p className="mt-1 text-sm text-muted-foreground">Join CareMap India</p>

          {/* Role selector */}
          <div className="mt-6 flex gap-2">
            {roles.map((r) => (
              <button
                key={r.key}
                type="button"
                onClick={() => setRole(r.key)}
                className={cn(
                  "flex-1 h-9 rounded-lg text-xs font-medium transition-colors px-2",
                  role === r.key
                    ? "bg-panel-elevated border border-primary text-foreground"
                    : "bg-transparent border border-border-subtle text-muted-foreground hover:text-foreground",
                )}
              >
                {r.label}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="mt-4 flex flex-col gap-3">
            <Field label="Full Name" value={form.name} onChange={update("name")} placeholder="Aarav Sharma" />
            <Field label="Email" type="email" value={form.email} onChange={update("email")} placeholder="you@example.com" />

            {role === "government" && (
              <>
                <Field label="Organization Name" value={form.org} onChange={update("org")} placeholder="Ministry of Health / NGO" />
                <Field label="Role / Designation" value={form.designation} onChange={update("designation")} placeholder="District Health Officer" />
              </>
            )}

            <Field label="Password" type="password" value={form.password} onChange={update("password")} placeholder="••••••••" />

            <button
              type="submit"
              className="mt-2 w-full h-10 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Create Account
            </button>
          </form>

          <p className="mt-4 text-sm text-muted-foreground text-center">
            Already have an account?{" "}
            <Link to="/login" className="text-primary hover:opacity-80">Sign in</Link>
          </p>

          <p className="mt-3 text-xs text-muted-foreground/70 text-center">
            Patient accounts are optional — you can search without signing in.
          </p>
        </div>
      </main>
    </div>
  );
};

interface FieldProps {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  placeholder?: string;
}

const Field = ({ label, value, onChange, type = "text", placeholder }: FieldProps) => (
  <div>
    <label className="text-xs text-muted-foreground block mb-1.5">{label}</label>
    <input
      type={type}
      required
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full h-10 px-3 rounded-lg bg-panel border border-border-subtle text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary/50 transition-colors"
    />
  </div>
);

export default Signup;
