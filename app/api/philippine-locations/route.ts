import { NextRequest, NextResponse } from "next/server";

type RawLocation = Record<string, unknown>;

const PRIMARY_BASE_URL = process.env.PH_LOCATIONS_PRIMARY_BASE_URL?.trim() || "https://psgc.cloud/api";
const FALLBACK_BASE_URL = process.env.PH_LOCATIONS_FALLBACK_BASE_URL?.trim() || "https://psgc.gitlab.io/api";
const STATIC_REGIONS = [
  { code: "0100000000", name: "Region I (Ilocos Region)" },
  { code: "0200000000", name: "Region II (Cagayan Valley)" },
  { code: "0300000000", name: "Region III (Central Luzon)" },
  { code: "0400000000", name: "Region IV-A (CALABARZON)" },
  { code: "1700000000", name: "MIMAROPA Region" },
  { code: "0500000000", name: "Region V (Bicol Region)" },
  { code: "0600000000", name: "Region VI (Western Visayas)" },
  { code: "0700000000", name: "Region VII (Central Visayas)" },
  { code: "0800000000", name: "Region VIII (Eastern Visayas)" },
  { code: "0900000000", name: "Region IX (Zamboanga Peninsula)" },
  { code: "1000000000", name: "Region X (Northern Mindanao)" },
  { code: "1100000000", name: "Region XI (Davao Region)" },
  { code: "1200000000", name: "Region XII (SOCCSKSARGEN)" },
  { code: "1300000000", name: "National Capital Region (NCR)" },
  { code: "1400000000", name: "Cordillera Administrative Region (CAR)" },
  { code: "1600000000", name: "Region XIII (Caraga)" },
  { code: "1900000000", name: "Bangsamoro Autonomous Region In Muslim Mindanao (BARMM)" },
] as const;

// In-memory cache with simple TTL.
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL_MS = 60 * 60 * 1000;

function getCached<T>(key: string): T | null {
  const cached = cache.get(key);
  if (!cached) {
    return null;
  }

  const isExpired = Date.now() - cached.timestamp > CACHE_TTL_MS;
  if (isExpired) {
    cache.delete(key);
    return null;
  }

  return cached.data as T;
}

function setCached<T>(key: string, data: T): void {
  cache.set(key, {
    data,
    timestamp: Date.now(),
  });
}

function fallbackRegionsResponse(reason?: unknown) {
  if (reason) {
    console.warn(
      "Philippine locations API warning: regions providers unavailable, using static fallback.",
      getErrorMessage(reason),
    );
  }

  return NextResponse.json({
    success: true,
    data: STATIC_REGIONS,
  });
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error";
}

function asString(value: unknown): string {
  if (typeof value === "string") {
    return value.trim();
  }
  if (typeof value === "number") {
    return String(value);
  }
  return "";
}

function toPsgc10(code: unknown): string {
  const rawValue = asString(code);
  const digitsOnly = rawValue.replace(/\D/g, "");
  if (digitsOnly.length === 9) {
    return `${digitsOnly.slice(0, 2)}0${digitsOnly.slice(2)}`;
  }
  if (digitsOnly.length === 10) {
    return digitsOnly;
  }
  return rawValue;
}

function toPsgc9(code: string): string {
  const digitsOnly = code.replace(/\D/g, "");
  if (digitsOnly.length === 10) {
    return `${digitsOnly.slice(0, 2)}${digitsOnly.slice(3)}`;
  }
  if (digitsOnly.length === 9) {
    return digitsOnly;
  }
  return code;
}

function regionCodeFromProvinceCode(provinceCode: string): string {
  const digitsOnly = provinceCode.replace(/\D/g, "");
  if (digitsOnly.length !== 10) {
    return "";
  }
  return `${digitsOnly.slice(0, 2)}00000000`;
}

function provinceCodeFromCityMunicipalityCode(cityMunicipalityCode: string): string {
  const digitsOnly = cityMunicipalityCode.replace(/\D/g, "");
  if (digitsOnly.length !== 10) {
    return "";
  }
  return `${digitsOnly.slice(0, 5)}00000`;
}

function normalizedCode(item: RawLocation): string {
  return toPsgc10(item.psgc10DigitCode ?? item.psgc_code ?? item.psgcCode ?? item.code ?? "");
}

function isRawLocationArray(value: unknown): value is RawLocation[] {
  return (
    Array.isArray(value) &&
    value.every((item) => typeof item === "object" && item !== null && !Array.isArray(item))
  );
}

async function fetchFromSource<T>(
  source: "primary" | "fallback",
  endpoint: string,
): Promise<T> {
  const baseUrl = source === "primary" ? PRIMARY_BASE_URL : FALLBACK_BASE_URL;
  const cacheKey = `${source}:${endpoint}`;
  const cached = getCached<T>(cacheKey);
  if (cached) {
    return cached;
  }

  const url = `${baseUrl}${endpoint}`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`${source} provider request failed (${response.status}) for ${endpoint}`);
  }

  const data = (await response.json()) as T;
  setCached(cacheKey, data);

  return data;
}

async function fetchLocationArrayFromSource(
  source: "primary" | "fallback",
  endpoint: string,
): Promise<RawLocation[]> {
  const cacheKey = `${source}:${endpoint}`;
  const data = await fetchFromSource<unknown>(source, endpoint);
  if (!isRawLocationArray(data)) {
    cache.delete(cacheKey);
    throw new Error(`${source} provider returned non-array payload for ${endpoint}`);
  }
  return data;
}

async function fetchLocationArrayWithFallback(
  primaryEndpoint: string,
  fallbackEndpoint: string,
): Promise<RawLocation[]> {
  try {
    return await fetchLocationArrayFromSource("primary", primaryEndpoint);
  } catch (primaryError) {
    try {
      return await fetchLocationArrayFromSource("fallback", fallbackEndpoint);
    } catch (fallbackError) {
      throw new Error(
        `All location providers failed. Primary: ${getErrorMessage(primaryError)}; Fallback: ${getErrorMessage(fallbackError)}`,
      );
    }
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get("action");

  try {
    switch (action) {
      case "regions": {
        try {
          const data = await fetchLocationArrayWithFallback("/regions/", "/regions/");
          const regions = data
            .map((item) => ({
              code: normalizedCode(item),
              name: asString(item.name),
            }))
            .filter((item) => item.code && item.name);

          if (regions.length === 0) {
            return fallbackRegionsResponse(new Error("Empty regions payload."));
          }

          return NextResponse.json({
            success: true,
            data: regions,
          });
        } catch (error) {
          return fallbackRegionsResponse(error);
        }
      }

      case "provinces": {
        const regionCode = toPsgc10(searchParams.get("regionCode"));
        const primaryEndpoint = regionCode ? `/regions/${regionCode}/provinces/` : "/provinces/";
        const fallbackEndpoint = regionCode
          ? `/regions/${toPsgc9(regionCode)}/provinces/`
          : "/provinces/";

        const data = await fetchLocationArrayWithFallback(primaryEndpoint, fallbackEndpoint);
        const provinces = data
          .map((item) => {
            const code = normalizedCode(item);
            const sourceRegionCode = toPsgc10(
              item.region_psgc_code ?? item.regionCode ?? item.region_code ?? "",
            );
            return {
              code,
              name: asString(item.name),
              regionCode: sourceRegionCode || regionCode || regionCodeFromProvinceCode(code),
            };
          })
          .filter((item) => item.code && item.name);

        const filteredProvinces = regionCode
          ? provinces.filter((p) => p.regionCode === regionCode)
          : provinces;

        return NextResponse.json({
          success: true,
          data: filteredProvinces,
        });
      }

      case "cities-municipalities": {
        const provinceCode = toPsgc10(searchParams.get("provinceCode"));
        const primaryEndpoint = provinceCode
          ? `/provinces/${provinceCode}/cities-municipalities/`
          : "/cities-municipalities/";
        const fallbackEndpoint = provinceCode
          ? `/provinces/${toPsgc9(provinceCode)}/cities-municipalities/`
          : "/cities-municipalities/";

        const data = await fetchLocationArrayWithFallback(primaryEndpoint, fallbackEndpoint);
        const citiesMunicipalities = data
          .map((item) => {
            const code = normalizedCode(item);
            const sourceProvinceCode = toPsgc10(
              item.province_psgc_code ?? item.provinceCode ?? item.province_code ?? "",
            );
            const type = asString(item.type).toLowerCase();
            const explicitIsCity = typeof item.isCity === "boolean" ? item.isCity : null;
            const isCity = explicitIsCity ?? (type ? !type.startsWith("mun") : true);

            return {
              code,
              name: asString(item.name),
              provinceCode:
                sourceProvinceCode || provinceCode || provinceCodeFromCityMunicipalityCode(code),
              isCity,
            };
          })
          .filter((item) => item.code && item.name);

        const filteredCitiesMunicipalities = provinceCode
          ? citiesMunicipalities.filter((c) => c.provinceCode === provinceCode)
          : citiesMunicipalities;

        return NextResponse.json({
          success: true,
          data: filteredCitiesMunicipalities,
        });
      }

      case "barangays": {
        const cityMunicipalityCode = toPsgc10(searchParams.get("cityMunicipalityCode"));
        if (!cityMunicipalityCode) {
          return NextResponse.json(
            { success: false, error: "Missing required parameter: cityMunicipalityCode" },
            { status: 400 },
          );
        }

        const primaryEndpoint = `/cities-municipalities/${cityMunicipalityCode}/barangays/`;
        const fallbackEndpoint = `/cities-municipalities/${toPsgc9(cityMunicipalityCode)}/barangays/`;

        const data = await fetchLocationArrayWithFallback(primaryEndpoint, fallbackEndpoint);
        const barangays = data
          .map((item) => {
            const sourceCityMunicipalityCode = toPsgc10(
              item.city_municipality_psgc_code ??
                item.cityMunicipalityCode ??
                item.city_municipality_code ??
                item.municipalityCode ??
                item.cityCode ??
                "",
            );
            return {
              code: normalizedCode(item),
              name: asString(item.name),
              cityMunicipalityCode: sourceCityMunicipalityCode || cityMunicipalityCode,
            };
          })
          .filter((item) => item.code && item.name);

        const filteredBarangays = barangays.filter(
          (b) => b.cityMunicipalityCode === cityMunicipalityCode,
        );

        return NextResponse.json({
          success: true,
          data: filteredBarangays,
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: "Invalid action. Use: regions, provinces, cities-municipalities, or barangays" },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error("Philippine locations API error:", error);
    if (action === "regions") {
      return fallbackRegionsResponse(error);
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch location data",
      },
      { status: 500 },
    );
  }
}
