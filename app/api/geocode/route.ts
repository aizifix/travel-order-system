import { NextRequest, NextResponse } from "next/server";
import type { Geometry } from "geojson";

type Position = [number, number];
type GeocodeResolution = Readonly<{
  position: Position | null;
  boundaryGeojson?: Geometry | null;
}>;

type GeocodeCacheEntry = Readonly<{
  value: GeocodeResolution;
  timestamp: number;
}>;

type NominatimResult = Readonly<{
  lat?: string;
  lon?: string;
  geojson?: unknown;
}>;

const GEOCODE_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const NOMINATIM_SEARCH_URL = "https://nominatim.openstreetmap.org/search";
const NOMINATIM_USER_AGENT =
  process.env.GEOCODER_USER_AGENT?.trim() ||
  "TravelOrderSystem/1.0 (https://localhost)";

const geocodeCache = new Map<string, GeocodeCacheEntry>();

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function normalizeQuery(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function splitDestination(destination: string): readonly string[] {
  return destination
    .split(",")
    .map((part) => normalizeQuery(part))
    .filter((part) => part.length > 0);
}

function isRegionLabel(value: string): boolean {
  const normalized = normalizeText(value);
  return (
    normalized.startsWith("region ") ||
    normalized.includes(" region") ||
    normalized.includes("ncr") ||
    normalized.includes("caraga") ||
    normalized.includes("calabarzon") ||
    normalized.includes("mimaropa") ||
    normalized.includes("soccsksargen") ||
    normalized.includes("barmm")
  );
}

function withCountrySuffix(value: string): string {
  return /philippines/i.test(value) ? value : `${value}, Philippines`;
}

function buildQueryCandidates(destination: string): readonly string[] {
  const trimmedDestination = normalizeQuery(destination);
  if (!trimmedDestination) {
    return [];
  }

  const parts = splitDestination(trimmedDestination);
  const seen = new Set<string>();
  const candidates: string[] = [];

  const addCandidate = (candidate: string | null) => {
    if (!candidate) {
      return;
    }

    const normalizedCandidate = normalizeQuery(candidate);
    if (!normalizedCandidate) {
      return;
    }

    const dedupeKey = normalizeText(normalizedCandidate);
    if (seen.has(dedupeKey)) {
      return;
    }

    seen.add(dedupeKey);
    candidates.push(withCountrySuffix(normalizedCandidate));
  };

  const cityOrMunicipality =
    parts.find((part) => /\b(city|municipality|municipal|mun\.?)\b/i.test(part)) ||
    (parts.length >= 3 ? parts[1] : parts[0] ?? null);

  const cityIndex = cityOrMunicipality
    ? parts.findIndex((part) => part === cityOrMunicipality)
    : -1;

  let province: string | null = null;

  if (cityIndex >= 0) {
    province =
      parts.slice(cityIndex + 1).find((part) => !isRegionLabel(part)) || null;
  }

  if (!province) {
    province =
      parts.find(
        (part, index) =>
          index > 0 &&
          part !== cityOrMunicipality &&
          !isRegionLabel(part) &&
          !/^\s*(barangay|brgy)\b/i.test(part),
      ) || null;
  }

  addCandidate(trimmedDestination);
  addCandidate(
    cityOrMunicipality && province
      ? `${cityOrMunicipality}, ${province}`
      : cityOrMunicipality,
  );
  addCandidate(cityOrMunicipality);
  addCandidate(
    parts.length >= 2
      ? `${parts[0]}, ${parts[1]}`
      : null,
  );
  addCandidate(province);

  return candidates;
}

function getCachedPosition(key: string): Position | null | undefined {
  const cached = geocodeCache.get(key);
  if (!cached) {
    return undefined;
  }

  if (Date.now() - cached.timestamp > GEOCODE_CACHE_TTL_MS) {
    geocodeCache.delete(key);
    return undefined;
  }

  return cached.value.position;
}

function getCachedBoundary(key: string): Geometry | null | undefined {
  const cached = geocodeCache.get(key);
  if (!cached) {
    return undefined;
  }

  if (Date.now() - cached.timestamp > GEOCODE_CACHE_TTL_MS) {
    geocodeCache.delete(key);
    return undefined;
  }

  return cached.value.boundaryGeojson;
}

function setCachedResolution(key: string, resolution: GeocodeResolution): void {
  geocodeCache.set(key, {
    value: resolution,
    timestamp: Date.now(),
  });
}

function parseCoordinate(rawValue: string | undefined): number | null {
  if (typeof rawValue !== "string" || rawValue.trim().length === 0) {
    return null;
  }

  const parsed = Number(rawValue);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  return parsed;
}

function isCoordinatePair(value: unknown): value is readonly [number, number] {
  return (
    Array.isArray(value) &&
    value.length >= 2 &&
    Number.isFinite(value[0]) &&
    Number.isFinite(value[1])
  );
}

function isPolygonCoordinates(value: unknown): value is number[][][] {
  return (
    Array.isArray(value) &&
    value.every(
      (ring) => Array.isArray(ring) && ring.length > 0 && ring.every((point) => isCoordinatePair(point)),
    )
  );
}

function isMultiPolygonCoordinates(value: unknown): value is number[][][][] {
  return (
    Array.isArray(value) &&
    value.every((polygon) => isPolygonCoordinates(polygon))
  );
}

function parseBoundaryGeojson(value: unknown): Geometry | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as { type?: unknown; coordinates?: unknown };
  if (candidate.type === "Polygon" && isPolygonCoordinates(candidate.coordinates)) {
    return {
      type: "Polygon",
      coordinates: candidate.coordinates,
    };
  }

  if (candidate.type === "MultiPolygon" && isMultiPolygonCoordinates(candidate.coordinates)) {
    return {
      type: "MultiPolygon",
      coordinates: candidate.coordinates,
    };
  }

  return null;
}

async function geocodeSingleCandidate(
  candidate: string,
  includeBoundary: boolean,
): Promise<GeocodeResolution | null> {
  const searchParams = new URLSearchParams({
    q: candidate,
    format: "jsonv2",
    limit: includeBoundary ? "5" : "1",
    countrycodes: "ph",
    addressdetails: "0",
    polygon_geojson: includeBoundary ? "1" : "0",
  });

  const response = await fetch(`${NOMINATIM_SEARCH_URL}?${searchParams.toString()}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "User-Agent": NOMINATIM_USER_AGENT,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Geocoder request failed (${response.status})`);
  }

  const payload = (await response.json()) as unknown;
  if (!Array.isArray(payload) || payload.length === 0) {
    return null;
  }

  let fallbackPosition: Position | null = null;

  for (const item of payload) {
    const result = item as NominatimResult;
    const latitude = parseCoordinate(result.lat);
    const longitude = parseCoordinate(result.lon);
    if (latitude === null || longitude === null) {
      continue;
    }

    if (!fallbackPosition) {
      fallbackPosition = [latitude, longitude];
    }

    if (!includeBoundary) {
      return {
        position: [latitude, longitude],
        boundaryGeojson: undefined,
      };
    }

    const boundaryGeojson = parseBoundaryGeojson(result.geojson);
    if (boundaryGeojson) {
      return {
        position: [latitude, longitude],
        boundaryGeojson,
      };
    }
  }

  if (!fallbackPosition) {
    return null;
  }

  return {
    position: fallbackPosition,
    boundaryGeojson: includeBoundary ? null : undefined,
  };
}

async function geocodeDestination(
  destination: string,
  includeBoundary: boolean,
): Promise<GeocodeResolution> {
  const queryCandidates = buildQueryCandidates(destination);
  for (const candidate of queryCandidates) {
    const resolution = await geocodeSingleCandidate(candidate, includeBoundary);
    if (resolution) {
      return resolution;
    }
  }

  return {
    position: null,
    boundaryGeojson: includeBoundary ? null : undefined,
  };
}

export async function GET(request: NextRequest) {
  const destination = normalizeQuery(
    request.nextUrl.searchParams.get("destination") || "",
  );
  const includeBoundary =
    request.nextUrl.searchParams.get("includeBoundary") === "1";
  if (!destination) {
    return NextResponse.json(
      { success: false, error: "Missing required parameter: destination" },
      { status: 400 },
    );
  }

  const cacheKey = normalizeText(destination);
  const cachedPosition = getCachedPosition(cacheKey);
  const cachedBoundary = includeBoundary ? getCachedBoundary(cacheKey) : undefined;
  const hasCachedBoundary = !includeBoundary || cachedBoundary !== undefined;
  if (cachedPosition !== undefined && hasCachedBoundary) {
    return NextResponse.json({
      success: true,
      data: cachedPosition
        ? {
            latitude: cachedPosition[0],
            longitude: cachedPosition[1],
            boundaryGeojson: includeBoundary ? (cachedBoundary ?? null) : null,
          }
        : null,
      cached: true,
    });
  }

  try {
    const resolution = await geocodeDestination(destination, includeBoundary);
    setCachedResolution(cacheKey, resolution);

    return NextResponse.json({
      success: true,
      data: resolution.position
        ? {
            latitude: resolution.position[0],
            longitude: resolution.position[1],
            boundaryGeojson: includeBoundary ? resolution.boundaryGeojson : null,
          }
        : null,
      cached: false,
    });
  } catch (error) {
    console.error("Geocode API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to geocode destination",
      },
      { status: 502 },
    );
  }
}
