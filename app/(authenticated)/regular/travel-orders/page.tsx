import { requireRole } from "@/src/server/auth/guards";
import { getUserWithDivision } from "@/src/server/auth/service";
import {
  getRequesterTravelOrderProfile,
  getTravelOrderCreationLookups,
  getTravelOrdersForRequester,
} from "@/src/server/travel-orders/service";
import { RegularShell } from "@/src/components/regular/regular-shell";
import { RegularTravelOrdersView } from "@/src/components/regular/travel-orders/regular-travel-orders-view";
import {
  cancelRegularTravelOrderAction,
  createRegularTravelOrderAction,
  updateRegularTravelOrderAction,
} from "./actions";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

type RegularTravelOrdersPageProps = Readonly<{
  searchParams: SearchParams;
}>;

function firstQueryValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

function getFeedback(searchParams: {
  [key: string]: string | string[] | undefined;
}):
  | Readonly<{
      type: "success" | "error";
      text: string;
    }>
  | undefined {
  const error = firstQueryValue(searchParams.error);
  if (error) {
    return { type: "error", text: error };
  }

  const createdOrderNo = firstQueryValue(searchParams.created);
  if (createdOrderNo) {
    const mode = firstQueryValue(searchParams.mode);
    if (mode === "draft") {
      return {
        type: "success",
        text: `Travel order ${createdOrderNo} was saved as draft.`,
      };
    }

    return {
      type: "success",
      text: `Travel order ${createdOrderNo} was submitted for approval.`,
    };
  }

  const updatedOrderNo = firstQueryValue(searchParams.updated);
  if (updatedOrderNo) {
    return {
      type: "success",
      text: `Travel order ${updatedOrderNo} was updated successfully.`,
    };
  }

  const cancelledOrderNo = firstQueryValue(searchParams.cancelled);
  if (cancelledOrderNo) {
    return {
      type: "success",
      text: `Travel order ${cancelledOrderNo} was cancelled.`,
    };
  }

  return undefined;
}

export default async function RegularTravelOrdersPage({
  searchParams,
}: RegularTravelOrdersPageProps) {
  const session = await requireRole("regular");
  const resolvedSearchParams = await searchParams;
  const feedback = getFeedback(resolvedSearchParams);

  const [userData, profile, rows] = await Promise.all([
    getUserWithDivision(session.userId),
    getRequesterTravelOrderProfile(session.userId),
    getTravelOrdersForRequester(session.userId, 30),
  ]);
  const lookups = await getTravelOrderCreationLookups(profile?.divisionId ?? null);

  return (
    <RegularShell
      title="Travel Orders"
      activeItem="travel-orders"
      user={
        userData
          ? {
              name: `${userData.firstName} ${userData.lastName}`.trim(),
              role: userData.role.charAt(0).toUpperCase() + userData.role.slice(1),
              division: userData.division ?? "No Division Assigned",
            }
          : undefined
      }
    >
      <RegularTravelOrdersView
        profile={profile}
        lookups={lookups}
        rows={rows}
        onUpdate={updateRegularTravelOrderAction}
        onCancel={cancelRegularTravelOrderAction}
        feedback={feedback}
      />
    </RegularShell>
  );
}
