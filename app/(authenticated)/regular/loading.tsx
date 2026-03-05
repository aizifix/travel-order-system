import {
  WelcomeBannerSkeleton,
  MetricCardsSkeleton,
  Skeleton,
  TableSkeleton,
} from "@/src/components/ui/skeleton";
import { RegularShell } from "@/src/components/regular/regular-shell";

export default function RegularLoading() {
  return (
    <RegularShell title="Loading..." activeItem="dashboard">
      <div className="space-y-8 lg:space-y-10">
        <WelcomeBannerSkeleton />
        <MetricCardsSkeleton count={4} />
        <section className="space-y-4 rounded-2xl border border-[#dfe1ed] bg-white p-5 sm:p-6">
          <Skeleton className="h-6 w-56" />
          <Skeleton className="h-3 w-64" />
          <TableSkeleton rows={6} columns={4} />
        </section>
      </div>
    </RegularShell>
  );
}
