import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronRight, Send, Sparkles } from "lucide-react";
import { chainOfThoughtSteps, exampleQueries } from "@/data/facilities";
import { cn } from "@/lib/utils";

export interface ChatTurn {
  id: string;
  query: string;
  /** Number of CoT steps that have animated in (0..4). When equal to total, final answer shows. */
  revealedSteps: number;
  done: boolean;
}

interface Props {
  turns: ChatTurn[];
  onSubmit: (q: string) => void;
}

const STEP_STAGGER = 400;

export const ChatPanel = ({ turns, onSubmit }: Props) => {
  const [input, setInput] = useState("");
  const threadRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: "smooth" });
  }, [turns]);

  const submit = (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setInput("");
  };

  return (
    <div className="flex flex-col h-full">
      {/* Input */}
      <div className="px-4 pt-4 pb-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit(input);
          }}
          className="relative"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about any facility or region..."
            className="w-full h-10 pl-3 pr-10 rounded-lg bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 transition-colors"
          />
          <button
            type="submit"
            aria-label="Send"
            className="absolute right-1 top-1 h-8 w-8 inline-flex items-center justify-center rounded-md text-primary hover:bg-panel-elevated transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        {/* Chips */}
        <div className="flex flex-col gap-2 mt-3">
          {exampleQueries.map((q) => (
            <button
              key={q}
              onClick={() => submit(q)}
              className="text-left text-sm text-muted-strong px-3 py-2 rounded-lg bg-panel-elevated border border-border hover:border-primary/60 hover:text-foreground transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      <div className="h-px bg-border mx-4" />

      {/* Thread */}
      <div ref={threadRef} className="flex-1 overflow-y-auto scrollbar-thin px-4 py-4 space-y-5">
        {turns.length === 0 && (
          <div className="text-center text-xs text-muted-foreground/70 mt-8">
            Pick a query above or ask your own.
          </div>
        )}
        {turns.map((t) => (
          <ChatTurnView key={t.id} turn={t} />
        ))}
      </div>
    </div>
  );
};

const ChatTurnView = ({ turn }: { turn: ChatTurn }) => {
  return (
    <div className="space-y-3">
      {/* User message */}
      <div className="flex justify-end">
        <div className="max-w-[85%] bg-panel-accent border border-primary/20 text-foreground rounded-lg px-3 py-2 text-sm fade-up">
          {turn.query}
        </div>
      </div>

      {/* Agent: chain of thought */}
      <div className="bg-panel-elevated border border-border rounded-lg p-3 space-y-2">
        {chainOfThoughtSteps.map((step, i) => {
          const visible = i < turn.revealedSteps;
          const isCurrent = !turn.done && i === turn.revealedSteps - 1;
          return visible ? (
            <CotStep key={step.label} step={step} index={i} active={isCurrent} />
          ) : null;
        })}

        {turn.done && (
          <div className="pt-2 mt-2 border-t border-border text-sm text-foreground flex items-start gap-2 fade-up">
            <Sparkles className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
            <span>Found 6 facilities matching your query. Showing results on map.</span>
          </div>
        )}
      </div>
    </div>
  );
};

const CotStep = ({
  step,
  index,
  active,
}: {
  step: { label: string; detail: string };
  index: number;
  active: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const style = useMemo(
    () => ({ animationDelay: `${index * 60}ms` }),
    [index],
  );

  return (
    <div className="fade-up" style={style}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 text-left group"
      >
        <ChevronRight
          className={cn(
            "w-3 h-3 text-muted-foreground transition-transform",
            open && "rotate-90",
          )}
        />
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground group-hover:text-muted-strong transition-colors">
          {step.label}
        </span>
        {active && (
          <span className="ml-auto inline-block w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
        )}
      </button>
      {open && (
        <div className="pl-5 pt-1 text-xs text-muted-foreground fade-up">{step.detail}</div>
      )}
    </div>
  );
};
