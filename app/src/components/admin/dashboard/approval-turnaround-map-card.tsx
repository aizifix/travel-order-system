"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { HelpCircle } from "lucide-react";
import type { ApprovalDestinationPoint } from "@/src/components/admin/dashboard/approval-turnaround-map-canvas";

type DestinationStat = Readonly<{
  label: string;
  value: number;
}>;

type ApprovalTurnaroundMapCardProps = Readonly<{
  destinations: readonly DestinationStat[];
}>;

type KnownCoordinate = Readonly<{
  keys: readonly string[];
  position: readonly [number, number];
}>;

type Position = readonly [number, number];

type GeocodeApiResponse = Readonly<{
  success: boolean;
  data?: Readonly<{
    latitude: number;
    longitude: number;
  }> | null;
}>;

const KNOWN_COORDINATES: readonly KnownCoordinate[] = [
  { keys: ["cagayan de oro", "cdo"], position: [8.4542, 124.6319] },
  { keys: ["iligan"], position: [8.228, 124.2452] },
  { keys: ["misamis oriental"], position: [8.5046, 124.6219] },
  { keys: ["misamis occidental"], position: [8.3375, 123.7071] },
  { keys: ["bukidnon", "malaybalay", "valencia city"], position: [8.1575, 125.1278] },
  { keys: ["camiguin"], position: [9.1732, 124.7299] },
  { keys: ["davao city"], position: [7.1907, 125.4553] },
  { keys: ["cebu city"], position: [10.3157, 123.8854] },
  { keys: ["iloilo city"], position: [10.7202, 122.5621] },
  { keys: ["quezon city", "manila", "metro manila"], position: [14.5995, 120.9842] },
  { keys: ["zamboanga"], position: [6.9214, 122.079] },
];

const geocodedDestinationCache = new Map<string, Position | null>();
const geocodedDestinationRequests = new Map<string, Promise<Position | null>>();

const ApprovalTurnaroundMapCanvas = dynamic(
  () =>
    import("@/src/components/admin/dashboard/approval-turnaround-map-canvas").then((module) => ({
      default: module.ApprovalTurnaroundMapCanvas,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="h-[320px] rounded-lg border border-[#dfe1ed] bg-[#f8fafd] px-3 py-2 text-xs text-[#7d8598]">
        Loading Philippines map...
      </div>
    ),
  },
);

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getDestinationKey(label: string): string {
  return normalizeText(label);
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

async function geocodeDestination(label: string): Promise<Position | null> {
  const key = getDestinationKey(label);
  if (!key) {
    return null;
  }

  const cached = geocodedDestinationCache.get(key);
  if (cached !== undefined) {
    return cached;
  }

  const existingRequest = geocodedDestinationRequests.get(key);
  if (existingRequest) {
    return existingRequest;
  }

  const request = (async () => {
    try {
      const response = await fetch(`/api/geocode?destination=${encodeURIComponent(label)}`, {
        cache: "no-store",
      });
      if (!response.ok) {
        geocodedDestinationCache.set(key, null);
        return null;
      }

      const payload = (await response.json()) as unknown;
      const position = toPositionFromGeocodePayload(payload);
      geocodedDestinationCache.set(key, position);
      return position;
    } catch (error) {
      console.error("ApprovalTurnaroundMap geocode failed", error);
      geocodedDestinationCache.set(key, null);
      return null;
    } finally {
      geocodedDestinationRequests.delete(key);
    }
  })();

  geocodedDestinationRequests.set(key, request);
  return request;
}

function resolveKnownDestinationPosition(label: string): Position | null {
  const normalized = normalizeText(label);
  if (!normalized) {
    return null;
  }

  for (const entry of KNOWN_COORDINATES) {
    if (entry.keys.some((key) => normalized.includes(key))) {
      return entry.position;
    }
  }

  return null;
}

export function ApprovalTurnaroundMapCard({
  destinations,
}: ApprovalTurnaroundMapCardProps) {
  const [resolvedPositionByDestinationKey, setResolvedPositionByDestinationKey] = useState<
    Readonly<Record<string, Position | null>>
  >({});

  const topDestinations = useMemo(
    () => destinations.slice(0, 5),
    [destinations],
  );

  useEffect(() => {
    let isCancelled = false;

    const labelsNeedingGeocoding = topDestinations.filter((destination) => {
      const knownPosition = resolveKnownDestinationPosition(destination.label);
      if (knownPosition) {
        return false;
      }

      const key = getDestinationKey(destination.label);
      if (!key) {
        return false;
      }

      return geocodedDestinationCache.get(key) === undefined;
    });

    if (labelsNeedingGeocoding.length === 0) {
      return;
    }

    void (async () => {
      const entries = await Promise.all(
        labelsNeedingGeocoding.map(async (destination) => {
          const key = getDestinationKey(destination.label);
          if (!key) {
            return null;
          }

          const position = await geocodeDestination(destination.label);
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
          if (previous[key] !== position) {
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
  }, [topDestinations]);

  const points = useMemo<readonly ApprovalDestinationPoint[]>(
    () =>
      topDestinations.flatMap((destination) => {
        const key = getDestinationKey(destination.label);
        if (!key) {
          return [];
        }

        const knownPosition = resolveKnownDestinationPosition(destination.label);
        const geocodedPosition =
          resolvedPositionByDestinationKey[key] ??
          geocodedDestinationCache.get(key) ??
          null;
        const position = knownPosition ?? geocodedPosition;
        if (!position) {
          return [];
        }

        const [latitude, longitude] = position;
        return [
          {
            label: destination.label,
            value: destination.value,
            latitude,
            longitude,
          },
        ];
      }),
    [resolvedPositionByDestinationKey, topDestinations],
  );

  return (
    <article className="rounded-2xl border border-[#dfe1ed] bg-white p-4 xl:col-span-3">
      <h3 className="text-[14px] font-semibold tracking-tight text-[#2f3339]">
        Approval Turnaround Time
      </h3>
      <p className="mt-0.5 text-sm font-semibold text-[#26AF5D]">+33% this year</p>

      <div className="relative mt-3 overflow-hidden rounded-xl border border-[#e0e6f0] bg-gradient-to-br from-[#f8f9fc] via-[#f1f4f9] to-[#e8edf7] p-2">
        <div className="relative z-0" aria-label="Philippines destination map">
          <ApprovalTurnaroundMapCanvas points={points} />
        </div>

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-[#edf2fa]/5 via-transparent to-white/30" />

        <span className="absolute right-4 top-4 z-20 rounded-md border border-[#d8deea] bg-white/92 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#5d6780]">
          Avg 2.6 days
        </span>
      </div>

      {/* Demo Account Info Tab */}
      <div className="relative mt-2 flex justify-end">
        <div className="group relative inline-flex">
          <button
            type="button"
            aria-haspopup="true"
            aria-label="Show demo account credentials"
            className="flex items-center gap-1.5 rounded-md border border-[#dfe1ed] bg-[#f8fafd] px-3 py-1.5 text-xs font-medium text-[#5d6780] transition-colors hover:bg-[#edf0f6] hover:text-[#2f3339]"
          >
            <HelpCircle className="h-4 w-4" />
            Demo Account
          </button>

          <div
            role="tooltip"
            className="pointer-events-none absolute right-0 top-[calc(100%+8px)] z-30 w-[280px] translate-y-1 rounded-lg border border-[#dfe1ed] bg-white p-3 text-[11px] text-[#4a5266] opacity-0 shadow-lg transition-all duration-150 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:translate-y-0 group-focus-within:opacity-100"
          >
            <p className="text-xs font-semibold text-[#2f3339]">Demo Accounts</p>
            <div className="mt-2 space-y-2">
              <div className="rounded bg-[#f8fafd] p-2">
                <p className="font-medium text-[#2f3339]">Admin</p>
                <p>admin@travelorder.gov.ph</p>
                <p className="text-[#7d8598]">pass: changeme</p>
              </div>
              <div className="rounded bg-[#f8fafd] p-2">
                <p className="font-medium text-[#2f3339]">Approver</p>
                <p>deliza.camaro@travelorder.gov.ph</p>
                <p className="text-[#7d8598]">pass: changeme</p>
              </div>
              <div className="rounded bg-[#f8fafd] p-2">
                <p className="font-medium text-[#2f3339]">Regular</p>
                <p>margo@gmail.com</p>
                <p className="text-[#7d8598]">pass: ZJ5))b#9xgc!vw</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
