import { NextRequest, NextResponse } from "next/server";

type Position = [number, number];

type RouteCacheEntry = Readonly<{
  positions: readonly Position[] | null;
  timestamp: number;
}>;

type OsrmRouteGeometry = Readonly<{
  coordinates?: readonly (readonly [number, number])[];
}>;

type OsrmRoute = Readonly<{
  geometry?: OsrmRouteGeometry;
}>;

type OsrmResponse = Readonly<{
  code?: string;
  routes?: readonly OsrmRoute[];
}>;

const OSRM_ROUTE_SERVICE_URL =
  process.env.ROUTE_SERVICE_BASE_URL?.trim() || "https://router.project-osrm.org";
const ROUTE_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const MAX_WAYPOINTS = 12;

const routeCache = new Map<string, RouteCacheEntry>();

function normalizeCoordinateText(value: string): string {
  return value.trim().replace(/\s+/g, "");
}

function parseCoordinatePair(value: string): [number, number] | null {
  const [longitudeRaw, latitudeRaw] = value.split(",");
  const longitude = Number(longitudeRaw);
  const latitude = Number(latitudeRaw);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  return [longitude, latitude];
}

function parseCoordinatesParam(
  coordinatesParam: string,
): readonly [number, number][] | null {
  const parts = coordinatesParam
    .split(";")
    .map((part) => normalizeCoordinateText(part))
    .filter((part) => part.length > 0);

  if (parts.length < 2 || parts.length > MAX_WAYPOINTS) {
    return null;
  }

  const parsed: [number, number][] = [];
  for (const part of parts) {
    const pair = parseCoordinatePair(part);
    if (!pair) {
      return null;
    }
    parsed.push(pair);
  }

  return parsed;
}

function toCacheKey(coordinates: readonly [number, number][]): string {
  return coordinates
    .map(([longitude, latitude]) => `${longitude.toFixed(6)},${latitude.toFixed(6)}`)
    .join(";");
}

function getCachedRoute(key: string): readonly Position[] | null | undefined {
  const cached = routeCache.get(key);
  if (!cached) {
    return undefined;
  }

  if (Date.now() - cached.timestamp > ROUTE_CACHE_TTL_MS) {
    routeCache.delete(key);
    return undefined;
  }

  return cached.positions;
}

function setCachedRoute(key: string, positions: readonly Position[] | null): void {
  routeCache.set(key, {
    positions,
    timestamp: Date.now(),
  });
}

function toLatLngPositions(
  coordinates: readonly (readonly [number, number])[],
): readonly Position[] {
  const positions: Position[] = [];

  for (const coordinate of coordinates) {
    const longitude = Number(coordinate[0]);
    const latitude = Number(coordinate[1]);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      continue;
    }

    const nextPosition: Position = [latitude, longitude];
    const previousPosition = positions[positions.length - 1];

    if (
      previousPosition &&
      previousPosition[0] === nextPosition[0] &&
      previousPosition[1] === nextPosition[1]
    ) {
      continue;
    }

    positions.push(nextPosition);
  }

  return positions;
}

function parseRouteResponse(payload: unknown): readonly Position[] | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const response = payload as OsrmResponse;
  if (response.code !== "Ok" || !Array.isArray(response.routes)) {
    return null;
  }

  const coordinates = response.routes[0]?.geometry?.coordinates;
  if (!Array.isArray(coordinates) || coordinates.length < 2) {
    return null;
  }

  const positions = toLatLngPositions(coordinates);
  return positions.length >= 2 ? positions : null;
}

async function fetchRoutePath(
  coordinates: readonly [number, number][],
): Promise<readonly Position[] | null> {
  const coordinatePath = coordinates
    .map(([longitude, latitude]) => `${longitude},${latitude}`)
    .join(";");

  const url = `${OSRM_ROUTE_SERVICE_URL}/route/v1/driving/${coordinatePath}?overview=full&geometries=geojson&steps=false`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Routing provider request failed (${response.status})`);
  }

  const payload = (await response.json()) as unknown;
  return parseRouteResponse(payload);
}

export async function GET(request: NextRequest) {
  const coordinatesParam = request.nextUrl.searchParams.get("coordinates") || "";
  const parsedCoordinates = parseCoordinatesParam(coordinatesParam);
  if (!parsedCoordinates) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Invalid coordinates parameter. Provide semicolon-separated lon,lat pairs.",
      },
      { status: 400 },
    );
  }

  const cacheKey = toCacheKey(parsedCoordinates);
  const cachedRoute = getCachedRoute(cacheKey);
  if (cachedRoute !== undefined) {
    return NextResponse.json({
      success: true,
      data: cachedRoute ? { positions: cachedRoute } : null,
      cached: true,
    });
  }

  try {
    const positions = await fetchRoutePath(parsedCoordinates);
    setCachedRoute(cacheKey, positions);

    return NextResponse.json({
      success: true,
      data: positions ? { positions } : null,
      cached: false,
    });
  } catch (error) {
    console.error("Route path API error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch route path",
      },
      { status: 502 },
    );
  }
}
