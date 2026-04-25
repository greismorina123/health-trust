import { DesertZone } from "@/data/facilities";
import { cn } from "@/lib/utils";

interface Props {
  zone: DesertZone;
  point: { x: number; y: number };
  onViewFacilities: (zone: DesertZone) => void;
  onClose: () => void;
}

export const DesertTooltip = ({ zone, point, onViewFacilities, onClose }: Props) => {
  const conf = zone.confidence;
  const confDot =
    conf === "high" ? "bg-trust-high" : conf === "medium" ? "bg-trust-mid" : "bg-trust-mid";
  const confText =
    conf === "high"
      ? "High confidence"
      : conf === "medium"
      ? "Medium confidence"
      : "Low confidence — sparse data";

  // Position tooltip above the click point
  const style: React.CSSProperties = {
    left: point.x,
    top: point.y - 12,
    transform: "translate(-50%, -100%)",
  };

  return (
    <>
      {/* invisible backdrop to close on outside click */}
      <div className="absolute inset-0 z-[700]" onClick={onClose} />
      <div
        className="absolute z-[701] w-64 bg-panel border border-border rounded-lg p-4 shadow-2xl fade-up"
        style={style}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-base font-semibold text-foreground">
          {zone.district}
          <span className="text-muted-foreground font-normal">, {zone.state}</span>
        </div>
        <div className="text-sm text-muted-strong mt-1">
          {zone.population} people · {zone.verified} verified facilities
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2">
          <span className={cn("w-1.5 h-1.5 rounded-full", confDot)} />
          {confText}
        </div>
        <button
          onClick={() => onViewFacilities(zone)}
          className="mt-3 text-xs text-primary hover:underline"
        >
          View facilities →
        </button>

        {/* Pointer triangle */}
        <div
          className="absolute left-1/2 -bottom-1.5 -translate-x-1/2 w-3 h-3 rotate-45 bg-panel border-r border-b border-border"
        />
      </div>
    </>
  );
};
