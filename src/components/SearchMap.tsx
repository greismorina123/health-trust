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
  /** IDs of facilities that are search results (get a white ring). */
  resultIds: string[];
  onSelectFacility: (f: Facility) => void;
  onSelectDesert: (d: DesertZone, screenPos: { x: number; y: number }) => void;
  flyTo: { lat: number; lng: number; zoom?: number } | null;
  /** When set, fitBounds to these coordinates. */
  fitBounds: Array<[number, number]> | null;
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
}: Props) => {
  const mapRef = useRef<LeafletMap | null>(null);
  const resultSet = useMemo(() => new Set(resultIds), [resultIds]);
  const { theme } = useTheme();

  const facilityMarkers = useMemo(
    () =>
      facilities.map((f) => {
        const isSelected = f.id === selectedId;
        const isResult = resultSet.has(f.id);
        const color = trustHsl(f.trust_score);
        return (
          <LayerGroup key={f.id}>
            {isSelected && (
              <CircleMarker
                center={[f.lat, f.lng]}
                radius={14}
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
              radius={7}
              pathOptions={{
                color: isResult ? "#ffffff" : color,
                fillColor: color,
                fillOpacity: 0.85,
                weight: isResult ? 2 : 1.5,
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
                </span>
              </Tooltip>
            </CircleMarker>
          </LayerGroup>
        );
      }),
    [selectedId, onSelectFacility, resultSet],
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

  return (
    <MapContainer
      center={INDIA_CENTER}
      zoom={5}
      minZoom={4}
      maxZoom={14}
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
        attribution='&copy; OpenStreetMap &copy; CARTO'
        subdomains={["a", "b", "c", "d"]}
      />
      <MapController flyTo={flyTo} fitBounds={fitBounds} />
      {mode === "facilities" ? <>{facilityMarkers}</> : <>{desertMarkers}</>}
    </MapContainer>
  );
};
