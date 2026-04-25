import { useEffect, useMemo, useRef } from "react";
import { CircleMarker, LayerGroup, MapContainer, Popup, TileLayer, useMap } from "react-leaflet";
import type { LatLngBoundsExpression, Map as LeafletMap } from "leaflet";
import {
  type DesertZone,
  type Facility,
  desertZones,
  facilities,
  trustHsl,
} from "@/data/facilities";

const INDIA_CENTER: [number, number] = [20.5, 79.0];
const INDIA_BOUNDS: LatLngBoundsExpression = [
  [6, 68],
  [37, 98],
];

const severityStyle: Record<DesertZone["severity"], { color: string; radius: number; opacity: number }> = {
  severe: { color: "hsl(0 74% 50%)", radius: 30, opacity: 0.2 },
  high: { color: "hsl(21 90% 54%)", radius: 26, opacity: 0.18 },
  mid: { color: "hsl(48 96% 53%)", radius: 22, opacity: 0.15 },
  low: { color: "hsl(142 71% 45%)", radius: 15, opacity: 0.1 },
};

interface Props {
  mode: "facilities" | "deserts";
  selectedId: string | null;
  onSelectFacility: (f: Facility) => void;
  onSelectDesert: (d: DesertZone, screenPos: { x: number; y: number }) => void;
  /** When set, map will fly to these coords. */
  flyTo: { lat: number; lng: number; zoom?: number } | null;
}

const FlyToController = ({
  flyTo,
}: {
  flyTo: Props["flyTo"];
}) => {
  const map = useMap();
  useEffect(() => {
    if (flyTo) {
      map.flyTo([flyTo.lat, flyTo.lng], flyTo.zoom ?? 9, { duration: 0.8 });
    }
  }, [flyTo, map]);
  return null;
};

export const SearchMap = ({ mode, selectedId, onSelectFacility, onSelectDesert, flyTo }: Props) => {
  const mapRef = useRef<LeafletMap | null>(null);

  const facilityMarkers = useMemo(
    () =>
      facilities.map((f) => {
        const isSelected = f.id === selectedId;
        const color = trustHsl(f.trust_score);
        return (
          <LayerGroup key={f.id}>
            {isSelected && (
              <CircleMarker
                center={[f.lat, f.lng]}
                radius={12}
                pathOptions={{
                  color,
                  fillColor: color,
                  fillOpacity: 0.3,
                  weight: 0,
                }}
                interactive={false}
              />
            )}
            <CircleMarker
              center={[f.lat, f.lng]}
              radius={6}
              pathOptions={{
                color: "hsl(var(--background))",
                fillColor: color,
                fillOpacity: 0.85,
                weight: 1.5,
              }}
              eventHandlers={{
                click: () => onSelectFacility(f),
              }}
            >
              <Popup>
                <strong>{f.name}</strong>
                <br />
                Trust score: {f.trust_score}/100
              </Popup>
            </CircleMarker>
          </LayerGroup>
        );
      }),
    [selectedId, onSelectFacility],
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
              fillOpacity: s.opacity,
              weight: 1,
              opacity: 0.6,
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
      maxBoundsViscosity={0.8}
      zoomControl={true}
      style={{ width: "100%", height: "100%" }}
      ref={(m) => {
        mapRef.current = m;
      }}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; OpenStreetMap &copy; CARTO'
        subdomains={["a", "b", "c", "d"]}
      />
      <FlyToController flyTo={flyTo} />
      {mode === "facilities" ? <>{facilityMarkers}</> : <>{desertMarkers}</>}
    </MapContainer>
  );
};
