import { useState } from "react";
import { X, Info, Download } from "lucide-react";
import { IndiaOutline } from "@/components/IndiaOutline";
import { desertDistricts, severityColor, DesertDistrict } from "@/data/facilities";
import { cn } from "@/lib/utils";

const DesertMapPage = () => {
  const [selected, setSelected] = useState<DesertDistrict | null>(desertDistricts[0]);
  const [specialty, setSpecialty] = useState("General Healthcare");

  return (
    <div className="relative h-[calc(100vh-5rem)] md:h-[calc(100vh-4rem)] -mt-4 md:-mt-0 bg-background overflow-hidden">
      {/* MAP */}
      <div className="absolute inset-0 grid place-items-center">
        <IndiaOutline className="max-h-full max-w-full text-border" stroke="currentColor" strokeWidth={1.5}>
          {desertDistricts.map((d) => {
            const active = selected?.id === d.id;
            return (
              <g key={d.id} onClick={() => setSelected(d)} className="cursor-pointer">
                {active && (
                  <circle cx={d.cx} cy={d.cy} r={18} fill={severityColor[d.severity]} opacity={0.25} className="animate-pulse" />
                )}
                <circle
                  cx={d.cx}
                  cy={d.cy}
                  r={active ? 11 : 8}
                  fill={severityColor[d.severity]}
                  stroke="hsl(var(--background))"
                  strokeWidth={2}
                  className="transition-all hover:r-10"
                />
              </g>
            );
          })}
        </IndiaOutline>
      </div>

      {/* CONTROL PANEL */}
      <div className="absolute top-4 left-4 w-72 max-w-[calc(100vw-2rem)] rounded-xl bg-card/90 backdrop-blur-xl border border-border shadow-xl p-4">
        <h2 className="font-semibold text-foreground">Medical Desert Analysis</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Population ÷ Verified Facilities</p>

        <label className="block mt-3">
          <span className="label-mono">Select Specialty</span>
          <select
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
            className="mt-1 w-full h-9 rounded-lg bg-surface-muted border border-border text-foreground px-2 text-sm focus:outline-none focus:border-primary"
          >
            {["General Healthcare", "Oncology", "Dialysis", "Trauma/Emergency", "Neonatal Care"].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>

        <div className="mt-4 space-y-1.5 text-sm">
          <p className="text-muted-foreground">312 districts analyzed</p>
          <p className="text-trust-low">47 severe deserts identified</p>
          <p className="text-trust-mid">2.3M people in critical gaps</p>
        </div>
      </div>

      {/* LEGEND */}
      <div className="absolute bottom-4 left-4 rounded-lg bg-card/90 backdrop-blur-xl border border-border px-4 py-2 shadow-lg">
        <div className="flex items-center gap-3 text-xs">
          <span className="text-muted-foreground">Severe Desert</span>
          <div
            className="h-2 w-32 rounded-full"
            style={{
              background:
                "linear-gradient(to right, hsl(var(--severity-severe)), hsl(var(--severity-high)), hsl(var(--severity-mid)), hsl(var(--severity-low)))",
            }}
          />
          <span className="text-muted-foreground">Well Served</span>
        </div>
      </div>

      {/* DETAIL PANEL */}
      {selected && (
        <aside className="absolute right-0 top-0 bottom-0 w-full sm:w-96 max-w-[calc(100vw-1rem)] bg-card border-l border-border p-6 overflow-y-auto panel-slide-in">
          <button
            onClick={() => setSelected(null)}
            className="absolute top-4 right-4 grid place-items-center w-8 h-8 rounded-full hover:bg-surface-muted text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>

          <h2 className="text-xl font-bold text-foreground">{selected.name}</h2>
          <p className="text-sm text-muted-foreground">{selected.state}</p>

          <span
            className={cn(
              "mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
              selected.severity === "severe" && "bg-trust-low/15 text-trust-low",
              selected.severity === "high" && "bg-severity-high/15 text-severity-high",
              selected.severity === "mid" && "bg-trust-mid/15 text-trust-mid",
              selected.severity === "low" && "bg-trust-high/15 text-trust-high"
            )}
          >
            {selected.severity === "severe"
              ? "Severe Desert"
              : selected.severity === "high"
              ? "High Risk"
              : selected.severity === "mid"
              ? "Moderate"
              : "Well Served"}
          </span>

          <div className="mt-5 grid grid-cols-2 gap-3">
            {[
              { label: "Population", value: selected.population.toLocaleString() },
              { label: "Verified Facilities", value: selected.verified_facilities.toString() },
              { label: "Desert Score", value: selected.desert_score.toLocaleString() },
              { label: "Nearest Dialysis", value: `${selected.nearest_dialysis_km} km` },
              { label: "Nearest Oncology", value: `${selected.nearest_oncology_km} km` },
              { label: "Nearest Trauma", value: `${selected.nearest_trauma_km} km` },
            ].map((s) => (
              <div key={s.label} className="rounded-lg bg-surface-muted/60 p-3 border border-border">
                <div className="label-mono text-[10px]">{s.label}</div>
                <div className="mt-0.5 text-base font-semibold text-foreground">{s.value}</div>
              </div>
            ))}
          </div>

          <div className="mt-5">
            <div className="flex items-center gap-1.5">
              <span className="label-mono">Data Confidence</span>
              <Info className="w-3 h-3 text-muted-foreground" />
            </div>
            <div className="mt-2 h-2 w-full rounded-full bg-surface-muted overflow-hidden">
              <div className="h-full rounded-full bg-trust-mid" style={{ width: `${selected.data_confidence}%` }} />
            </div>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              {selected.data_confidence}% — Low confidence. Sparse data for this district. Interpret with caution. Prediction interval: ±35%
            </p>
          </div>

          <div className="mt-6">
            <h3 className="font-semibold text-sm text-foreground">Top 3 Nearest Verified Facilities</h3>
            <ul className="mt-2 space-y-2">
              {selected.nearest.map((f, i) => (
                <li key={i} className="flex items-center justify-between gap-3 rounded-lg bg-surface-muted/60 border border-border px-3 py-2">
                  <div className="min-w-0">
                    <p className="text-sm text-foreground truncate">{i + 1}. {f.name}</p>
                    <p className="text-xs text-muted-foreground">{f.distance_km} km</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={cn(
                        "w-9 h-9 rounded-full grid place-items-center text-xs font-bold text-white",
                        f.trust >= 75 ? "bg-trust-high" : f.trust >= 50 ? "bg-trust-mid" : "bg-trust-low"
                      )}
                    >
                      {f.trust}
                    </span>
                    <button className="text-xs text-primary hover:underline">View →</button>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <button
            onClick={() => console.log("Export district report:", selected.name)}
            className="mt-6 w-full inline-flex items-center justify-center gap-2 h-10 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
          >
            <Download className="w-4 h-4" />
            Export District Report
          </button>
        </aside>
      )}
    </div>
  );
};

export default DesertMapPage;
