import {
  WelcomeBannerSkeleton,
  MetricCardsSkeleton,
  ListItemsSkeleton
} from "@/src/components/ui/skeleton";

export default function RegularLoading() {
  return (
    <div className="space-y-8 p-6">
      {/* Welcome Banner Skeleton */}
      <WelcomeBannerSkeleton />

      {/* Metrics Skeleton */}
      <MetricCardsSkeleton count={4} />

      {/* Recent Orders List Skeleton */}
      <div className="space-y-4">
        <div className="h-6 w-48 bg-[#e5e7eb] animate-pulse rounded" />
        <ListItemsSkeleton count={5} />
      </div>
    </div>
  );
}
