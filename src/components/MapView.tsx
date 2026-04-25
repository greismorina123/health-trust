import { Map as MapIcon } from "lucide-react";
import { IndiaOutline } from "./IndiaOutline";
import { Facility, trustTier } from "@/data/facilities";
import { cn } from "@/lib/utils";

interface Props {
  facilities: Facility[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
}

// Project lat/lng to SVG coords in 600x700 viewBox.
// India spans roughly lng 68-97, lat 8-37.
const project = (lat: number, lng: number) => {
  const x = ((lng - 68) / (97 - 68)) * 460 + 90;
  const y = ((37 - lat) / (37 - 8)) * 580 + 60;
  return { x, y };
};

const tierFill = (t: ReturnType<typeof trustTier>) =>
  t === "high" ? "hsl(var(--trust-high))" : t === "mid" ? "hsl(var(--trust-mid))" : "hsl(var(--trust-low))";

export const MapView = ({ facilities, selectedId, onSelect }: Props) => {
  return (
    <div className="relative w-full h-full min-h-[400px] rounded-xl bg-surface-muted/40 border border-border overflow-hidden">
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/80 backdrop-blur border border-border text-xs text-muted-foreground">
        <MapIcon className="w-3.5 h-3.5" />
        Map View — Mapbox Integration
      </div>

      <IndiaOutline className="absolute inset-0 w-full h-full text-border" stroke="currentColor" strokeWidth={1.5}>
        {facilities.map((f) => {
          const { x, y } = project(f.lat, f.lng);
          const selected = selectedId === f.id;
          const t = trustTier(f.trust_score);
          return (
            <g key={f.id} onClick={() => onSelect?.(f.id)} className="cursor-pointer">
              {selected && (
                <circle cx={x} cy={y} r={14} fill={tierFill(t)} opacity={0.25} className="animate-pulse" />
              )}
              <circle
                cx={x}
                cy={y}
                r={selected ? 8 : 6}
                fill={tierFill(t)}
                stroke="hsl(var(--background))"
                strokeWidth={2}
                className={cn("transition-all", selected && "drop-shadow-lg")}
              />
            </g>
          );
        })}
      </IndiaOutline>
    </div>
  );
};
