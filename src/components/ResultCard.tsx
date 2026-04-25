import { Link } from "react-router-dom";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { Facility } from "@/data/facilities";
import { TrustBadge } from "./TrustBadge";
import { cn } from "@/lib/utils";

interface Props {
  facility: Facility;
  selected?: boolean;
  onSelect?: (id: string) => void;
}

export const ResultCard = ({ facility, selected, onSelect }: Props) => {
  return (
    <article
      onClick={() => onSelect?.(facility.id)}
      className={cn(
        "group rounded-xl bg-card border p-4 mb-3 cursor-pointer transition-all",
        "hover:border-primary/60 hover:shadow-lg hover:shadow-primary/5",
        selected ? "border-primary ring-1 ring-primary/40" : "border-border"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-base sm:text-lg text-foreground leading-snug">{facility.name}</h3>
          <div className="mt-1 flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground">
              {facility.district}, {facility.state}
            </span>
            <span className="text-[10px] font-medium uppercase tracking-wide px-2 py-0.5 rounded-full bg-surface-muted text-muted-foreground">
              {facility.facility_type}
            </span>
          </div>
        </div>
        <TrustBadge score={facility.trust_score} />
      </div>

      <p className="mt-3 text-sm text-foreground/80 leading-relaxed line-clamp-2">{facility.summary}</p>

      {facility.red_flags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {facility.red_flags.map((rf) => (
            <span
              key={rf}
              className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-trust-low/15 text-trust-low"
            >
              <AlertTriangle className="w-3 h-3" />
              {rf}
            </span>
          ))}
        </div>
      )}

      <div className="mt-3 flex items-center justify-end">
        <Link
          to={`/facility/${facility.id}`}
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          View Details
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </article>
  );
};
