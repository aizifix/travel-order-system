import { requireRole } from "@/src/server/auth/guards";
import { getUserWithDivision } from "@/src/server/auth/service";
import {
  getRequesterTravelOrderProfile,
  getTravelOrderCreationLookups,
} from "@/src/server/travel-orders/service";
import { RegularShell } from "@/src/components/regular/regular-shell";
import { Breadcrumbs } from "@/src/components/ui/breadcrumbs";
import CreateTravelOrderForm from "./create-travel-order-form";
import { createRegularTravelOrderAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function RegularTravelOrderCreatePage() {
  const session = await requireRole("regular");

  const [userData, profile] = await Promise.all([
    getUserWithDivision(session.userId),
    getRequesterTravelOrderProfile(session.userId),
  ]);
  const lookups = await getTravelOrderCreationLookups(profile?.divisionId ?? null);

  const hasRequiredLookups =
    lookups.travelTypes.length > 0 &&
    lookups.transportations.length > 0 &&
    lookups.recommendingApprovers.length > 0;

  const isProfileReady = Boolean(
    profile &&
      typeof profile.divisionId === "number" &&
      typeof profile.employmentStatusId === "number",
  );

  const canSubmit = hasRequiredLookups && isProfileReady;

  return (
    <RegularShell
      title="Create Travel Order"
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
      <div className="space-y-6">
        <Breadcrumbs
          items={[
            { label: "Travel Orders", href: "/regular/travel-orders" },
            { label: "Create Travel Order" },
          ]}
        />
        <CreateTravelOrderForm
          dateFiledLabel={new Intl.DateTimeFormat("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }).format(new Date())}
          profile={
            profile
              ? {
                  fullName: profile.fullName,
                  divisionName: profile.divisionName,
                  positionName: profile.positionName,
                  designationName: profile.designationName,
                  employmentStatusName: profile.employmentStatusName,
                }
              : null
          }
          lookups={lookups}
          canSubmit={canSubmit}
          onSubmit={async (formData: FormData) => {
            "use server";
            await createRegularTravelOrderAction(formData);
          }}
        />
      </div>
    </RegularShell>
  );
}
