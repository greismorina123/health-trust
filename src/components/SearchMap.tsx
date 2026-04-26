import { useEffect, useMemo, useRef } from "react";
import {
  CircleMarker,
  LayerGroup,
  MapContainer,
  TileLayer,
  Tooltip,
  useMap,
} from "react-leaflet";
import type { LatLngBoundsExpression, Map as LeafletMap } from "leaflet";
import L from "leaflet";
import {
  type DesertZone,
  type Facility,
  desertZones,
  facilities,
  trustHsl,
} from "@/data/facilities";
import { useTheme } from "@/components/ThemeProvider";

/** District desert overlay item (compatible with the live /districts API). */
export interface DistrictOverlayItem {
  id: string;
  district: string;
  state: string;
  lat: number;
  lng: number;
  desert_score: number; // 0 = green (good), 100 = red (severe desert)
  population?: number;
  num_facilities?: number;
  top_capability_gaps: string[];
}

/** Choose a heat color based on desert_score (0 green → 100 red). */
const desertHeatColor = (score: number): string => {
  if (score >= 70) return "hsl(var(--severity-severe))";
  if (score >= 40) return "hsl(var(--severity-high))";
  if (score >= 20) return "hsl(var(--severity-mid))";
  return "hsl(var(--severity-low))";
};

const desertRadius = (score: number): number => {
  // Scale 14 → 32 px based on desert_score
  return 14 + Math.round((Math.max(0, Math.min(100, score)) / 100) * 18);
};

const INDIA_CENTER: [number, number] = [22.0, 79.0];
const INDIA_BOUNDS: LatLngBoundsExpression = [
  [6, 65],
  [37, 100],
];

const severityStyle: Record<DesertZone["severity"], { color: string; radius: number; fillOpacity: number }> = {
  severe:   { color: "hsl(0 74% 50%)",  radius: 30, fillOpacity: 0.15 },
  moderate: { color: "hsl(21 90% 54%)", radius: 22, fillOpacity: 0.12 },
  low:      { color: "hsl(142 71% 45%)", radius: 15, fillOpacity: 0.08 },
};

interface Props {
  mode: "facilities" | "deserts";
  selectedId: string | null;
  /** IDs of facilities that are search results (get a white ring + pulse). */
  resultIds: string[];
  onSelectFacility: (f: Facility) => void;
  onSelectDesert: (d: DesertZone, screenPos: { x: number; y: number }) => void;
  flyTo: { lat: number; lng: number; zoom?: number } | null;
  /** When set, fitBounds to these coordinates. */
  fitBounds: Array<[number, number]> | null;
  /** Optional override list of facilities (e.g., live API pins). Falls back to mock. */
  facilityList?: Facility[];
  /** When true, non-result facility pins are dimmed. */
  dimNonResults?: boolean;
  /** Live district overlay (used when mode === "deserts" and provided). */
  districtList?: DistrictOverlayItem[];
  /** Click handler for live district overlay items. */
  onSelectDistrict?: (d: DistrictOverlayItem) => void;
}

const MapController = ({
  flyTo,
  fitBounds,
}: {
  flyTo: Props["flyTo"];
  fitBounds: Props["fitBounds"];
}) => {
  const map = useMap();
  useEffect(() => {
    if (flyTo) {
      map.flyTo([flyTo.lat, flyTo.lng], flyTo.zoom ?? 9, { duration: 0.8 });
    }
  }, [flyTo, map]);
  useEffect(() => {
    if (fitBounds && fitBounds.length > 0) {
      const b = L.latLngBounds(fitBounds.map(([lat, lng]) => L.latLng(lat, lng)));
      map.flyToBounds(b, { padding: [60, 60], duration: 0.8, maxZoom: 9 });
    }
  }, [fitBounds, map]);
  return null;
};

export const SearchMap = ({
  mode,
  selectedId,
  resultIds,
  onSelectFacility,
  onSelectDesert,
  flyTo,
  fitBounds,
  facilityList,
  dimNonResults = false,
  districtList,
  onSelectDistrict,
  interactive = false,
}: Props & { interactive?: boolean }) => {
  const mapRef = useRef<LeafletMap | null>(null);
  const resultSet = useMemo(() => new Set(resultIds), [resultIds]);
  const { theme } = useTheme();
  const rawSource = facilityList && facilityList.length > 0 ? facilityList : facilities;
  const facilitySource = useMemo(
    () => rawSource.filter((f) => Number.isFinite(f.lat) && Number.isFinite(f.lng)),
    [rawSource],
  );
  const hasResults = resultSet.size > 0;

  const facilityMarkers = useMemo(
    () =>
      facilitySource.map((f) => {
        const isSelected = f.id === selectedId;
        const isResult = resultSet.has(f.id);
        const dimmed = dimNonResults && hasResults && !isResult;
        const color = trustHsl(f.trust_score);
        const hasContradictions = (f.red_flags?.length ?? 0) > 0;
        return (
          <LayerGroup key={f.id}>
            {(isSelected || isResult) && (
              <CircleMarker
                center={[f.lat, f.lng]}
                radius={isResult ? 12 : 14}
                pathOptions={{
                  color,
                  fillColor: color,
                  fillOpacity: 0.2,
                  weight: 0,
                  className: "pulse-halo",
                }}
                interactive={false}
              />
            )}
            <CircleMarker
              center={[f.lat, f.lng]}
              radius={isResult ? 8 : 7}
              pathOptions={{
                color: isResult ? "#ffffff" : color,
                fillColor: color,
                fillOpacity: dimmed ? 0.25 : 0.9,
                weight: isResult ? 2.5 : 1.5,
                opacity: dimmed ? 0.4 : 1,
              }}
              eventHandlers={{
                click: () => onSelectFacility(f),
              }}
            >
              <Tooltip direction="top" offset={[0, -8]} opacity={1} className="!bg-transparent !border-0 !shadow-none">
                <span style={{ display: "block", lineHeight: 1.3 }}>
                  <strong>{f.name}</strong>
                  <br />
                  Score: {f.trust_score}
                  {hasContradictions && (
                    <>
                      <br />
                      <span style={{ color: "hsl(var(--trust-low))" }}>⚠ contradictions</span>
                    </>
                  )}
                </span>
              </Tooltip>
            </CircleMarker>
            {hasContradictions && !dimmed && (
              <CircleMarker
                center={[f.lat, f.lng]}
                radius={3}
                pathOptions={{
                  color: "hsl(var(--trust-low))",
                  fillColor: "hsl(var(--trust-low))",
                  fillOpacity: 1,
                  weight: 1,
                }}
                interactive={false}
              />
            )}
          </LayerGroup>
        );
      }),
    [selectedId, onSelectFacility, resultSet, facilitySource, dimNonResults, hasResults],
  );

  const desertMarkers = useMemo(
    () =>
      desertZones.map((z) => {
        const s = severityStyle[z.severity];
        return (
          <CircleMarker
            key={z.id}
            center={[z.lat, z.lng]}
            radius={s.radius}
            pathOptions={{
              color: s.color,
              fillColor: s.color,
              fillOpacity: s.fillOpacity,
              weight: 1,
              opacity: 0.35,
            }}
            eventHandlers={{
              click: (e) => {
                const map = mapRef.current;
                if (!map) return;
                const point = map.latLngToContainerPoint(e.latlng);
                const rect = map.getContainer().getBoundingClientRect();
                onSelectDesert(z, { x: rect.left + point.x, y: rect.top + point.y });
              },
            }}
          />
        );
      }),
    [onSelectDesert],
  );

  const districtOverlay = useMemo(() => {
    if (!districtList) return null;
    return districtList
      .filter((d) => Number.isFinite(d.lat) && Number.isFinite(d.lng))
      .map((d) => {
        const color = desertHeatColor(d.desert_score);
        const r = desertRadius(d.desert_score);
        const gaps = (d.top_capability_gaps ?? []).slice(0, 3).join(", ") || "—";
        return (
          <CircleMarker
            key={d.id}
            center={[d.lat, d.lng]}
            radius={r}
            pathOptions={{
              color,
              fillColor: color,
              fillOpacity: 0.45,
              weight: 1,
              opacity: 0.7,
            }}
            eventHandlers={{
              click: () => onSelectDistrict?.(d),
            }}
          >
            <Tooltip direction="top" offset={[0, -6]} opacity={1} className="desert-tooltip">
              <span style={{ display: "block", lineHeight: 1.35 }}>
                <strong>{d.district}</strong>, {d.state}
                <br />
                Desert score: <strong>{d.desert_score}</strong>
                <br />
                <span style={{ opacity: 0.75 }}>Top gaps: {gaps}</span>
              </span>
            </Tooltip>
          </CircleMarker>
        );
      });
  }, [districtList, onSelectDistrict]);

  return (
    <MapContainer
      center={INDIA_CENTER}
      zoom={5}
      minZoom={4}
      maxZoom={14}
      maxBounds={INDIA_BOUNDS}
      maxBoundsViscosity={1.0}
      zoomControl={true}
      scrollWheelZoom={interactive}
      doubleClickZoom={interactive}
      touchZoom={interactive}
      dragging={interactive}
      boxZoom={interactive}
      keyboard={interactive}
      style={{ width: "100%", height: "100%" }}
      ref={(m) => {
        mapRef.current = m;
      }}
    >
      <TileLayer
        key={theme}
        url={
          theme === "light"
            ? "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            : "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        }
        attribution='&copy; OpenStreetMap &copy; CARTO'
        subdomains={["a", "b", "c", "d"]}
      />
      <MapController flyTo={flyTo} fitBounds={fitBounds} />
      {mode === "facilities"
        ? <>{facilityMarkers}</>
        : districtOverlay
          ? <>{districtOverlay}</>
          : <>{desertMarkers}</>}
    </MapContainer>
  );
};
