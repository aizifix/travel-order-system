"use client";

import { useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import { CircleMarker, MapContainer, Popup, Polyline, TileLayer, useMap } from "react-leaflet";
import { latLngBounds, type CircleMarker as LeafletCircleMarker } from "leaflet";

type Position = [number, number];

export type MapRouteStop = Readonly<{
  id: string;
  label: string;
  destination: string;
  purpose?: string;
  departureDate?: string;
  returnDate?: string;
}>;

type MapViewProps = Readonly<{
  stops: readonly MapRouteStop[];
  emptyMessage?: string;
  heightClassName?: string;
  activeStopId?: string | null;
  onStopSelect?: (stopId: string) => void;
}>;

type ResolvedStop = MapRouteStop &
  Readonly<{
    position: Position;
  }>;

type DestinationCoordinate = Readonly<{
  keys: readonly string[];
  position: Position;
}>;

type GeocodeApiResponse = Readonly<{
  success: boolean;
  data?: Readonly<{
    latitude: number;
    longitude: number;
  }> | null;
}>;

type RoutePathApiResponse = Readonly<{
  success: boolean;
  data?: Readonly<{
    positions: readonly Position[];
  }> | null;
}>;

const DEFAULT_CENTER: Position = [12.8797, 121.774];
const DEFAULT_ZOOM = 7;
const FOCUSED_STOP_ZOOM = 10;

const DESTINATION_COORDINATES: readonly DestinationCoordinate[] = [
  { keys: ["cagayan de oro", "cdo"], position: [8.4542, 124.6319] },
  { keys: ["iligan"], position: [8.228, 124.2452] },
  { keys: ["malaybalay"], position: [8.1575, 125.1278] },
  { keys: ["valencia city"], position: [7.9042, 125.0928] },
  { keys: ["davao city"], position: [7.1907, 125.4553] },
  { keys: ["cebu city"], position: [10.3157, 123.8854] },
  { keys: ["iloilo city"], position: [10.7202, 122.5621] },
  { keys: ["quezon city"], position: [14.676, 121.0437] },
  { keys: ["manila"], position: [14.5995, 120.9842] },
  { keys: ["butuan"], position: [8.9475, 125.5406] },
  { keys: ["bukidnon"], position: [8.0515, 125.0944] },
  { keys: ["misamis oriental"], position: [8.5046, 124.6219] },
  { keys: ["misamis occidental"], position: [8.3375, 123.7071] },
  { keys: ["camiguin"], position: [9.1732, 124.7299] },
];

const geocodedDestinationCache = new Map<string, Position | null>();
const geocodedDestinationRequests = new Map<string, Promise<Position | null>>();
const routePathCache = new Map<string, readonly Position[] | null>();
const routePathRequests = new Map<string, Promise<readonly Position[] | null>>();

function parseIsoDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const [yearPart, monthPart, dayPart] = value.split("-");
  const year = Number.parseInt(yearPart, 10);
  const month = Number.parseInt(monthPart, 10);
  const day = Number.parseInt(dayPart, 10);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date;
}

function formatDate(value?: string): string {
  if (!value) {
    return "-";
  }

  const parsed = parseIsoDate(value);
  if (!parsed) {
    return "-";
  }

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function formatDateRange(startDate?: string, endDate?: string): string {
  const startLabel = formatDate(startDate);
  const endLabel = formatDate(endDate);

  if (startLabel === "-" && endLabel === "-") {
    return "-";
  }

  if (startDate && endDate && startDate === endDate && startLabel !== "-") {
    return startLabel;
  }

  return `${startLabel} to ${endLabel}`;
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getDestinationKey(destination: string): string {
  return normalizeText(destination);
}

function resolveKnownDestination(destination: string): Position | null {
  const normalized = normalizeText(destination);
  if (!normalized) {
    return null;
  }

  for (const entry of DESTINATION_COORDINATES) {
    if (entry.keys.some((key) => normalized.includes(key))) {
      return entry.position;
    }
  }

  return null;
}

function positionsMatch(
  left: Position | null | undefined,
  right: Position | null | undefined,
): boolean {
  if (!left && !right) {
    return true;
  }

  if (!left || !right) {
    return false;
  }

  return left[0] === right[0] && left[1] === right[1];
}

function toPositionFromGeocodePayload(payload: unknown): Position | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const response = payload as GeocodeApiResponse;
  if (!response.success || !response.data) {
    return null;
  }

  const latitude = Number(response.data.latitude);
  const longitude = Number(response.data.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  return [latitude, longitude];
}

function roundCoordinate(value: number): string {
  return value.toFixed(6);
}

function buildRoutePathKey(positions: readonly Position[]): string {
  return positions
    .map((position) => `${roundCoordinate(position[0])},${roundCoordinate(position[1])}`)
    .join("|");
}

function toRouteCoordinateParam(positions: readonly Position[]): string {
  return positions
    .map((position) => `${roundCoordinate(position[1])},${roundCoordinate(position[0])}`)
    .join(";");
}

function toPositionsFromRoutePayload(payload: unknown): readonly Position[] | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const response = payload as RoutePathApiResponse;
  const rawPositions = response.data?.positions;
  if (!response.success || !Array.isArray(rawPositions) || rawPositions.length < 2) {
    return null;
  }

  const parsedPositions: Position[] = [];

  for (const entry of rawPositions) {
    if (!Array.isArray(entry) || entry.length < 2) {
      continue;
    }

    const latitude = Number(entry[0]);
    const longitude = Number(entry[1]);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      continue;
    }

    parsedPositions.push([latitude, longitude]);
  }

  return parsedPositions.length >= 2 ? parsedPositions : null;
}

async function geocodeDestination(destination: string): Promise<Position | null> {
  const key = getDestinationKey(destination);
  if (!key) {
    return null;
  }

  const knownPosition = resolveKnownDestination(destination);
  if (knownPosition) {
    geocodedDestinationCache.set(key, knownPosition);
    return knownPosition;
  }

  const cached = geocodedDestinationCache.get(key);
  if (cached !== undefined) {
    return cached;
  }

  const pendingRequest = geocodedDestinationRequests.get(key);
  if (pendingRequest) {
    return pendingRequest;
  }

  const request = (async () => {
    try {
      const response = await fetch(`/api/geocode?destination=${encodeURIComponent(destination)}`, {
        method: "GET",
      });

      if (!response.ok) {
        geocodedDestinationCache.set(key, null);
        return null;
      }

      const payload = (await response.json()) as unknown;
      const position = toPositionFromGeocodePayload(payload);
      geocodedDestinationCache.set(key, position);
      return position;
    } catch {
      geocodedDestinationCache.set(key, null);
      return null;
    } finally {
      geocodedDestinationRequests.delete(key);
    }
  })();

  geocodedDestinationRequests.set(key, request);
  return request;
}

async function resolveRoutePath(positions: readonly Position[]): Promise<readonly Position[] | null> {
  if (positions.length < 2) {
    return null;
  }

  const key = buildRoutePathKey(positions);
  const cached = routePathCache.get(key);
  if (cached !== undefined) {
    return cached;
  }

  const pendingRequest = routePathRequests.get(key);
  if (pendingRequest) {
    return pendingRequest;
  }

  const request = (async () => {
    try {
      const coordinates = toRouteCoordinateParam(positions);
      const response = await fetch(`/api/route-path?coordinates=${encodeURIComponent(coordinates)}`, {
        method: "GET",
      });

      if (!response.ok) {
        routePathCache.set(key, null);
        return null;
      }

      const payload = (await response.json()) as unknown;
      const parsedPath = toPositionsFromRoutePayload(payload);
      routePathCache.set(key, parsedPath);
      return parsedPath;
    } catch {
      routePathCache.set(key, null);
      return null;
    } finally {
      routePathRequests.delete(key);
    }
  })();

  routePathRequests.set(key, request);
  return request;
}

function MapBoundsController({
  positions,
}: Readonly<{ positions: readonly Position[] }>) {
  const map = useMap();

  useEffect(() => {
    if (positions.length === 0) {
      return;
    }

    if (positions.length === 1) {
      map.setView(positions[0], FOCUSED_STOP_ZOOM);
      return;
    }

    map.fitBounds(latLngBounds(positions.map((position) => [position[0], position[1]])), {
      padding: [16, 16],
    });
  }, [map, positions]);

  return null;
}

function ActiveStopController({
  activeStopId,
  resolvedStops,
  markerRefs,
}: Readonly<{
  activeStopId: string | null;
  resolvedStops: readonly ResolvedStop[];
  markerRefs: MutableRefObject<Map<string, LeafletCircleMarker>>;
}>) {
  const map = useMap();

  useEffect(() => {
    if (!activeStopId) {
      return;
    }

    const activeStop = resolvedStops.find((stop) => stop.id === activeStopId);
    if (!activeStop) {
      return;
    }

    map.flyTo(activeStop.position, Math.max(map.getZoom(), FOCUSED_STOP_ZOOM), {
      animate: true,
      duration: 0.8,
    });

    const marker = markerRefs.current.get(activeStop.id);
    if (marker) {
      marker.openPopup();
    }
  }, [activeStopId, map, markerRefs, resolvedStops]);

  return null;
}

export function MapView({
  stops,
  emptyMessage = "No mapped coordinates yet. Add destination names with city/municipality details.",
  heightClassName = "h-[260px]",
  activeStopId = null,
  onStopSelect,
}: MapViewProps) {
  const markerRefs = useRef<Map<string, LeafletCircleMarker>>(new Map());
  const [resolvedPositionByDestinationKey, setResolvedPositionByDestinationKey] = useState<
    Readonly<Record<string, Position | null>>
  >({});
  const [resolvedRoutePathByKey, setResolvedRoutePathByKey] = useState<
    Readonly<Record<string, readonly Position[] | null>>
  >({});

  useEffect(() => {
    let isCancelled = false;

    const uniqueDestinations = Array.from(new Set(stops.map((stop) => stop.destination)));
    const destinationsNeedingGeocoding: string[] = [];

    for (const destination of uniqueDestinations) {
      const key = getDestinationKey(destination);
      if (!key) {
        continue;
      }

      const knownPosition = resolveKnownDestination(destination);
      if (knownPosition) {
        continue;
      }

      const cachedPosition = geocodedDestinationCache.get(key);
      if (cachedPosition !== undefined) {
        continue;
      }

      destinationsNeedingGeocoding.push(destination);
    }

    if (destinationsNeedingGeocoding.length === 0) {
      return;
    }

    void (async () => {
      const entries = await Promise.all(
        destinationsNeedingGeocoding.map(async (destination) => {
          const key = getDestinationKey(destination);
          if (!key) {
            return null;
          }

          const position = await geocodeDestination(destination);
          return [key, position] as const;
        }),
      );

      if (isCancelled) {
        return;
      }

      setResolvedPositionByDestinationKey((previous) => {
        let hasChanges = false;
        const nextState: Record<string, Position | null> = { ...previous };

        for (const entry of entries) {
          if (!entry) {
            continue;
          }

          const [key, position] = entry;
          if (!positionsMatch(previous[key], position)) {
            nextState[key] = position;
            hasChanges = true;
          }
        }

        return hasChanges ? nextState : previous;
      });
    })();

    return () => {
      isCancelled = true;
    };
  }, [stops]);

  const resolvedStops = useMemo<readonly ResolvedStop[]>(
    () =>
      stops.flatMap((stop) => {
        const key = getDestinationKey(stop.destination);
        if (!key) {
          return [];
        }

        const position =
          resolvedPositionByDestinationKey[key] ??
          resolveKnownDestination(stop.destination) ??
          geocodedDestinationCache.get(key) ??
          null;

        if (!position) {
          return [];
        }
        return [{ ...stop, position }];
      }),
    [resolvedPositionByDestinationKey, stops],
  );
  const positions = useMemo<readonly Position[]>(
    () => resolvedStops.map((stop) => stop.position),
    [resolvedStops],
  );
  const hasPendingGeocoding = useMemo(
    () =>
      stops.some((stop) => {
        const key = getDestinationKey(stop.destination);
        if (!key) {
          return false;
        }

        if (resolveKnownDestination(stop.destination)) {
          return false;
        }

        return geocodedDestinationCache.get(key) === undefined;
      }),
    [stops],
  );
  const routePathKey = useMemo(
    () => (positions.length > 1 ? buildRoutePathKey(positions) : ""),
    [positions],
  );

  useEffect(() => {
    let isCancelled = false;

    if (positions.length < 2) {
      return;
    }

    const key = buildRoutePathKey(positions);
    if (routePathCache.get(key) !== undefined) {
      return;
    }

    void (async () => {
      const path = await resolveRoutePath(positions);

      if (isCancelled) {
        return;
      }

      setResolvedRoutePathByKey((previous) => {
        if (Object.is(previous[key], path)) {
          return previous;
        }

        return {
          ...previous,
          [key]: path,
        };
      });
    })();

    return () => {
      isCancelled = true;
    };
  }, [positions]);

  const roadPathPositions = useMemo<readonly Position[] | null>(() => {
    if (!routePathKey) {
      return null;
    }

    return (
      resolvedRoutePathByKey[routePathKey] ??
      routePathCache.get(routePathKey) ??
      null
    );
  }, [resolvedRoutePathByKey, routePathKey]);

  if (stops.length === 0) {
    return (
      <div className="rounded-xl border border-[#dfe1ed] bg-[#fafbfe] px-3 py-2 text-xs text-[#7d8598]">
        {emptyMessage}
      </div>
    );
  }

  if (resolvedStops.length === 0) {
    return (
      <div className="rounded-xl border border-[#dfe1ed] bg-[#fafbfe] px-3 py-2 text-xs text-[#7d8598]">
        {hasPendingGeocoding
          ? "Mapping destinations..."
          : "Unable to map these destinations yet. Use city/municipality + province details for better accuracy."}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#dfe1ed] bg-white p-2">
      <div className={`${heightClassName} w-full overflow-hidden rounded-lg border border-[#dfe1ed]`}>
        <MapContainer
          center={DEFAULT_CENTER}
          zoom={DEFAULT_ZOOM}
          scrollWheelZoom={false}
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapBoundsController positions={positions} />
          <ActiveStopController
            activeStopId={activeStopId}
            resolvedStops={resolvedStops}
            markerRefs={markerRefs}
          />

          {positions.length > 1 ? (
            <Polyline
              positions={(roadPathPositions ?? positions) as [number, number][]}
              pathOptions={{ color: "#5a84cd", weight: 3 }}
            />
          ) : null}

          {resolvedStops.map((stop, index) => {
            const isActive = stop.id === activeStopId;
            return (
              <CircleMarker
                key={stop.id}
                ref={(marker) => {
                  if (marker) {
                    markerRefs.current.set(stop.id, marker);
                    return;
                  }
                  markerRefs.current.delete(stop.id);
                }}
                center={stop.position as [number, number]}
                radius={isActive ? 9 : 7}
                eventHandlers={{
                  click: () => onStopSelect?.(stop.id),
                  popupopen: () => onStopSelect?.(stop.id),
                }}
                pathOptions={{
                  color: isActive ? "#1f5fc8" : index === 0 ? "#2f6fd5" : "#5b8ad8",
                  fillColor: isActive ? "#1f5fc8" : index === 0 ? "#2f6fd5" : "#7aa0e2",
                  fillOpacity: isActive ? 1 : 0.95,
                  weight: isActive ? 3 : 2,
                }}
              >
                <Popup>
                  <p className="text-xs font-semibold text-[#2f3339]">{stop.label}</p>
                  <p className="mt-1 text-xs text-[#4a5266]">
                    <span className="font-semibold">Place:</span> {stop.destination || "-"}
                  </p>
                  <p className="mt-1 text-xs text-[#4a5266]">
                    <span className="font-semibold">Date:</span>{" "}
                    {formatDateRange(stop.departureDate, stop.returnDate)}
                  </p>
                  <p className="mt-1 text-xs text-[#4a5266]">
                    <span className="font-semibold">Purpose:</span> {stop.purpose || "-"}
                  </p>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}
