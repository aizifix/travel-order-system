import {
  Skeleton,
  TableSkeleton,
  MetricCardsSkeleton,
} from "@/src/components/ui/skeleton";
import { AdminShell } from "@/src/components/admin/admin-shell";

export default function AdminLoading() {
  return (
    <AdminShell title="Loading..." activeItem="dashboard">
      <div className="space-y-6 lg:space-y-8">
        <section className="rounded-2xl border border-[#dfe1ed] bg-white p-5 sm:p-6">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="mt-2 h-4 w-72" />
        </section>

        <MetricCardsSkeleton count={4} />

        <section className="space-y-3 rounded-2xl border border-[#dfe1ed] bg-white p-5 sm:p-6">
          <Skeleton className="h-6 w-52" />
          <Skeleton className="h-3 w-64" />
          <TableSkeleton rows={6} columns={8} />
        </section>
      </div>
    </AdminShell>
  );
}
