import { ShieldAlert } from "lucide-react";
import { SAFETY_NOTE } from "@/data/roleData";

interface Props {
  className?: string;
}

/** Footer-level safety disclaimer rendered at the end of pages. */
export const Disclaimer = ({ className = "" }: Props) => (
  <footer
    role="contentinfo"
    className={`mt-12 border-t border-border/60 bg-muted/30 ${className}`}
  >
    <div className="mx-auto max-w-5xl px-6 py-5 flex items-start gap-3 text-xs text-muted-foreground leading-relaxed">
      <ShieldAlert className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground/80" aria-hidden />
      <p>{SAFETY_NOTE}</p>
    </div>
  </footer>
);
