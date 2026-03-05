"use client";

import { useEffect } from "react";
import {
  CircleMarker,
  MapContainer,
  TileLayer,
  Tooltip,
  useMap,
} from "react-leaflet";

export type ApprovalDestinationPoint = Readonly<{
  label: string;
  value: number;
  latitude: number;
  longitude: number;
}>;

type ApprovalTurnaroundMapCanvasProps = Readonly<{
  points: readonly ApprovalDestinationPoint[];
}>;

const PHILIPPINES_CENTER: [number, number] = [12.8797, 121.7740];

function LeafletSizeSync() {
  const map = useMap();

  useEffect(() => {
    const sync = () => {
      map.invalidateSize();
    };

    const frame = window.requestAnimationFrame(sync);
    const timer = window.setTimeout(sync, 120);
    window.addEventListener("resize", sync);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
      window.removeEventListener("resize", sync);
    };
  }, [map]);

  return null;
}

export function ApprovalTurnaroundMapCanvas({
  points,
}: ApprovalTurnaroundMapCanvasProps) {
  const maxValue = Math.max(1, ...points.map((point) => point.value));

  return (
    <div className="approval-white-map h-[320px] w-full overflow-hidden rounded-lg border border-[#dfe1ed] bg-white">
      <MapContainer
        center={PHILIPPINES_CENTER}
        zoom={5}
        minZoom={5}
        maxZoom={5}
        preferCanvas
        zoomControl={false}
        scrollWheelZoom={false}
        touchZoom={false}
        doubleClickZoom={false}
        dragging={false}
        boxZoom={false}
        keyboard={false}
        className="h-full w-full"
      >
        <LeafletSizeSync />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {points.map((point) => (
          <CircleMarker
            key={`${point.label}-${point.latitude}-${point.longitude}`}
            center={[point.latitude, point.longitude]}
            radius={8 + Math.round((point.value / maxValue) * 6)}
            pathOptions={{
              color: "#1f6f38",
              fillColor: "#2f8f3a",
              fillOpacity: 0.85,
              weight: 2,
            }}
          >
            <Tooltip direction="top" offset={[0, -8]} opacity={1}>
              <div className="px-1 py-0.5">
                <p className="text-[12px] font-semibold text-[#2f3339]">{point.label}</p>
                <p className="text-[11px] text-[#4a5266]">{point.value} submitted orders</p>
              </div>
            </Tooltip>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
