import { useEffect, useMemo, useRef } from "react";
import { CircleMarker, MapContainer, Marker, TileLayer, Tooltip, useMap } from "react-leaflet";
import L, { DivIcon, LatLngExpression } from "leaflet";
import { Search } from "lucide-react";
import {
  DesertZone,
  Facility,
  desertZones,
  facilities,
  severityHsl,
  trustTier,
} from "@/data/facilities";
import { useTheme } from "./ThemeProvider";

interface Props {
  mode: "facilities" | "deserts";
  selectedFacilityId: string | null;
  onSelectFacility: (id: string) => void;
  onSelectDesert: (zone: DesertZone, point: { x: number; y: number }) => void;
  onMapClick: () => void;
  showEmptyState: boolean;
  focus?: { lat: number; lng: number; zoom: number } | null;
}

const INDIA_CENTER: LatLngExpression = [22.5, 82.0];

const buildPinIcon = (facility: Facility, selected: boolean): DivIcon => {
  const tier = trustTier(facility.trust_score);
  const cls = `tm-pin tm-pin-${tier}`;
  const wrapColor =
    tier === "high" ? "color: hsl(158 64% 52%);" : tier === "mid" ? "color: hsl(43 96% 56%);" : "color: hsl(0 89% 72%);";
  return L.divIcon({
    className: "!bg-transparent !border-0",
    html: `<div class="tm-pin-wrap ${selected ? "selected" : ""}" style="${wrapColor} width:14px;height:14px;">
             <div class="${cls}" style="width:14px;height:14px;"></div>
           </div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
};

const FlyTo = ({ focus }: { focus: Props["focus"] }) => {
  const map = useMap();
  useEffect(() => {
    if (focus) map.flyTo([focus.lat, focus.lng], focus.zoom, { duration: 1.2 });
  }, [focus, map]);
  return null;
};

const ClickCatcher = ({ onClick }: { onClick: () => void }) => {
  const map = useMap();
  useEffect(() => {
    const handler = () => onClick();
    map.on("click", handler);
    return () => {
      map.off("click", handler);
    };
  }, [map, onClick]);
  return null;
};

export const TrustMap = ({
  mode,
  selectedFacilityId,
  onSelectFacility,
  onSelectDesert,
  onMapClick,
  showEmptyState,
  focus,
}: Props) => {
  const { theme } = useTheme();
  const wrapperRef = useRef<HTMLDivElement>(null);

  const tileUrl =
    theme === "dark"
      ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";

  const facilityMarkers = useMemo(
    () =>
      facilities.map((f) => (
        <Marker
          key={f.id}
          position={[f.lat, f.lng]}
          icon={buildPinIcon(f, f.id === selectedFacilityId)}
          eventHandlers={{
            click: (e) => {
              L.DomEvent.stopPropagation(e);
              onSelectFacility(f.id);
            },
          }}
        >
          <Tooltip
            direction="top"
            offset={[0, -8]}
            opacity={1}
            className="!bg-panel !text-foreground !border !border-border !rounded-md !shadow-xl !text-xs !px-2 !py-1"
          >
            <div className="font-medium">{f.name}</div>
            <div className="text-muted-foreground">Trust {f.trust_score}/100</div>
          </Tooltip>
        </Marker>
      )),
    [selectedFacilityId, onSelectFacility],
  );

  return (
    <div ref={wrapperRef} className="relative w-full h-full">
      <MapContainer
        center={INDIA_CENTER}
        zoom={5}
        scrollWheelZoom
        zoomControl
        className="absolute inset-0 z-0"
        attributionControl
      >
        <TileLayer
          url={tileUrl}
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          subdomains="abcd"
        />
        <FlyTo focus={focus} />
        <ClickCatcher onClick={onMapClick} />

        {mode === "facilities" && <div className="crossfade-in">{facilityMarkers}</div>}

        {mode === "deserts" &&
          desertZones.map((z) => (
            <CircleMarker
              key={z.id}
              center={[z.lat, z.lng]}
              radius={
                z.severity === "severe" ? 28 : z.severity === "high" ? 22 : z.severity === "mid" ? 18 : 14
              }
              pathOptions={{
                color: severityHsl[z.severity],
                fillColor: severityHsl[z.severity],
                fillOpacity: 0.35,
                weight: 1.5,
                opacity: 0.9,
              }}
              eventHandlers={{
                click: (e) => {
                  L.DomEvent.stopPropagation(e);
                  const containerPoint = e.containerPoint;
                  onSelectDesert(z, { x: containerPoint.x, y: containerPoint.y });
                },
              }}
            />
          ))}
      </MapContainer>

      {showEmptyState && (
        <div className="pointer-events-none absolute inset-0 z-[400] flex items-center justify-center">
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-panel/80 backdrop-blur border border-border text-sm text-muted-foreground fade-up">
            <Search className="w-4 h-4" />
            Ask a question to discover facilities
          </div>
        </div>
      )}
    </div>
  );
};
