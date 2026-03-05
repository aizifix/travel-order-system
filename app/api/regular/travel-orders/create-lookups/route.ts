import { NextResponse } from "next/server";
import { getCurrentSession } from "@/src/server/auth/guards";
import {
  getRequesterTravelOrderProfile,
  getTravelOrderCreationLookups,
} from "@/src/server/travel-orders/service";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json(
      { message: "Unauthorized" },
      { status: 401 },
    );
  }

  if (session.role !== "regular") {
    return NextResponse.json(
      { message: "Forbidden" },
      { status: 403 },
    );
  }

  try {
    const profile = await getRequesterTravelOrderProfile(session.userId);
    const lookups = await getTravelOrderCreationLookups(profile?.divisionId ?? null);

    return NextResponse.json(
      {
        lookups,
        hasRequiredLookups:
          lookups.travelTypes.length > 0 &&
          lookups.transportations.length > 0 &&
          lookups.recommendingApprovers.length > 0,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error("Failed to load travel order lookups", error);
    return NextResponse.json(
      { message: "Unable to load travel order lookups." },
      { status: 500 },
    );
  }
}
