import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Role = "user" | "ngo";

interface RoleContextValue {
  role: Role;
  setRole: (r: Role) => void;
}

const RoleContext = createContext<RoleContextValue | undefined>(undefined);

const STORAGE_KEY = "trustmap.role";

export const RoleProvider = ({ children }: { children: ReactNode }) => {
  const [role, setRoleState] = useState<Role>(() => {
    if (typeof window === "undefined") return "user";
    const stored = window.localStorage.getItem(STORAGE_KEY) as Role | null;
    return stored === "ngo" || stored === "user" ? stored : "user";
  });

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, role);
  }, [role]);

  const setRole = (r: Role) => setRoleState(r);

  return <RoleContext.Provider value={{ role, setRole }}>{children}</RoleContext.Provider>;
};

export const useRole = () => {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used within RoleProvider");
  return ctx;
};

export const dashboardPathFor = (r: Role) => (r === "ngo" ? "/ngo" : "/search");

export const roleLabel = (r: Role) => (r === "ngo" ? "NGO" : "User");
