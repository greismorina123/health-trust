import { useEffect, useMemo, useRef } from "react";
import { CircleMarker, MapContainer, TileLayer, Tooltip, useMap } from "react-leaflet";
import type { LatLngBoundsExpression, Map as LeafletMap } from "leaflet";
import L from "leaflet";
import { useTheme } from "@/components/ThemeProvider";
import { type DesertRegion, desertRegions } from "@/data/roleData";

const INDIA_CENTER: [number, number] = [22.0, 79.0];
const INDIA_BOUNDS: LatLngBoundsExpression = [
  [6, 65],
  [37, 100],
];

// Per current product spec: LOWER desert_score = WORSE coverage.
//   0–30 critical (red), 31–60 underserved (amber), 61–100 better served (green).
const styleForScore = (score: number) => {
  if (score <= 30) return { color: "hsl(0 74% 55%)", radius: 14, fill: 0.35 };
  if (score <= 60) return { color: "hsl(36 94% 56%)", radius: 11, fill: 0.28 };
  return { color: "hsl(142 71% 45%)", radius: 9, fill: 0.22 };
};

const hasCoords = (r: DesertRegion) =>
  Number.isFinite(r.lat) && Number.isFinite(r.lng);

interface Props {
  regions: DesertRegion[];
  selectedId: string | null;
  onSelect: (r: DesertRegion) => void;
}

const FlyController = ({ target }: { target: DesertRegion | null }) => {
  const map = useMap();
  useEffect(() => {
    if (target && hasCoords(target)) {
      map.flyTo([target.lat, target.lng], 7, { duration: 0.7 });
    }
  }, [target, map]);
  return null;
};

export const DesertMap = ({ regions, selectedId, onSelect }: Props) => {
  const mapRef = useRef<LeafletMap | null>(null);
  const { theme } = useTheme();
  const plotted = useMemo(() => regions.filter(hasCoords), [regions]);
  const target = useMemo(
    () => plotted.find((r) => r.id === selectedId) ?? null,
    [plotted, selectedId],
  );

  // Fit to all visible regions on filter change.
  useEffect(() => {
    if (!mapRef.current || plotted.length === 0) return;
    const bounds = L.latLngBounds(plotted.map((r) => L.latLng(r.lat, r.lng)));
    mapRef.current.flyToBounds(bounds, { padding: [50, 50], duration: 0.6, maxZoom: 6 });
  }, [plotted]);

  // Invalidate Leaflet's cached size whenever the container resizes.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const container = map.getContainer();
    let raf = 0;
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        map.invalidateSize({ animate: false, pan: false });
      });
    });
    ro.observe(container);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <MapContainer
      center={INDIA_CENTER}
      zoom={5}
      minZoom={4}
      maxZoom={10}
      maxBounds={INDIA_BOUNDS}
      maxBoundsViscosity={1.0}
      zoomControl={true}
      scrollWheelZoom={false}
      doubleClickZoom={false}
      touchZoom={false}
      dragging={false}
      boxZoom={false}
      keyboard={false}
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
        attribution="&copy; OpenStreetMap &copy; CARTO"
        subdomains={["a", "b", "c", "d"]}
      />
      <FlyController target={target} />
      {plotted.map((r) => {
        const s = styleForScore(r.riskScore);
        const isSelected = r.id === selectedId;
        return (
          <CircleMarker
            key={r.id}
            center={[r.lat, r.lng]}
            radius={isSelected ? s.radius + 4 : s.radius}
            pathOptions={{
              color: s.color,
              fillColor: s.color,
              fillOpacity: isSelected ? Math.min(0.5, s.fill + 0.15) : s.fill,
              weight: isSelected ? 3 : 1,
              opacity: isSelected ? 1 : 0.7,
            }}
            eventHandlers={{ click: () => onSelect(r) }}
          >
            <Tooltip direction="top" offset={[0, -8]} opacity={1} className="desert-tooltip">
              <span style={{ display: "block", lineHeight: 1.35 }}>
                <strong style={{ fontSize: "13px" }}>{r.areaName}</strong>
                <br />
                <span style={{ fontSize: "12px", opacity: 0.85 }}>
                  {r.state} · score {r.riskScore}
                </span>
              </span>
            </Tooltip>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
};

// Default export of all regions for convenience
export const allDesertRegions = desertRegions;
