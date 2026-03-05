"use client";

import { useEffect } from "react";
import {
  GeoJSON,
  MapContainer,
  TileLayer,
  Tooltip,
  useMap,
} from "react-leaflet";
import type { Feature, Geometry } from "geojson";

export type ApprovalDestinationPoint = Readonly<{
  label: string;
  value: number;
  latitude: number;
  longitude: number;
  boundaryGeojson: Geometry | null;
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
    <div className="approval-white-map h-[360px] w-full overflow-hidden rounded-lg border border-[#dfe1ed] bg-white xl:h-[420px]">
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

        {points.map((point) => {
          if (!point.boundaryGeojson) {
            return null;
          }

          const strength = point.value / maxValue;
          const outlineWeight = 1.5 + strength * 2.25;
          const boundaryFeature: Feature = {
            type: "Feature",
            properties: {
              label: point.label,
              value: point.value,
            },
            geometry: point.boundaryGeojson,
          };

          return (
            <GeoJSON
              key={`${point.label}-${point.latitude}-${point.longitude}`}
              data={boundaryFeature}
              style={{
                color: "#146f38",
                fillColor: "#2f9a52",
                fillOpacity: 0.42 + strength * 0.26,
                weight: outlineWeight + 1,
              }}
            >
              <Tooltip direction="center" opacity={1} sticky>
                <div className="px-1 py-0.5">
                  <p className="text-[12px] font-semibold text-[#2f3339]">{point.label}</p>
                  <p className="text-[11px] text-[#4a5266]">{point.value} submitted orders</p>
                </div>
              </Tooltip>
            </GeoJSON>
          );
        })}
      </MapContainer>
    </div>
  );
}
