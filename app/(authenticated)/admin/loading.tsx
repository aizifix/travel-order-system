import {
  PageHeaderSkeleton,
  FilterBarSkeleton,
  TableSkeleton,
  MetricCardsSkeleton
} from "@/src/components/ui/skeleton";

export default function AdminLoading() {
  return (
    <div className="space-y-6 p-6">
      {/* Page Header Skeleton */}
      <PageHeaderSkeleton />

      {/* Filter Bar Skeleton */}
      <FilterBarSkeleton />

      {/* Table Skeleton */}
      <TableSkeleton rows={5} columns={7} />
    </div>
  );
}
