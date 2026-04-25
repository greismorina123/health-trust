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

const riskStyle = (r: DesertRegion) => {
  if (r.riskLevel === "high") return { color: "hsl(0 74% 50%)", radius: 28, fill: 0.18 };
  if (r.riskLevel === "medium") return { color: "hsl(21 90% 54%)", radius: 22, fill: 0.14 };
  return { color: "hsl(142 71% 45%)", radius: 16, fill: 0.1 };
};

interface Props {
  regions: DesertRegion[];
  selectedId: string | null;
  onSelect: (r: DesertRegion) => void;
}

const FlyController = ({ target }: { target: DesertRegion | null }) => {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo([target.lat, target.lng], 7, { duration: 0.7 });
  }, [target, map]);
  return null;
};

export const DesertMap = ({ regions, selectedId, onSelect }: Props) => {
  const mapRef = useRef<LeafletMap | null>(null);
  const { theme } = useTheme();
  const target = useMemo(() => regions.find((r) => r.id === selectedId) ?? null, [regions, selectedId]);

  // Fit to all visible regions on filter change.
  useEffect(() => {
    if (!mapRef.current || regions.length === 0) return;
    const bounds = L.latLngBounds(regions.map((r) => L.latLng(r.lat, r.lng)));
    mapRef.current.flyToBounds(bounds, { padding: [50, 50], duration: 0.6, maxZoom: 6 });
  }, [regions]);

  // Invalidate Leaflet's cached size whenever the container resizes
  // (e.g. when a sibling panel collapses and the map suddenly gets wider).
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const container = map.getContainer();
    const ro = new ResizeObserver(() => {
      map.invalidateSize();
    });
    ro.observe(container);
    return () => ro.disconnect();
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
      {regions.map((r) => {
        const s = riskStyle(r);
        const isSelected = r.id === selectedId;
        return (
          <CircleMarker
            key={r.id}
            center={[r.lat, r.lng]}
            radius={s.radius}
            pathOptions={{
              color: s.color,
              fillColor: s.color,
              fillOpacity: s.fill,
              weight: isSelected ? 2.5 : 1,
              opacity: isSelected ? 0.9 : 0.5,
            }}
            eventHandlers={{ click: () => onSelect(r) }}
          >
            <Tooltip direction="top" offset={[0, -8]} opacity={1} className="desert-tooltip">
              <span style={{ display: "block", lineHeight: 1.35 }}>
                <strong style={{ fontSize: "13px" }}>{r.areaName}</strong>
                <br />
                <span style={{ fontSize: "12px", opacity: 0.85 }}>
                  {r.missingCapability} · risk {r.riskScore}
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
