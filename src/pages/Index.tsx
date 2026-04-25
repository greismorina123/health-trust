import { useCallback, useEffect, useRef, useState } from "react";
import { MapPin, Moon, Sun } from "lucide-react";
import { ChatPanel, ChatTurn } from "@/components/ChatPanel";
import { TrustMap } from "@/components/TrustMap";
import { FacilityDrawer } from "@/components/FacilityDrawer";
import { DesertTooltip } from "@/components/DesertTooltip";
import { DesertZone, getFacility, chainOfThoughtSteps } from "@/data/facilities";
import { useTheme } from "@/components/ThemeProvider";
import { cn } from "@/lib/utils";

const STEP_STAGGER = 400;

const Index = () => {
  const { theme, toggle } = useTheme();
  const [mode, setMode] = useState<"facilities" | "deserts">("facilities");
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [hasQueried, setHasQueried] = useState(false);
  const [selectedFacilityId, setSelectedFacilityId] = useState<string | null>(null);
  const [desertTip, setDesertTip] = useState<{ zone: DesertZone; point: { x: number; y: number } } | null>(null);
  const [focus, setFocus] = useState<{ lat: number; lng: number; zoom: number } | null>(null);
  const timersRef = useRef<number[]>([]);

  // Pre-populate one completed conversation
  useEffect(() => {
    setTurns([
      {
        id: "seed",
        query: "Emergency C-section in rural Maharashtra",
        revealedSteps: chainOfThoughtSteps.length,
        done: true,
      },
    ]);
    setHasQueried(true);
  }, []);

  useEffect(() => {
    return () => {
      timersRef.current.forEach((t) => window.clearTimeout(t));
    };
  }, []);

  const handleQuery = useCallback((query: string) => {
    setHasQueried(true);
    setMode("facilities");
    const id = `t-${Date.now()}`;
    setTurns((prev) => [...prev, { id, query, revealedSteps: 0, done: false }]);

    chainOfThoughtSteps.forEach((_, i) => {
      const t = window.setTimeout(() => {
        setTurns((prev) =>
          prev.map((turn) => (turn.id === id ? { ...turn, revealedSteps: i + 1 } : turn)),
        );
      }, (i + 1) * STEP_STAGGER);
      timersRef.current.push(t);
    });

    const tDone = window.setTimeout(
      () => {
        setTurns((prev) => prev.map((turn) => (turn.id === id ? { ...turn, done: true } : turn)));
      },
      (chainOfThoughtSteps.length + 1) * STEP_STAGGER,
    );
    timersRef.current.push(tDone);
  }, []);

  const handleSelectFacility = useCallback((id: string) => {
    setSelectedFacilityId(id);
    setDesertTip(null);
    const f = getFacility(id);
    if (f) setFocus({ lat: f.lat, lng: f.lng, zoom: 7 });
  }, []);

  const handleSelectDesert = useCallback((zone: DesertZone, point: { x: number; y: number }) => {
    setDesertTip({ zone, point });
  }, []);

  const handleViewFacilities = useCallback((zone: DesertZone) => {
    setMode("facilities");
    setDesertTip(null);
    setFocus({ lat: zone.lat, lng: zone.lng, zoom: 8 });
  }, []);

  const handleMapClick = useCallback(() => {
    setSelectedFacilityId(null);
    setDesertTip(null);
  }, []);

  const selectedFacility = selectedFacilityId ? getFacility(selectedFacilityId) ?? null : null;
  const showEmptyState = !hasQueried && mode === "facilities";

  return (
    <div className="h-screen w-screen flex bg-background text-foreground overflow-hidden">
      {/* LEFT SIDEBAR */}
      <aside className="w-[300px] shrink-0 bg-panel border-r border-border flex flex-col h-full">
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              <h1 className="text-lg font-semibold text-foreground">TrustMap India</h1>
            </div>
            <button
              onClick={toggle}
              aria-label="Toggle theme"
              className="w-7 h-7 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-panel-elevated transition-colors"
            >
              {theme === "dark" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">AI-powered facility intelligence</p>
        </div>
        <div className="h-px bg-border" />

        <div className="flex-1 min-h-0">
          <ChatPanel turns={turns} onSubmit={handleQuery} />
        </div>
      </aside>

      {/* CENTER MAP + RIGHT DRAWER overlay */}
      <main className="relative flex-1 h-full min-w-0">
        <TrustMap
          mode={mode}
          selectedFacilityId={selectedFacilityId}
          onSelectFacility={handleSelectFacility}
          onSelectDesert={handleSelectDesert}
          onMapClick={handleMapClick}
          showEmptyState={showEmptyState}
          focus={focus}
        />

        {/* Top-right toggle */}
        <div className="absolute top-4 right-4 z-[500] bg-panel border border-border rounded-lg p-1 flex items-center gap-1 shadow-lg">
          {(["facilities", "deserts"] as const).map((m) => (
            <button
              key={m}
              onClick={() => {
                setMode(m);
                setDesertTip(null);
                setSelectedFacilityId(null);
              }}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                mode === m
                  ? "bg-panel-elevated text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {m === "facilities" ? "Facilities" : "Desert Heatmap"}
            </button>
          ))}
        </div>

        {mode === "deserts" && (
          <div className="absolute bottom-4 left-4 z-[500] bg-panel/90 backdrop-blur border border-border rounded-lg px-3 py-2 fade-up">
            <div
              className="h-1.5 w-48 rounded-full"
              style={{
                background:
                  "linear-gradient(to right, hsl(var(--severity-severe)), hsl(var(--severity-high)), hsl(var(--severity-mid)), hsl(var(--severity-low)))",
              }}
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground mt-1.5">
              <span>Severe desert</span>
              <span>Well served</span>
            </div>
          </div>
        )}

        {desertTip && mode === "deserts" && (
          <DesertTooltip
            zone={desertTip.zone}
            point={desertTip.point}
            onViewFacilities={handleViewFacilities}
            onClose={() => setDesertTip(null)}
          />
        )}

        {selectedFacility && mode === "facilities" && (
          <FacilityDrawer facility={selectedFacility} onClose={() => setSelectedFacilityId(null)} />
        )}
      </main>
    </div>
  );
};

export default Index;
