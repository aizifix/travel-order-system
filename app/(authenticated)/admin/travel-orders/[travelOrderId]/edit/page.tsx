import Link from "next/link";
import { requireRole } from "@/src/server/auth/guards";
import { getUserWithDivision } from "@/src/server/auth/service";
import { AdminShell } from "@/src/components/admin/admin-shell";

export const dynamic = "force-dynamic";

type Params = Promise<{ travelOrderId: string }>;

type AdminTravelOrderEditPageProps = Readonly<{
  params: Params;
}>;

export default async function AdminTravelOrderEditPage({
  params,
}: AdminTravelOrderEditPageProps) {
  const session = await requireRole("admin");
  const [resolvedParams, userData] = await Promise.all([
    params,
    getUserWithDivision(session.userId),
  ]);

  return (
    <AdminShell
      title={`Edit TO #${resolvedParams.travelOrderId}`}
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
      <section className="rounded-2xl border border-[#dfe1ed] bg-white p-6">
        <h2 className="text-xl font-semibold tracking-tight text-[#2f3339]">
          Edit Travel Order
        </h2>
        <p className="mt-2 text-sm text-[#5d6780]">
          TO #{resolvedParams.travelOrderId} is ready for edit workflow wiring.
          Printing is still unavailable.
        </p>
        <p className="mt-1 text-xs text-[#7d8598]">
          For now, full travel-order details remain viewable in the List View
          table.
        </p>
        <div className="mt-5">
          <Link
            href="/admin/travel-orders"
            className="inline-flex items-center rounded-lg border border-[#dfe1ed] px-4 py-2 text-sm font-semibold text-[#5d6780] transition hover:bg-[#f3f5fa]"
          >
            Back to Travel Orders
          </Link>
        </div>
      </section>
    </AdminShell>
  );
}
