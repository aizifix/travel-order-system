import Link from "next/link";
import { requireRole } from "@/src/server/auth/guards";
import { getUserWithDivision } from "@/src/server/auth/service";
import { AdminShell, NotificationBellButton } from "@/src/components/admin/admin-shell";

export const dynamic = "force-dynamic";

type AdminTravelOrderCreatePageProps = Readonly<object>;

export default async function AdminTravelOrderCreatePage({}: AdminTravelOrderCreatePageProps) {
  const session = await requireRole("admin");
  const userData = await getUserWithDivision(session.userId);

  return (
    <AdminShell
      title="Create Travel Order"
      activeItem="travel-orders"
      headerAction={<NotificationBellButton count={3} />}
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
          Create New Travel Order
        </h2>
        <p className="mt-2 text-sm text-[#5d6780]">
          Fill out the form below to create a new travel order.
        </p>
        <p className="mt-1 text-xs text-[#7d8598]">
          For now, this is a placeholder page. Full travel-order creation workflow
          will be wired here.
        </p>
        <div className="mt-5">
          <Link
            href="/admin/travel-orders"
            className="inline-flex items-center rounded-lg border border-[#dfe1ed] px-4 py-2 text-sm font-semibold text-[#5d6780] transition hover:bg-[#f3f5fa]"
          >
            Back to Travel Orders Table
          </Link>
        </div>
      </section>
    </AdminShell>
  );
}
