import { requireRole } from "@/src/server/auth/guards";
import { getUserWithDivision } from "@/src/server/auth/service";
import { getRequesterTravelOrderProfile } from "@/src/server/travel-orders/service";
import { RegularShell } from "@/src/components/regular/regular-shell";
import { Breadcrumbs } from "@/src/components/ui/breadcrumbs";
import CreateTravelOrderForm from "./create-travel-order-form";
import { createRegularTravelOrderAction } from "../actions";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

type CreateTravelOrderPageProps = Readonly<{
  searchParams: SearchParams;
}>;

function firstQueryValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

export default async function RegularTravelOrderCreatePage({
  searchParams,
}: CreateTravelOrderPageProps) {
  const session = await requireRole("regular");
  const resolvedSearchParams = await searchParams;
  const error = firstQueryValue(resolvedSearchParams.error);

  const [userData, profile] = await Promise.all([
    getUserWithDivision(session.userId),
    getRequesterTravelOrderProfile(session.userId),
  ]);

  const isProfileReady = Boolean(
    profile &&
      typeof profile.divisionId === "number" &&
      typeof profile.employmentStatusId === "number",
  );

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
        <h1 className="text-2xl font-semibold tracking-tight text-[#2f3339]">
          Submit Travel Order
        </h1>
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
          profileReady={isProfileReady}
          onSubmit={createRegularTravelOrderAction}
          initialError={error}
        />
      </div>
    </RegularShell>
  );
}
