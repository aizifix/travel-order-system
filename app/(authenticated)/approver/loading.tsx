import {
  WelcomeBannerSkeleton,
  MetricCardsSkeleton,
  TableSkeleton
} from "@/src/components/ui/skeleton";

export default function ApproverLoading() {
  return (
    <div className="space-y-8 p-6">
      {/* Welcome Banner Skeleton */}
      <WelcomeBannerSkeleton />

      {/* Metrics Skeleton */}
      <MetricCardsSkeleton count={4} />

      {/* Table Section Skeleton */}
      <div className="space-y-4">
        <div className="h-6 w-48 bg-[#e5e7eb] animate-pulse rounded" />
        <TableSkeleton rows={5} columns={7} />
      </div>
    </div>
  );
}
