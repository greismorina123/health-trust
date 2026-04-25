import { ShieldAlert } from "lucide-react";
import { SAFETY_NOTE } from "@/data/roleData";

interface Props {
  className?: string;
}

/** Always-visible safety disclaimer pinned to the bottom of the viewport. */
export const Disclaimer = ({ className = "" }: Props) => (
  <footer
    role="contentinfo"
    className={`fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70 ${className}`}
  >
    <div className="mx-auto max-w-5xl px-6 py-2.5 flex items-center gap-2 text-[11px] text-muted-foreground leading-snug">
      <ShieldAlert className="h-3.5 w-3.5 shrink-0 text-muted-foreground/80" aria-hidden />
      <p className="line-clamp-2">{SAFETY_NOTE}</p>
    </div>
  </footer>
);
