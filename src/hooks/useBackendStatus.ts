import { useEffect, useState } from "react";
import { checkHealth } from "@/services/trustmapApi";

export type BackendStatus = "checking" | "online" | "offline";

/** Polls the backend health endpoint at startup and every 60s after. */
export const useBackendStatus = (): BackendStatus => {
  const [status, setStatus] = useState<BackendStatus>("checking");

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      const ok = await checkHealth();
      if (!cancelled) setStatus(ok ? "online" : "offline");
    };
    tick();
    const id = window.setInterval(tick, 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  return status;
};
